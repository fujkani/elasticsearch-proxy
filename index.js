
//TODO: Would be good to split the endpoints in a separate endpoints.js file
//TODO: Joi schema validation

//Entry point index.js
//Exposes main REST endpoints

//#region imports and requires
const environment = (process.env.NODE_ENV === 'development') ? 'development' : 'production'
require('dotenv').config({ path: `.env.${environment}` }) ////require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/config.yml', environment);


const express = require('express')
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const { promisify } = require('util') //The util.promisify() method defines in utilities module of Node.js standard library. It is basically used to convert a method that returns responses using a callback function to return responses in a promise object

const cors = require('cors');
const morgan = require('morgan');
//const morganFormat = environment !== "production" ? "dev" : "combined";
const ecsFormat = require('@elastic/ecs-morgan-format') //Formats the logs using Elastic Common Schema

const _ = require('lodash');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require(__dirname + '/config/swagger.json');


//const { v4: uuidv4 } = require('uuid');
//var crypto = require('crypto');

const helperES = require('./helperES')
const winstonLogger = require('./helperWinstonLogger')

const helperAMMiddleWare = require('./helperAMMiddleWare')

//#endregion imports and requires

//#region Vars
const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTION"
}

////#endregion Vars




//RUN THE EXPRESS APP!
const app = express()

console.log('RUNNING IN MODE: ' + environment)

//#region MiddleWares
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// enable files upload - potential future use case
app.use(fileUpload({
  createParentPath: true,
  limits: { 
      fileSize: 200 * 1024 * 1024 * 1024 //200MB max file(s) size
  },
  abortOnLimit: true
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Attach the custom Authorization Management middleware before starting the express app
app.use(helperAMMiddleWare)

app.use(
  morgan(ecsFormat(), {
    skip: function(req, res) {
      return res.statusCode < 400;
    },
    stream: winstonLogger.stream // process.stderr //winstonLogger.stream
  })
);

app.use(
  morgan(ecsFormat(), {
    skip: function(req, res) {
      return res.statusCode >= 400;
    },
    stream: winstonLogger.stream // process.stdout //winstonLogger.stream
  })
);
//#endregion MiddleWares


//#region API endpoints

app.get('/ping', async (req, res) => {
  try{

    res.set(headers)
    res.status(200).send(
      {
        body: { status: "success", result:  "Reply from GeoBrowser API ver: " + (process.env.API_VESION === null ? 'none' : process.env.API_VESION) }
      }
    );

    //res.send("Reply from GeoBrowser API ver: " + (process.env.API_VESION === null ? 'none' : process.env.API_VESION))
  }
  catch (err) {
    winstonLogger.error('Ping error:' + err)
    res.status(500).send(err);
}
});

app.get('/getcurrentuserinfo', async (req, res) => {
  try{

    res.set(headers)
    res.status(200).send(
      {
        body: { status: "success", result:  helperAMMiddleWare.userInfo }
      }
    );
    //res.send(helperAMMiddleWare.userInfo)
  }
  catch (err) {
    winstonLogger.error('getcurrentuserinfo error:' + err)
    res.status(500).send(err);
}
});

app.post('/:indexId/_search', async (req, res) => {
  try{

    if (!req.params){

      res.set(headers)
      res.status(400).send(
        {
        body: { status: "failure", result:  'A index name or pattern needs to be specified in the URI <baseuri>/indexname/_search' }
      });
    }
    else {

      let indexName = req.params["indexId"]
      //TODO: check request body !!!
      abc = await helperES.searchIndexAsync(indexName, req.body, helperAMMiddleWare.userCountriesArray)
      .then( ret => {
        winstonLogger.debug('Retrieved ES Entries')
        winstonLogger.debug(ret)
        res.set(headers)
        res.status(200).send(
          {
            body: { status: "success", result:  ret }
          }
        )
        //res.send(JSON.stringify(ret))
      })
      .catch(err => {
        winstonLogger.error('Get ES Entries failed: ' + err)
      });

    }

  }
  catch (err) {
    winstonLogger.error('_Search error:' + err)
    res.status(500).send(err);
}
});

//#endregion API endpoints


//start the Node server
const startServer = async () => {

  const port = process.env.SERVER_PORT || 3000
  await promisify(app.listen).bind(app)(port)
  console.log(`Listening on port ${port}`)
}

startServer()