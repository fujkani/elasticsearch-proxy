
//TODO: Would be good to split the endpoints in a separate endpoints.js file and maybe attach swagger-autogen for documentation: https://medium.com/swlh/automatic-api-documentation-in-node-js-using-swagger-dd1ab3c78284
//TODO: Joi schema validation


//Entry point index.js
//Exposes main REST endpoints


//require('dotenv').config()
const environment = (process.env.NODE_ENV === 'development') ? 'development' : 'production'
require('dotenv').config({ path: `.env.${environment}` }) ////require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config/config.yml', environment);

const morganFormat = environment !== "production" ? "dev" : "combined";

const express = require('express')
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const { promisify } = require('util') //The util.promisify() method defines in utilities module of Node.js standard library. It is basically used to convert a method that returns responses using a callback function to return responses in a promise object

const cors = require('cors');
const morgan = require('morgan');
const ecsFormat = require('@elastic/ecs-morgan-format') //Formats the logs using Elastic Common Schema

const _ = require('lodash');

//const { v4: uuidv4 } = require('uuid');
//var crypto = require('crypto');

const helperES = require('./helperES')
const winstonLogger = require('./helperWinstonLogger')

const helperAMMiddleWare = require('./helperAMMiddleWare')


const app = express()

console.log('RUNNING IN MODE: ' + environment)

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

// Attach the Authorization Management middleware before starting the express app
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


//#region publisher endpoints

app.get('/ping', async (req, res) => {
  try{
    res.send("Reply from GeoBrowser API ver: " + (process.env.API_VESION === null ? 'none' : process.env.API_VESION))
  }
  catch (err) {
    winstonLogger.error('Ping error:' + err)
    res.status(500).send(err);
}
});


app.post('/:indexId/_search', async (req, res) => {
  try{

    if (!req.params){

      res.send({
        status: 400,
        message: 'A index name or pattern needs to be specified in the URI <baseuri>/indexname/_search'
      });
    }
    else {

      let indexName = req.params["indexId"]
      //TODO: check request body !!!
      abc = await helperES.searchIndexAsync(indexName, req.body.body, helperAMMiddleWare.userCountriesArray)
      .then( ret => {
        winstonLogger.info('Retrieved ES Entries')
        console.log(ret)
        res.send(JSON.stringify(ret))
      })
      .catch(err => {
        winstonLogger.error('Get ES Entries failed: ' + err)
        console.error(err)
      });

    }

  }
  catch (err) {
    winstonLogger.error('_Search error:' + err)
    res.status(500).send(err);
}
});


//#endregion eStore endpoints


const startServer = async () => {

  const port = process.env.SERVER_PORT || 3000
  await promisify(app.listen).bind(app)(port)
  console.log(`Listening on port ${port}`)
}

startServer()