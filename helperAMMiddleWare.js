//Authorization MiddleWare module.
// 1. Ensures user exists in the HTTP Header and if so, 2. Populates few variables

const helperES = require('./helperES')
const winstonLogger = require('./helperWinstonLogger')

module.exports = async (req, res, next) => {
  try {

    if (!req.headers.user){
      throw new Error('Username is missing from the request header. Cannot proceed')
    }

    winstonLogger.debug(req.path + ' end point invoked by user: ' + req.headers.user)
    winstonLogger.debug('Authorization module invoked..')

    const userAccess = await helperES.client.get({
        index: process.env.ES_ACCESS,
        id: req.headers.user
      }, 
      {
          ignore: [404],
          maxRetries: 3
      }
    )
    
    var categoriesArray = []
    if (userAccess && userAccess.body.found) {
        categoriesArray = userAccess.body._source.dataaccess
        if (categoriesArray.lenght == 0) throw new Error('No data categories have been granted for User: ' + req.headers.user)
    }
    else throw new Error('User: ' + req.headers.user + ' is not granted access to any data!')
    
    winstonLogger.debug('User: ' + req.headers.user + ' has access to following data categories: ' + categoriesArray.join())

    module.exports.userCategoriesArray = categoriesArray
    module.exports.user = req.headers.user
    module.exports.userInfo = userAccess.body._source

    
    next()

  } catch (error) {
    next(error.message)
  }
}

