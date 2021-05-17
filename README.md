# Node Express Proxy API for Elasticcearch

This Node Express sample REST API handles secure requests from a client application  into the ElasticSearch indexes.

The API receives POST requests representing search queries, verifies the user is allowed to make this call and then passes the request over to Elasticsearch.

In addition, before replying back to the user, the API applies a post_query and limits the returned result based on user.

Use cases covered:
1. Secure proxy API to Elasticcearch
2. Filter outgoing data by user

Interesting patterns covered:
1. User Authentication & Authorization
2. Controlling which indexes can be searched
3. Logging and log file formatting to support FileBeat pickup
4. Use of Swagger wrapper to get basic documentation and a tester page
5. Use of DOTENV to handle environments
6. Use of Node Express MiddleWare to intercept calls


Following feaatures / restrictions are implemented:

- ✨HTTP Request:
    - ✨Only HTTP POST is allowed
    - ✨A valid user should be passed as part of the HTTP Header
    - ✨Content-Type Header should be set to "application/json"
    - ✨Specifying  HTTP Body is optional but if present it should be a valid Elastic Query. Any passed query will be ammended with user countries to ensure only records within those countries are returned
    - ✨ Only Elasticsearch Search API is covered and not all combinations of the body parameter are tested. SQL-type querying through a query_string parameter not supported. ES Search API:
    https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html#request-body-search-query

- ✨Business Rules:
    - ✨The user should exist in data_access index (or index name specified in env var: ES_ACCESS)
    - ✨Only certain indexes are allowed to be searched (index specified in config)
    - ✨Only Searches are allowed, i.e. only reading of data
    - ✨Unless otherwise specified through the "_source" element of the query body, all fields are returned with each document


Following additional features improve quality and maintenance:

- ✨Logging:
    - ✨Logging is enabled through two popular npm packages, Morgan (web calls) and Winston (the rest)
    - ✨Log formatters are employed to comply with Elastic Common Schema
    - ✨Generated logs are ingesteable by FileBeat into Elasticcearch which can then be explored in Kibana dashboards and visualizations

- ✨Request Validation:
    - ✨Schema validation is achieved through npm package Joi (to be implemented)

- ✨User Authentication & Authorization
    - ✨It is assumed user authentication is already done by web server IIS/other
    - ✨User authentication happens through the Express MiddleWare: helperAMMiddleWare

- ✨Swagger interactive API documentation:
    - ✨{baseURI}\api-docs

## Getting Started

### Install Dependencies

After cloning the repository, simply run `npm install` to install the dependencies.

### Environment Variables


Env variables are handled through the settings in `.env.*` file. 

To chose which .env file to use export env NODE_ENV with one of following values 'development', 'production'


### Run the Server

To run the server, run `npm run start` from the terminal.

### Run the Client

Any HTTP capable client capable of initiating POST can be used. Examples include Curl, Powershell, Postman etc


## Author

Fatjon Ujkani

