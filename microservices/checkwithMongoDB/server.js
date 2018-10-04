var express = require('express');  
const app = express();  
const api = require('./api');
  
// Get our API routes
app.use('/', api);
 
var server = app.listen(1002, ()=> { 
    var host = server.address().address == "::" ? "localhost" : server.address().address ;
    var port = server.address().port;   
    console.log(`Node API "checkwithMongoDB" is listening at http://${host}:${port}`);
}); 
 
module.exports = app;