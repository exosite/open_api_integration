#!/bin/node

/**
* This script validate a service swagger schema
**/

const Fs = require('fs');
const Path = require('path');
const ZSchema = require('z-schema');
const LuaParser = require('luaparse');
const Yaml = require('js-yaml');
const DeepCopy = require('deep-copy');
const Promise = require('bluebird');
const Tls = require('tls');

const exchangeSchema = require('./exchangeServiceSchemaDefinition.json');
const ASYNC_TIMEOUT = 5000;
const serviceFolder = process.argv.slice(2)[0] || './examples';

ZSchema.registerFormat('json', str => {
  try {
    JSON.parse(str);
    return true;
  } catch (err) {
    return false;
  }
});

ZSchema.registerFormat('lua', str => {
  try {
    LuaParser.parse(str, { luaVersion: '5.2' });
    return true;
  } catch (err) {
    console.log(`[swagger] lua parsing error: ${err.message}`);
    return false;
  }
});

ZSchema.registerFormat('secureHost', (host, callback) => {
  const hostParts = host.split(':');
  const domain = hostParts[0];
  const port = hostParts[1] || 443;
  const options = {servername: domain};
  const client = Tls.connect(port, domain, options, callback.bind(this, true));
  client.on('error', (err) => {
    console.log(`Host checking failed with ${err}, ${host}`);
    callback(false); // eslint-disable-line standard/no-callback-literal
    client.end();
  });

  setTimeout(_ => {
    console.log(`Host checking timeout: ${host}`);
    callback(false); // eslint-disable-line standard/no-callback-literal
    client.end();
  }, ASYNC_TIMEOUT - 500);
});

/**
* Custom error constructor
*
* @param {string|Error} message or error
* @param {Error} [error]
* @returns {Error}
**/
class WrongSwaggerError extends Error {
  constructor (message, error) {
    if (!error) {
      error = message;
    }
    if (typeof message !== 'string') {
      message = error.message || error[0] && error[0].message || '';
    }
    super(`Wrong Swagger definition: ${message}`);
    this.statusCode = 400;
    this.error = error.error || error.data || error.details || error;
  }
}

const validator = new ZSchema({
  asyncTimeout: ASYNC_TIMEOUT,
  ignoreUnknownFormats: true
});
const LIFECYCLETAGS = ['x-exosite-init', 'x-exosite-info', 'x-exosite-update', 'x-exosite-gc'];

