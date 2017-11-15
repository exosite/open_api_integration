# Open API Integration
[OpenAPI](https://www.openapis.org/) is the name of the initiative behind defining Swagger specification which describe a REST web-API.

Murano is utilizing this format as description to integrate its internal and external Services. It also provided the dynamic documentation support for UI Editor auto-completion & [docs.exosite.com/reference/services](docs.exosite.com/reference/services).

## Murano Service Definition
Murano Services are Web-Services providing capability through REST HTTP APIs. To expose and describe those APIs Murano uses the [Swagger V2 (OpenAPI) standard](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md) with a few additional properties described in this page. Malformed schema will be rejected upon creation to avoid later confusion for the user.

### Examples

Several example are available and can be used as a base for new services:

#### Example 1: Minimal Service
This is a simple service definition with x-exosite-health-path and x-exosite-example fields to describe the minimal service.

Link: [minimalservice.yaml](examples/minimalservice.yaml)

#### Example 2: Storage Service
This is a minimal service definition for a Storage service with custom configuration settings. It demonstrates how to use of the solution lifecycle event: x-exosite-init, x-exosite-info, x-exosite-update & x-exosite-gc.

Link: [storageservice.yaml](examples/storageservice.yaml)

#### Example 3: Federated Service
This is a SMS notifications service definition for using some service provider. It is include the x-exosite-config-parameters, x-exosite-userfield, x-exosite-secret-field, x-exosite-restricted and x-exosite-example fields.

Link: [sms.yaml](examples/sms.yaml)

### Quick Start

#### Step 1: Start Editing your API swagger v2
The first step is to create a file in yaml format to describing your web service API.

If your web service API implementation is not done yet, have a look to [the various tools & frameworks](https://swagger.io/open-source-integrations) available to help building APIs following swagger specification. Including the official [stub code generator](https://swagger.io/swagger-codegen/).

Otherwise start building your yaml file in your favorite code editor. You may consider using the [swagger online editor](https://editor.swagger.io/) to help you get started.

#### Step 2: Murano Required Fields
Once you have a valid swagger description, take the time to go through this document to make sure all required fields and section as described in [Schema Definition](#schema-definition), including in the nested structures. (e.g. swagger, info, host, paths, etc).

#### Step 3: Murano Custom Fields
Murano provides several swagger extension tag, it is time to review them and see if your service usage scenario requires them. (e.g. [x-exosite-example, x-exosite-init, x-exosite-health-path and so on](#schema-definition).)

#### Step 4: Describe Your Service
The Swagger file is the documentation available to your user. Make sure it is fully document. In particular the `description` field is always required in any nested structure. See the [Service Documentation](#service-documentation) chapter.

### Service Documentation
In Murano, services capabilities are documented through the OpenAPI schema and will be used for dynamic documentation. It is therefore important to provide clear description for each element in the schema.

How to document the Service:

* `info` section: This top level information will be the flag of your service in Murano. Make sure the title and description are comprehensive and fully describe your service capability. You are also encouraged to add links to your own documentation and tutorials if you have one
* `description` field: A detailed description of the [operation, parameter, etc..], supporting MD tags. This field is **always required**.
* `summary` field: A short one-line plain text description for operations & parameters.

Make some examples:

* `example` field: Data structure examples for JSONSchema definition.
* `x-exosite-example` field: Scripting example for Operation calls.

### Schema Definition

#### Required Fields
**Important: The `description` field is always required including in nested JSONSchema definitions.**

| Field Name | Type   | Example                         | Description                                                                                                                                                         |
|------------|--------|---------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| swagger    | string | `'2.0'`                           | Specifies the Swagger Specification version being used. It can be used by the Swagger UI and other clients to interpret the API listing. The value MUST be **2.0**. |
| info       | object | [`Info Object`](#info-object)   | Service description.                                                                                                                                                |
| host       | string | `'domain.of.your.service'`        | Used by Murano to make service calls. The external host (name or ip) serving the Service.                                                                           |
| paths      | string | [`Paths Object`](#paths-object) | Defines the Service API capability, called operation.                                                                                                               |

#### Murano Specific Fields(Optional)

| Field Name                  | Type     | Example                                                   | Description                                                                                                                                                                                                                                                                                                                |
|-----------------------------|----------|-----------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| x-exosite-health-path       | string   | `'/health'`                                                 | Path to health check endpoint. Default basePath. A GET request will be made expecting a 2xx status code.                                                                                                                                                                                                                   |
| x-exosite-init              | string   | `'someInit'`                                                | An operationId reference triggered by Murano when a user subscribe to this service.This is concretely done when a service get configured in a given solution including during a solution creation.<br><br>This event is usually used for service to setup namespace for the user solution. Example: create a new database. |
| x-exosite-info              | string   | `'someInfo'`                                                | An operationId reference triggered by Murano to retrieve a subscription informations to return to the users.                                                                                                                                                                                                               |
| x-exosite-update            | string   | `'someUpdate'`                                              | An operationId reference triggered by Murano when a user update the service configuration for this solution.                                                                                                                                                                                                               |
| x-exosite-gc                | string   | `'someGc'`                                                  | An operationId reference triggered by Murano when a user un-subscribe to this service. Including when the related solution is deleted.                                                                                                                                                                                     |
| x-exosite-config-parameters | [object] | [[`Config Parameters Object`](#config-parameters-object)] | An array of parameters (JSON schema) defining the data set in the service Configuration parameters field for this serviceconfig.(Service configuration parameters are used as default value during operation call from Lua script)                                                                                         |

#### Optional Fields

| Field Name          | Type      | Example                                                                                                                                 | Description                                                                                                                                                                                                                                                                                                                                                |
|---------------------|-----------|-----------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| basePath            | string    | `'/'`                                                                                                                                     | Concatenated to host by Murano for service calls                                                                                                                                                                                                                                                                                                           |
| schemes             | [`https`] | [`'https'`]                                                                                                                               | Used by Murano for service calls along with host & basePath. **Must be https**.                                                                                                                                                                                                                                                                            |
| consumes            | [string]  | [`'application/json'`]                                                                                                                    | A list of MIME types the APIs can consume. Currently **only 'application/json'** (default) and **'application/x-www-form-urlencoded' is supported**.                                                                                                                                                                                                                            |
| produces            | [string]  | [`'application/json'`]                                                                                                                    | A list of MIME types the APIs can produce. Currently **only 'application/json' (default) is supported**.                                                                                                                                                                                                                            |
| definitions         | object    | [`Definitions Object`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#definitionsObject)                      | An object to hold data types produced and consumed by operations.                                                                                                                                                                                                                                                                                          |
| parameters          | object    | [`Parameters Definitions Object`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#parametersDefinitionsObject) | An object to hold parameters that can be used across operations. This property does not define global parameters for all operations.                                                                                                                                                                                                                       |
| responses           | object    | [`Responses Definitions Object`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#responsesDefinitionsObject)   | Expected results of the service calls.                                                                                                                                                                                                                                                                                                                     |
| securityDefinitions | object    | [`Security Definitions Object`](#security-definitions-object)                                                                           | Security scheme definitions that can be used across the specification.                                                                                                                                                                                                                                                                                     |
| security            | [object]  | [[`Security Requirement Object`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#securityRequirementObject)]   | Security auth to enforce for all service operations, need to be matched with the item name defined in securityDefinitions section.                                                                                                                                                                                                                         |
| tags                | [object]  | [[`Tag Object`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#tagObject)]                                    | A list of tags used by the specification with additional metadata. The order of the tags can be used to reflect on their order by the parsing tools. Not all tags that are used by the Operation Object must be declared. The tags that are not declared may be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique. |
| externalDocs        | object    | [`External Documentation Object`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#externalDocumentationObject) | Additional external documentation.                                                                                                                                                                                                                                                                                                                         |

#### Info Object
The object provides metadata about the API. Reference: the official [Info Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#info-object) documentation.

**Info Object Example:**
```yaml
title: Swagger Sample App
description: This is a sample server Petstore server.
termsOfService: http://swagger.io/terms/
contact:
  name: API Support
  url: http://www.swagger.io/support
  email: support@swagger.io
license:
  name: Apache 2.0
  url: http://www.apache.org/licenses/LICENSE-2.0.html
version: "1.0.1"
```

##### Required Fields

| Field Name  | Type   | Example                                                                                                    | Description                                               |
|-------------|--------|------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------|
| title       | string | `Swagger Sample App`                                                                                       | The title of the application.                             |
| description | string | `This is a sample server Petstore server.`                                                                 | A full description of the service. Can contain HTML tags. |
| contact     | object | [`Contact Object`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#contactObject) | The contact information for the exposed API.              |
| version     | string | `1.0.0`                                                                                                    | Provides the version of the application API.              |

##### Optional Fields

| Field Name    | Type   | Example                                                                                                    | Description                                  |
|---------------|--------|------------------------------------------------------------------------------------------------------------|----------------------------------------------|
| termOfService | string | `http://swagger.io/terms/`                                                                                 | The Terms of Service for the API.            |
| license       | object | [`License Object`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#licenseObject) | The license information for the exposed API. |

#### Paths Object
Holds the relative paths to the individual endpoints. The path is appended to the basePath in order to construct the full URL. Reference: the official [Paths Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#paths-object) documentation.

**Paths Object Example:**
```yaml
/pets:
  get:
    description: Returns all pets from the system that the user has access to
    produces:
    - application/json
    responses:
      '200':
        description: A list of pets.
        schema:
          type: array
          items:
            $ref: '#/definitions/pet'
```

##### Required Fields

| Field Pattern | Type   | Example                                 | Description                                                                                                                                                                                                                                                                        |
|---------------|--------|-----------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| /{path}       | object | [`Path Item Object`](#path-item-object) | A relative path to an individual endpoint. The field name MUST begin with a slash. The path is appended to the basePath in order to construct the full URL. [Path templating](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#pathTemplating) is allowed. |

#### Path Item Object
Paths and underlying operations defines the features exposed to Murano and allow user Lua scripts to make service calls. Reference: official [Path Item Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#path-item-object) documentation.

**Path Item Object Example:**
```yaml
get:
  description: Returns pets based on ID
  summary: Find pets by ID
  operationId: getPetsById
  produces:
  - application/json
  - text/html
  responses:
    '200':
      description: pet response
      schema:
        type: array
        items:
          $ref: '#/definitions/Pet'
    default:
      description: error payload
      schema:
        $ref: '#/definitions/ErrorModel'
parameters:
- name: id
  in: path
  description: ID of pet to use
  required: true
  type: array
  items:
    type: string
  collectionFormat: csv
```

##### Optional Fields

| Field Pattern | Type     | Example                                                                                                                                                  | Description                                                                                                                                                                                                                                                          |
|---------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| $ref          | string   | `'#/definitions/Pet'`                                                                                                                                    | Allows for an external definition of this path item. The referenced structure MUST be in the format of a [Path Item Object](#path-item-object). If there are conflicts between the referenced definition and this Path Item's definition, the Path Item’s definition prevails. |
| get           | object   | [`Operation Object`](#operation-object)                                                                                                                  | A definition of a GET operation on this path.                                                                                                                                                                                                                        |
| put           | object   | [`Operation Object`](#operation-object)                                                                                                                  | A definition of a PUT operation on this path.                                                                                                                                                                                                                        |
| post          | object   | [`Operation Object`](#operation-object)                                                                                                                  | A definition of a POST operation on this path.                                                                                                                                                                                                                       |
| delete        | object   | [`Operation Object`](#operation-object)                                                                                                                  | A definition of a DELETE operation on this path.                                                                                                                                                                                                                     |
| options       | object   | [`Operation Object`](#operation-object)                                                                                                                  | A definition of a OPTIONS operation on this path.                                                                                                                                                                                                                    |
| head          | object   | [`Operation Object`](#operation-object)                                                                                                                  | A definition of a HEAD operation on this path.                                                                                                                                                                                                                       |
| patch         | object   | [`Operation Object`](#operation-object)                                                                                                                  | A definition of a PATCH operation on this path.                                                                                                                                                                                                                      |
| parameters    | [object] | [[`Parameter Object`](#parameter-object) / [`Reference Object`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#referenceObject)] | Common set of parameters for all operations in this path.<br>**Important**: At least one of path parameters or operation parameters is required.                                                                                                                     |

#### Operation Object
Describes a single API operation on a path. Reference: official [Operation Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#operation-object) documentation.

**Operation Object Example:**
```yaml
tags:
- pet
summary: Updates a pet in the store with form data
description: ""
operationId: updatePetWithForm
consumes:
- application/json
produces:
- application/json
parameters:
- name: petId
  in: path
  description: ID of pet that needs to be updated
  required: true
  type: string
- name: name
  in: query
  description: Name of the object to fetch
  required: false
  type: string
- name: status
  in: body
  description: Updated status of the pet
  required: true
  schema:
    type: array
    items:
      type: string
responses:
  '200':
    description: Pet updated.
  '405':
    description: Invalid input
security:
- petstore_auth:
  - write:pets
  - read:pets
x-exosite-hidden: false
x-exosite-restricted: false
```

##### Required Fields

| Field name  | Type     | Example                                                                                                                                                  | Description                                                                                                                                                                  |
|-------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| operationId | string   | `'myfunction'`                                                                                                                                           | Service operation reference, must be unique within the service. Used by in Lua script along with service Alias to make service calls.Eg. Servicealias.myfunction(parameters) |
| description | string   | `Something description`                                                                                                                                  | A verbose explanation of the operation behavior. Used in the documentation.                                                                                                  |
| parameters  | [object] | [[`Parameter Object`](#parameter-object) / [`Reference Object`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#referenceObject)] | Operation specific parameters.                                                        |
| responses   | object   | [`Responses Object`](#responses-object)                                                                                                                  | Expected results of the service calls.<br>At least one response type is required.                                                                                                                                       |

##### Murano Specific Fields(Optional)

| Field name             | Type        | Example                                                                                                                                                       | Description                                                                                                                                                                                          |
|------------------------|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| x-exosite-hidden       | boolean     | `false`                                                                                                                                                       | If set to *true*: hide this operation from documentation.                                                                                                                                            |
| x-exosite-restricted | boolean     | `false`                                                                                                                                                       | If set to true: prevent this operation from being exposed in Lua scripting<br><br>For example, this option is used to restrict life-cycle operations like initialize or delete the user namespace.   |
| x-exosite-example      | string: Lua | `-- Example of Lua`<br>`script using the Operation`<br><br>`local parameters = {myparameter = "value"}`<br>`Local result = Myservice.myoperation(parameters)` | Provide an example of the usage of the operation call.<br>The value is required to be a valid Lua script string.<br><br>**Important**: A known bug requires to put a double return carriage after each Lua comment. |

#### Parameter Object
Describes a single operation parameter. Reference: official [Parameter Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#parameterObject) documentation.

**Important: [collectionFormat: "multi"] is currently not supported by murano.**

**Parameter Object Example (Body Parameters):**
```yaml
name: user
in: body
description: user to add to the system
required: true
schema:
  type: array
  items:
    type: string
```

**Parameter Object Example (Header Parameters):**
```yaml
name: user
in: body
description: user to add to the system
required: true
schema:
  type: array
  items:
    type: string
```

**Parameter Object Example (Path Parameters):**
```yaml
name: user
in: body
description: user to add to the system
required: true
schema:
  type: array
  items:
    type: string
```

**Parameter Object Example (Optional Query Parameters):**
```yaml
name: id
in: query
description: ID of the object to fetch
required: false
type: array
items:
  type: string
```

##### Required Fields

| Field name  | Type   | Example                 | Description                                                                                                                                                                                                         |
|-------------|--------|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| name        | string | `id`                    | The name of the parameter as provided from Lua scripting. Used by Murano for building service calls requests.<br>**Important**: Must be unique per operation. Keep in mind potential Path, Security and Operation parameters collision.           |
| in          | string | `path`                  | The location of the parameter. Possible values are "query", "header", "path" or "body". Used by Murano to build the service calls http requests.<br>**Important**: "formData" is currently not supported by Murano. |
| description | string | `Something description` | A description of the parameter.                                                                                                                                                                                     |

##### Murano Specific Fields(Optional)

| Field name                       | Type                               | Example                              | Description                                                                                                                                                                                                                                                                                                                                                                      |
|----------------------------------|------------------------------------|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| x-exosite-hidden                 | boolean                            | `false`                              | If set to *true*: hide this parameter from documentation.                                                                                                                                                                                                                                                                                                                        |
| x-exosite-restricted           | boolean                            | `false`                              | If set to true: prevent this parameter to be available from Lua scripting. The value will get set from the service configuration parameters.<br><br>For example, this option is used to restrict credential parameters to be given from the script code and inforce the service configuration parameter.                                                                         |
| x-exosite-from                   | domain / solution_id / business_id | `domain / solution_id / business_id` | Populate this parameter from a user context value.<br>This option is generally used along with "x-exosite-restricted: true" to prevent user for overriding his context and potentially accessing other user data.                                                                                                                                                              |
| x-exosite-expand-body-parameters | boolean                            | `true`                               | Default=true, for a body parameter of type=object, a value set to false would force the body parameter to be explicitly given from script call.<br>Example:<br>**x-exosite-expand-body-parameters: true (default)**<br>`Keystore.set({key = "xxx", body = "value"})`<br>**x-exosite-expand-body-parameters: false** <br>`Keystore.set({key = "xxx", value = {value = "value"}})` |

#### Responses Object
A container for the expected responses of an operation. The container maps a HTTP response code to the expected response. It is not expected from the documentation to necessarily cover all possible HTTP response codes, since they may not be known in advance. However, it is expected from the documentation to cover a successful operation response and any known errors.

The default can be used as the default response object for all HTTP codes that are not covered individually by the specification.

The Responses Object must contain at least one response code, which must be the response for a successful operation call.

Reference: official [Responses Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#responses-object) documentation

**Responses Object Example:**
```yaml
'200':
  description: a pet to be returned
  schema:
    $ref: '#/definitions/Pet'
default:
  description: Unexpected error
  schema:
    $ref: '#/definitions/ErrorModel'
```

##### Required Fields

| Field name         | Type   | Example                                                                                                                                                | Description                                                                                                                                                                                                      |
|--------------------|--------|--------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **default**            | object | [`Response Object`](#response-object) / [`Reference Object`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#referenceObject) | The documentation of responses other than the ones declared for specific HTTP response codes. It can be used to cover undeclared                                                                                 |
| {HTTP Status Code} | object | [`Response Object`](#response-object) / [`Reference Object`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#referenceObject) | Any [HTTP status code](https://en.wikipedia.org/wiki/List_of_HTTP_status_codes) can be used as the property name (one property per HTTP status code). Describes the expected response for that HTTP status code. |

#### Response Object
Describes a single response from an API Operation. Reference: official [Response Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#responseObject) documentation.

**Response Object Example:**
```yaml
description: A simple string response
schema:
  type: string
```

##### Required Fields

| Field name  | Type   | Example                    | Description                                               |
|-------------|--------|----------------------------|-----------------------------------------------------------|
| description | string | `A simple string response` | A description of the response. Used in the documentation. |

##### Optional Fields

| Field name | Type   | Example                                                                                                  | Description                                                                                                                    |
|------------|--------|----------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| schema     | object | [`Schema Object`](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#schemaObject) | JSON-Schema defining the response data. If this field does not exist, it means no content is returned as part of the response. |

#### Security Definitions Object
A declaration of the security schemes available to be used in the specification. This does not enforce the security schemes on the operations and only serves to provide the relevant details for each scheme.

Reference: official [Security Definitions Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#security-definitions-object) documentation.

**Security Definitions Object Example:**
```yaml
api_key:
  type: apiKey
  name: api_key
  in: header
```

##### Patterned Fields

| Field Pattern | Type   | Example                                             | Description                                                                     |
|---------------|--------|-----------------------------------------------------|---------------------------------------------------------------------------------|
| {name}        | object | [`Security Scheme Object`](#security-scheme-object) | A single security scheme definition, mapping a "name" to the scheme it defines. |

#### Security Scheme Object
Allows the definition of a security scheme that can be used by the operations. Supported schemes are basic authentication and an API key (either as a header or as a query parameter). (OAuth2 currently not supported.)

**Important: Murano do not support "flow", "authorizationUrl", "tokenUrl" and "scopes" fields.**

Reference: official [Security Scheme Object](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#security-scheme-object) documentation.

**Basic Authentication Object Example:**
```yaml
type: basic
x-userField: <account>
x-secretField: <secret>
```

**API Key Object Example:**
```yaml
type: apiKey
name: <api_key>
in: <header>
```

##### Fixed Fields

| Field Pattern | Type   | Example                   | Validity        | Description                                                                                                                                                                                                                                                                                          |
|---------------|--------|---------------------------|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| type          | string | `basic / apiKey / bearer` | Any             | **Required**. The type of the security scheme. Valid values are:<br>"Basic" for [https://tools.ietf.org/html/rfc7617](https://tools.ietf.org/html/rfc7617).<br>"bearer" for [https://tools.ietf.org/html/rfc6750](https://tools.ietf.org/html/rfc6750).<br>"apiKey" for a direct token transmission. |
| description   | string | `Description something`   | Any             | A short description for security scheme.                                                                                                                                                                                                                                                             |
| name          | string | `api_key`                 | apiKey / bearer | **Required**. The name of the header or query parameter to be used.<br>For "bearer" type the name of the parameter containing the value.                                                                                                                                                             |
| in            | string | `header`                  | apiKey          | **Required**. The location of the API key. Valid values are "query" or "header".                                                                                                                                                                                                                     |

##### Murano Specific Fields

| Field Pattern          | Type   | Example       | Validity | Description                                                                                                         |
|------------------------|--------|---------------|----------|---------------------------------------------------------------------------------------------------------------------|
| x-exosite-user-field   | string | `someAccount` | basic    | **Required**. Defines the parameter name providing the user credential value.                                       |
| x-exosite-secret-field | string | `someSecret`  | basic    | **Required**. Defines the parameter name providing the secret credential value.                                     |
| x-exosite-prefix       | string | `token`       | apiKey   | A string to prefix in the header content.<br>E.g. X-secret: token `<user token>`                                        |
| x-exosite-from         | string | `token`       | apiKey   | **Required**. The parameter name containing the token value to add in the Authentication header or query parameter. |

#### Config Parameters Object

An array of parameters (JSON schema) defining the data set in the service Configuration parameters field for this serviceconfig.

Service configuration parameters allow user to set static values for the service. Murano services page will display dynamically generated forms based on this configuration.<br>
Those parameters can be used used in 2 ways:
1. Provide default value for Lua script calls to avoid user to explicitly set static configuration like credentials from the scripting environment.
2. Service initialization. Parameters can be transmitted during service lifecycle events such as ‘x-exosite-init’ or ‘x-exosite-update’ to set user settings within the service.

##### Required Fields

| Field Pattern | Type   | Example                 | Description                                         |
|---------------|--------|-------------------------|-----------------------------------------------------|
| name          | string | `domain`                | The name of the configuration parameter.            |
| description   | string | `Something description` | A brief description of the configuration parameter. |
| type          | string | `string`                | The type of the configuration parameter.            |

##### Optional Fields

| Field Pattern          | Type                               | Example                              | Description                                                                                                                                                                                                         |
|------------------------|------------------------------------|--------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| x-exosite-hidden       | boolean                            | `false`                              | Declares this configuration parameter to be hidden or not.                                                                                                                                                          |
| x-exosite-restricted | boolean                            | `false`                              | If set to *true*: prevent this parameter to be filled by user.<br><br>For example, this option is used to restrict the parameter value to an internally provided value like "solution_id".                          |
| x-exosite-from         | domain / solution_id / business_id | `domain / solution_id / business_id` | Populate this parameter from a user context value.<br>This option is generally used along with "x-exosite-restricted: true" to prevent user for overriding his context and potentially accessing other user data. |
| required               | boolean                            | `false`                              | Determines whether this configuration parameter is mandatory for the service to be usable from Murano scripting.                                                                                                    |
| format                 | string                             | `password`                           | Set to password format for obscuring the sensitive data like password and secret token. The real data will not be returned from backend.                                                                            |
