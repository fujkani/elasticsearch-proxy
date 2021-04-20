# GEOBROWSER REST API

This Node Express REST API handles secure requests from GeoBrowser or any other client application and into the ISI ElasticSearch foundation data.

The first version(s) of this API will serve primarily similiar to a server proxy with a filtering mechanism, i.e. incoming requests will be validated then a user-based filter will be added on the fly before sending queries to Elasticsearch and replying to the calling application.


Following feaatures / restrictions are implemented:

- ✨HTTP Request:
    - ✨Only HTTP POST is allowed
    - ✨A valid user should be passed as part of the HTTP Header
    - ✨Content-Type Header should be set to "application/json"
    - ✨Specifying  HTTP Body is optional but if present it should be a valid Elastic Query. Any passed query will be ammended with user countries to ensure only records within those countries are returned

- ✨Business Rules:
    - ✨The user should exist in isi_data_access index (or index name specified in env var: ES_ACCESS)
    - ✨Only certain indexes are allowed to be searched (index specified in config)
    - ✨Only Searches are allowed, i.e. only reading of data
    - ✨Unless otherwise specified through the "_source" element of the query body, all fields are returned with each document


Following additional features improve quality and maintenance:

- ✨Logging:
    - ✨Logging is enabled through two popular npm packages, Morgan (web calls) and Winston (the rest)
    - ✨Log formatters are employed to comply with Elastic Common Schema
    - ✨Generated logs are ingesteable by FileBeat into Elasticcearch which can then be explored in Kibana dashboards and visualizations

- ✨Request Validation:
    - ✨Schema validation is achieved through npm package Joi

- ✨User Authentication & Authorization
    - ✨To comply with SGIS standards, we leave user authentication to IIS
    - ✨User authentication and AM filtering happens through the Express MiddleWare: helperAMMiddleWare


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

## License

SGIM-ISI