/**
* Resolve schema references
*
* @param {object} obj the current schema node
* @param {object} schema the full swagger
* @param {[string]} depth current tree depth to avoid endless recursion
* @returns {object} resolved node
**/
function resolveReferences (obj, schema, depth = []) {
  if (!obj) {
    return obj;
  }

  Object.assign(obj, obj.schema || {});
  delete obj.schema;

  if ('$ref' in obj) {
    if (depth.includes(obj.$ref)) {
      throw new WrongSwaggerError(`Circular schema reference in ${schema.alias || schema.info.title}: ${depth}`);
    }
    depth.push(obj.$ref);
    const path = obj.$ref.split('#').pop();

    // TODO could get remote reference.. not for now
    if (!path) {
      throw new WrongSwaggerError(`Wrong reference ${obj.$ref}: no path in schema ${schema.alias || schema.info.title}`);
    }
    const ref = path.replace(/^\//, '').split('/')
      .filter(path => path)
      .reduce((ref, path) =>
        ref && ref[path], schema);

    if (!ref || typeof ref !== 'object') {
      throw new WrongSwaggerError(`Wrong reference ${obj.$ref}: cannot resolve ${path} or wrong type ${typeof ref}  in schema ${schema.alias || schema.info.title}`);
    }
    if (!('type' in ref)) {
      ref.type = 'object';
    }
    const definition = resolveReferences(ref, schema, depth);
    if (!definition) {
      return;
    }
    if (obj.description && definition.description && obj.description !== definition.description) {
      obj.title = obj.description;
    }
    Object.assign(obj, definition);
    delete obj.$ref;
  }

  // resolve parameters
  if (typeof obj.properties === 'object') {
    for (var prop in obj.properties) {
      const subProperty = resolveReferences(obj.properties[prop], schema, depth.concat(prop));

      if (!subProperty) {
        delete obj.properties[prop];
        continue;
      }

      // comply draft 3+ JSON schema required for parameters
      if (obj.properties[prop].required === true) {
        if (typeof obj.required !== 'object' || !(obj.required instanceof Array)) {
          obj.required = [];
        }
        if (obj.required.indexOf(prop) === -1) {
          obj.required.push(prop);
        }
        delete obj.properties[prop].required;
      }
    } // for properties
  }
  if (typeof obj.patternProperties === 'object') {
    for (var pattProp in obj.patternProperties) {
      const subProperty = resolveReferences(obj.patternProperties[pattProp], schema, depth.concat(pattProp));

      if (!subProperty) {
        delete obj.patternProperties[pattProp];
      }
    } // for patternProperties
  }
  if (typeof obj.additionalProperties === 'object') {
    const subProperty = resolveReferences(obj.additionalProperties, schema, depth.concat('additionalProperties'));
    if (!subProperty) {
      delete obj.additionalProperties;
    }
  }

  // resolve items
  if ('items' in obj) {
    resolveReferences(obj.items, schema, depth.concat('[]'));
  }
  return obj;
} // resolveReferences

/**
 * Parse & validate a swagger schema
 *
 * @param {string} schema SWAGGER
 * @return {object} swagger
 **/
function parse (schema) {
  if (typeof schema === 'object') {
    return schema;
  }
  if (typeof schema !== 'string') {
    throw new WrongSwaggerError('Schema must be a string');
  }
  if (!schema.length) {
    throw new WrongSwaggerError('Schema cannot be empty');
  }
  try {
    return schema.charAt(0) === '{' ? JSON.parse(schema)
      : Yaml.safeLoad(schema);
  } catch (error) {
    throw new WrongSwaggerError(`Unable to parse the swagger schema: ${error.message}`);
  }
}

function _customValidate (schema) {
  if (!schema.schemes || !schema.schemes.length) {
    schema.schemes = ['https'];
  } else if (schema.schemes[0] !== 'https') {
    // Un-secured external service, reject it.
    throw new WrongSwaggerError('Invalid url, https protocol is required');
  }

  // @TODO instead make a 'resolveReferences' function that doesn't modify the schema
  const copy = schema;
  schema = DeepCopy(schema);

  if ('parameters' in schema) {
    for (let parameter in schema.parameters) {
      resolveReferences(schema.parameters[parameter], schema, [ 'parameters', parameter ]);
    }
  }

  // map operations to ensure the unique
  const operationIdsMap = {};
  for (var path in schema.paths) {
    // get parameters from the path
    const pathParams = {};
    if ('parameters' in schema.paths[path]) {
      for (let i = 0, len = schema.paths[path].parameters.length; i < len; i++) {
        resolveReferences(schema.paths[path].parameters[i], schema, [ path, 'parameters', i ]);
        pathParams[schema.paths[path].parameters[i].name] = schema.paths[path].parameters[i];
      }
    }

    for (var method in schema.paths[path]) {
      // skip custom fields
      if (method === 'parameters' || method.toLowerCase().indexOf('x-') !== -1) {
        continue;
      } else if (method === '$ref') {
        // @TODO fetch the reference: resolve(schema.paths[path][method])
        continue;
      }

      const operation = schema.paths[path][method];
      if (operation.operationId in operationIdsMap) {
        // Duplicated operationId
        throw new WrongSwaggerError(`Duplicated operationId ${operation.operationId} at ${method} ${path}`);
      } else { // Add to map
        operationIdsMap[operation.operationId] = operation;
      } // If else operation

      if (operation.responses) {
        for (let resp in operation.responses) {
          if ('schema' in operation.responses[resp]) {
            resolveReferences(operation.responses[resp], schema, [ path, method, 'responses', resp ]);
          }
        } // for responses
      } // if operation.responses

      if (operation.parameters) {
        // Map operations to ensure the unique
        const parameters = Object.assign({}, pathParams);

        // Check parameters uniqueness
        for (let pi = 0, plen = operation.parameters.length; pi < plen; pi++) {
          resolveReferences(operation.parameters[pi], schema, [ path, method, 'parameters', pi ]);
          if (parameters[operation.parameters[pi].name]) {
            throw new WrongSwaggerError(`Duplicated parameters "${operation.parameters[pi].name}" in operation ${operation.operationId}`);
          }

          parameters[operation.parameters.name] = operation.parameters[pi];
        } // for parameters
      } // if operation.parameters
    } // for each operations
  } // for each paths

  // Ensure service namespace life-cycle operations exists
  const missingLCOperation = LIFECYCLETAGS.find(tag => tag in schema && !(schema[tag] in operationIdsMap));
  if (missingLCOperation) {
    throw new WrongSwaggerError(`Non-existing ${missingLCOperation} operation ${schema[missingLCOperation]}`);
  }
  return copy;
} // _customValidate

/**
 * Validate a Service schema, and ensure it is Pegasus compatible
 *
 * @param {object|string} schema SWAGGER
 * @returns {promise} swagger
 **/
async function validate (schema) {
  if (!schema) return;
  schema = parse(schema);

  return Promise.fromCallback(callback =>
    validator.validate(schema, exchangeSchema, callback), {multiArgs: true})
    .catch(error =>
      Promise.reject(new WrongSwaggerError(error)))
    .spread((valid, error) =>
      error ? Promise.reject(new WrongSwaggerError(error))
        : Promise.try(_ => _customValidate(schema)));
} // validateSwagger

function loadAndTestService (service) {
  var swagger;
  if (service.match(/\.yaml$/)) {
    const yaml = require('js-yaml');
    const YAMLSchema = Fs.readFileSync(Path.resolve(__dirname, Path.join(serviceFolder, service)), 'utf8');
    try {
      swagger = yaml.safeLoad(YAMLSchema);
    } catch (err) {
      return Promise.reject(new Error(`Error during YAML parsing of service ${service}: ${err.message}`));
    }
  } else {
    // Expect JSON
    swagger = require(`../${serviceFolder}/${service}`);
  }
  return validate(swagger)
    .then(
      _ => console.log(`${service}: ok`),
      err =>
      console.log(`Invalid ${service} schema:`, JSON.stringify(err.error || err, null, 2)) ||
      Promise.reject(new Error(`Invalid ${service} schema: ${err.message || err}`)));
}

// load and check all services in the services directory
console.log(`Validating core services from folder ${serviceFolder} ..`);
Promise.all(
  Fs.readdirSync(Path.resolve(__dirname, serviceFolder))
    .filter(file => ['yaml', 'json'].indexOf(file.split('.')[1]) !== -1)
    .map(loadAndTestService))
  .then(
    _ => console.log('All services are valid!') || process.exit(0),
    err => console.log(err.message) || process.exit(1));
