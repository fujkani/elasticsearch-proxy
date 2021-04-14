//Entry point index.js
//Exposes main REST endpoints
//TODO: Would be good to split the endpoints in a separate endpoints.js file and maybe attach swagger-autogen for documentation: https://medium.com/swlh/automatic-api-documentation-in-node-js-using-swagger-dd1ab3c78284

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
const ecsFormat = require('@elastic/ecs-morgan-format')

const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
var crypto = require('crypto');

const helperES = require('./helperES')
const helperLCPServer = require('./helperLCPServer')
const winstonLogger = require('./helperWinstonLogger')


const app = express()

console.log('RUNNING IN MODE: ' + environment)

// enable files upload
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

/*
app.use(
  morgan(ecsFormat())
);
*/


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


app.get('/hello', async (req, res) => {
  try{
    winstonLogger.info('Hello World')

    publicationInfoJSON = await helperES.getPublicationByContentIdAsync("HBjsCPySMGitdu_kJuptGA")
    .then( ret => {
      console.log('Retrieved ES publication')
      console.log(ret)
      res.send(JSON.stringify(ret))
    })
    .catch(err => {
      console.log('Get ES Publication failed')
      console.error(err)
    });

  }
  catch (err) {
    winstonLogger.error('Hello World error:' + err)
    res.status(500).send(err);
}
});


app.post('/:indexId/_search', async (req, res) => {
  try{
    winstonLogger.info('Search end point')

    if (!req.params){

      res.send({
        status: 400,
        message: 'A index name or pattern needs to be specified in the URI <baseuri>/indexname/_search'
      });
    }
    else {
      if (!req.body.body) {
        // will assume searching for everything
        let indexName = req.params["indexId"]
        abc = await helperES.searchIndexAsync(indexName)
        .then( ret => {
          console.log('Retrieved ES publication')
          console.log(ret)
          res.send(JSON.stringify(ret))
        })
        .catch(err => {
          console.log('Get ES Publication failed')
          console.error(err)
        });
      }
      else {


      }

    }


    



  }
  catch (err) {
    winstonLogger.error('Hello World error:' + err)
    res.status(500).send(err);
}
});







//#region publisher endpoints

//Uploads and stores a new .epub
app.post('/publisher/contents/uploadepub', async (req, res) => {
  var ret = 'abc'
  const BookClubReaderId = "1"
/*
  try{
    await helperES.esPingAsync()
    .then( res => {
      console.log('ES Ping worked')
    })
    .catch(err => {
      res.send({
        status: 500,
        message: {message: 'server encountered an error 1111'}
      });
      throw new Error(err);
    });
  }
  catch (err) {
    winstonLogger.error(err)
    res.send({
      status: 500,
      message: {message: 'server encountered an error 0000'}
    });
    throw new Error(err);
}
*/

  try {
      if(!req.files) {
          res.send({
              status: false,
              message: 'No file uploaded'
          });
      } 
      else {
        //Using name of the input field to retrieve the uploaded file
        let publicationFile = req.files.publication;

        //console.log(req.body.publicationinfo);
        const contentid = uuidv4()
        const fileName = contentid + '.epub';
        const baseUploadFolder = process.env.UPLOAD_FOLDER
        const ePubFolder = baseUploadFolder + 'epub/'

        const inputFile = ePubFolder + fileName

        const outputFile = baseUploadFolder + 'epub/out' + fileName //+ publicationFile.name
        winstonLogger.info('About to move From: ' + inputFile + ' To: ' + outputFile)

        const coverPageFileName = contentid //Will set extension latter when processing the ePub
        const JPEGFolder = baseUploadFolder + 'jpeg/'
        const coverPageFile = JPEGFolder + coverPageFileName


        let pubInfoJSON = JSON.parse(req.body.publicationinfo);
        pubInfoJSON['content-id'] = contentid
        pubInfoJSON['BookClubReaderId'] = BookClubReaderId

        publicationFile.mv(inputFile, coverPageFile)                                                       //MOVE FILE TO PREFERED LOCATION
        .then(async (respublicationFile) => {
          winstonLogger.info('File MOVED  Successfully')
        })

        
        winstonLogger.info('wrapping up again')

        res.send({
        status: true,
        message: {
            'content-id': contentid ,// publicationFile.name,
            publicationURL: process.env.CLIENT_BASE_URL +':' + process.env.SERVER_PORT + '/publisher/contents/?content-id=' + pubInfoJSON['content-id']
          }
        });

      }


  } catch (err) {
      winstonLogger.error(err)
      res.send({
        status: 500,
        message: {message: 'server encountered an error 3333'}
      });
      throw new Error(err);
  }
});

