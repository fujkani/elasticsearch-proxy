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


module.exports =  {
    
    client,

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
                        winstonLogger.debug('Elasticsearch Ping worked')
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


    // Async Function
    searchIndexAsync: async function(indexname, reqBody, userCountriesArray) {
        try{

            var modifiedreqBody = reqBody

            const post_filter = {terms: { "properties.location.countries.keyword": userCountriesArray, "boost": 1.0 }} // *** AM enforcment

            if (!modifiedreqBody.query ) modifiedreqBody.query = {"match_all": {}}

            delete modifiedreqBody["post_filter"] //strip the query from any existingpost_filter

            if (userCountriesArray[0] != 'All'){ //***************  GOD MODE DOES NOT GET APPLIED A POST FILTER
                modifiedreqBody["post_filter"] = post_filter
            }

            winstonLogger.debug(modifiedreqBody)

            const { body } = await client.search({ 
                index: indexname, 
                body: modifiedreqBody
            }, 
            {
                ignore: [404],
                maxRetries: 3
              }
            )

            const res = body.hits.hits.map(e => ({ _id: e._id, ...e._source }))
        
            winstonLogger.debug(res)

            return body //return res eventually
        }

        catch (err) {
            winstonLogger.error(err)
        }

    },



};



/*
 searchIndexAsync: async function(indexname, reqBody) {
        try{

            await client.get({
                index: process.env.ES_ACCESS,
                id: 'ujkanif'
              }, async function callback(err, response, status){
                if (err) {
                  if(status == 404) console.log("Resource not found");
                  else console.error(err.message);
                }
                else {
                    console.log(response)
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
                
                
               })


        }
        catch (err) {
            winstonLogger.error(err)
        }

    }
    */


    /*
    searchIndexAsync: async function(indexname, reqBody, userCountriesArray) {
        try{

            const countriesArray = userCountriesArray

            if (!reqBody._source) const _source = ["properties"] 

            

            const sort = [{'properties.assetDate': {order : 'desc'}}]
            //const _source = {"excludes": ["desc", "descHTML"]}
            
            

            var query = null

            if (countriesArray.length == 1 && countriesArray[0] == 'All'){
                //***************  GOD MODE HERE - WE ARE ALLOWING ALL 
                if(!reqBody) query = {"match_all": {}};
            }

            if (countriesArray.length >= 1){ //this has already been vented out by the AM middleware but just in case..
                query = {terms: { "properties.location.countries.keyword": countriesArray, "boost": 1.0 }} // *** AM enforcment

            }

            let rBody = reqBody

            if (!rBody){
                rBody = { size: 1, sort, query  }
            }

            //query.bool.must.push({ match: { '_id': "HBjsCPySMGitdu_kJuptGA" } }) 
            
            winstonLogger.debug(query)
        
            const { body } = await client.search({ 
                index: indexname, 
                body: {
                    size: 1000, 
                    sort, 
                    query  
                } 
            }, 
            {
                ignore: [404],
                maxRetries: 3
              }
            )
        
            const res = body.hits.hits.map(e => ({ _id: e._id, ...e._source }))
        
            winstonLogger.debug(res)

            return body //return res eventually
        }

        catch (err) {
            winstonLogger.error(err)
        }

    },
    */