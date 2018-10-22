var express = require('express');  
const app = express();  
const api = require('./api');
  
// Get our API routes
app.use('/', api);
 
var server = app.listen(1004, ()=> { 
    var host = server.address().address == "::" ? process.env.NODE_ENV.trim() : server.address().address ;
    var port = server.address().port;   
    console.log(`Node API "readFromMongoDB" is listening at http://${host}:${port}`);
}); 
 
module.exports = app;