app.post('/publisher/contents/test', async (req, res) => {
  var ret = 'abc'
  const BookClubReaderId = "1"

  try {
      if(!req.files) {
          res.send({
              status: false,
              message: 'No file uploaded'
          });
      } else {

        //Using name of the input field to retrieve the uploaded file
        let publicationFile = req.files.publication;

        //console.log(req.body.publicationinfo);
        const contentid = uuidv4()
        const fileName = contentid + '.epub';
        const baseUploadFolder = process.env.UPLOAD_FOLDER
        const ePubFolder = baseUploadFolder + 'epub/'

        const inputFile = ePubFolder + fileName

        const coverPageFileName = contentid //Will set extension latter when processing the ePub
        const JPEGFolder = baseUploadFolder + 'jpeg/'
        const coverPageFile = JPEGFolder + coverPageFileName


        await publicationFile.mv(inputFile)
        .then(async (res) => {
          console.log('File MOVED  Successfully')

        })



        res.send({
          status: true
        });

      }



  } catch (err) {
      //res.status(500).send(err);
      res.send({
        status: 500,
        message: 'Error occured',
        data: err
    });
  }
});
//#endregion publisher endpoints

//#region eStore endpoints

//TODO: eventually will need to secure this endpoint so only another API can call it. Most likely splitting into a separate API/listener would be a better design
//TODO: validate schema
//TODO: validate requested license rights jive with what's on ES for this publication..
app.post('/estore/contents/generatelicense', async (req, res) => {
  var ret = 'abc'
  console.log(ret)

  const BookClubReaderId = "1"
  const BookClubReaderEmail = "jon"

  
  try {

    if(!req.body.contentid || !req.body.licenserequestinfo) {
      winstonLogger.info('REST call missing required body params')

      res.send({
          status: 500,
          message: 'Either content id or licenserequestinfo is missing on request body'
      });
      throw new Error('Either content id or licenserequestinfo is missing on request body');
    } 
    else {

      winstonLogger.info('BookClubReaderId: ' + BookClubReaderId)
      
      let licenseRequestInfoJSON = JSON.parse(req.body.licenserequestinfo)

      let contentid = req.body.contentid


      //assuming input is validated..
      //lookup ES entry for this publication
      //not sure we need to query ES
      /*
      publicationInfoJSON = await helperES.getPublicationByContentIdAsync(contentid)
      .then( res => {
        console.log('Retrieved ES publication')
        console.log(res)
      })
      .catch(err => {
        console.log('Get ES Publication failed')
        console.error(err)
      });
      */

      const secret = licenseRequestInfoJSON['encryption']['user_key']['hex_value'];
      const hash = crypto.createHmac('sha256', secret)
                   .update(licenseRequestInfoJSON['encryption']['user_key']['text_hint'])
                   .digest('hex');
      
      licenseRequestInfoJSON['encryption']['user_key']['hex_value'] = hash
      winstonLogger.info(licenseRequestInfoJSON['encryption']['user_key']['hex_value']);

      
       await helperLCPServer.generatePublicationLicenseAsync(contentid, licenseRequestInfoJSON)
      .then( async reshelperLCPServer => {
        winstonLogger.info('LICENSE Retrieval from LCP Server successful')
        winstonLogger.info(reshelperLCPServer.status)
        winstonLogger.info(reshelperLCPServer.data)

        let publicationLicenseJSON = {license_data: reshelperLCPServer.data}
        await helperES.addPublicationLicenseAsync(publicationLicenseJSON)
        .then(resHelper =>{
          winstonLogger.info('Store new license in ES successful')
          res.send({
            status: true,
            message: {
                'content-id': contentid,
                publicationURL: process.env.CLIENT_BASE_URL +':' + process.env.SERVER_PORT + '/estore/pub/?id=' + contentid
            },
            license_data: reshelperLCPServer.data
          });
        })
        .catch(err => {
          winstonLogger.info('Store new license in ES failed')
          winstonLogger.error(err)
          res.send({
            status: 500,
            message: {message: 'Store new license failed with an error 5555'}
          });
          throw new Error(err)
        });

      
      })
      .catch(err => {
        winstonLogger.info('LICENSE Retrieval from LCP Server failed')
        winstonLogger.error(err)
        res.send({
          status: 500,
          message: {message: 'License generation failed with an error 7777'}
        });
        throw new Error(err)
      });

    }


  } catch (err) {
      //res.status(500).send(err);
      winstonLogger.error(err)
      res.send({
        status: 500,
        message: 'Error occured',
        data: err
      });
      throw new Error(err)
  }
});
//#endregion eStore endpoints


app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

const startServer = async () => {

  const port = process.env.SERVER_PORT || 3000
  await promisify(app.listen).bind(app)(port)
  console.log(`Listening on port ${port}`)
}

startServer()
