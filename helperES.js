//Module handles all communications with Elasticsearch backend
//require('dotenv').config()

const environment = (process.env.NODE_ENV === 'development') ? 'development' : 'production'
require('dotenv').config({ path: `.env.${environment}` }) ////require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

const winstonLogger = require('./helperWinstonLogger')

require('array.prototype.flatmap').shim()

const { Client } = require('@elastic/elasticsearch')

const client = new Client({
  node: process.env.ES_SERVER_URL, //'https://localhost:9200'
  auth: {
    username: 'elastic',
    password: 'changeme' //process.env.ESPWD ||| 
  }
})

const publicationIndexName  = process.env.ES_RASTER
const licenseIndexName = 'abc'


module.exports =  {

    esPingAsync: async function() {return await module.exports.esPing();},

    esPing: function(){
        return new Promise(async (resolve, reject) => {
            try{

                 client.ping({
                    // ping usually has a 3000ms timeout
                    requestTimeout: 3000
                  }, function (err) {
                    if (err) {
                        winstonLogger.error(err)
                        reject(err)
                    } else {
                        winstonLogger.info('Elasticsearch Ping worked')
                        resolve()
                    }
                });
            }
            catch (err) {
                winstonLogger.error(err)
                reject(err)
            }
        });

    },

    //Insert a publication in elastic

    addPublicationAsync: async function(publicationJSON) {return await module.exports.addPublication(publicationJSON);},

    addPublication: function(publicationJSON){
        return new Promise((resolve, reject) => {
            try{

                //force an index create if not there already
                client.indices.create({
                    index: publicationIndexName
                }, function(error, response, status) {
                    if (error) {
                        winstonLogger.info('Index already exists');
                    } else {
                        winstonLogger.info("created a new index", response);
                    }
                });

                //index the document
                res = client.index({
                    index: publicationIndexName,
                    id: publicationJSON['content-id'],
                    type: 'publication',
                    body: publicationJSON
                }, function(err, resp, status) {
                    if (err){
                        winstonLogger.error(err)
                        reject(err)
                    }
                    else {
                        winstonLogger.debug(resp);
                        resolve(resp)
                    }
                });

                //resolve(res)
            }
            catch (err) {
                winstonLogger.error(err)
                reject(err)
            }
        });

    },

    getPublicationByContentIdAsync: async function(contentid) {

        try{

            var query = {bool: { must: [] }}
            query.bool.must.push({ match: { '_id': contentid } })
            winstonLogger.debug(query)
            const sort = [{'properties.assetDate': {order : 'desc'}}]
            //const _source = {"excludes": ["desc", "descHTML"]}
            const _source = ["properties"]
          
            const { body } = await client.search({ index: publicationIndexName, body: { size: 1, sort, query  } })
          
            const res = body.hits.hits.map(e => ({ _id: e._id, ...e._source }))
        
            winstonLogger.debug(res)

            return res
        }
        catch (err) {
            winstonLogger.error(err)
        }

    },

    addPublicationLicenseAsync: async function(publicationLicenseJSON) {return await module.exports.addPublicationLicense(publicationLicenseJSON);},

    addPublicationLicense: function(publicationLicenseJSON){
        return new Promise((resolve, reject) => {
            try{

                //force an index create if not there already
                client.indices.create({
                    index: licenseIndexName
                }, function(error, response, status) {
                    if (error) {
                        winstonLogger.info('Index already exists');
          
                    } else {
                        winstonLogger.info("created a new index", response);
                    }
                });

                //index the document
                res = client.index({
                    index: licenseIndexName,
                    id: publicationLicenseJSON['license_data']['id'],
                    type: 'license',
                    body: publicationLicenseJSON
                }, function(err, resp, status) {
                    if (err){
                        winstonLogger.error(err)
                        reject(err)
                    }
                    else {
                        winstonLogger.debug(resp);
                        resolve(resp)
                    }
                });

                //resolve(res)
            }
            catch (err) {
                winstonLogger.error(err)
                reject(err)
            }
        });

    },




    searchIndexAsync: async function(indexname, reqBody) {

        try{
            const sort = [{'properties.assetDate': {order : 'desc'}}]
            //const _source = {"excludes": ["desc", "descHTML"]}
            const _source = ["properties"]

            var query = {bool: { must: [] }}

            let rBody = reqBody


            if (!rBody){
                rBody = { size: 1, sort, query  }
            }

            query.bool.must.push({ match: { '_id': "HBjsCPySMGitdu_kJuptGA" } }) //AM implementation
            
            winstonLogger.debug(query)
          
            const { body } = await client.search({ index: indexname, body: { size: 1, sort, query  } })
          
            const res = body.hits.hits.map(e => ({ _id: e._id, ...e._source }))
        
            winstonLogger.debug(res)

            return res
        }
        catch (err) {
            winstonLogger.error(err)
        }

    },












};
