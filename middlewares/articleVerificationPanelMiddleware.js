const { app } = require("firebase-admin");
const {resultObject} = require('../utils/commonUtils')
function isAuthorizeForAvPanel (req, res, next)  {
  console.log(req.session,645,req.session.id)
    if(req.session.isAuthenticated && req.session.aid){
        console.log('you are authorized')
        next();
    } else {
        console.log(2,req.session.id)
        console.log(req.session)
        return res.send(resultObject(0,'Failed: you are not authorized!',{}))
    }
    
  };
  
  module.exports = {
    isAuthorizeForAvPanel,
  };
  