var express = require('express');  
const app = express();  
const api = require('./api');
  
// Get our API routes
app.use('/', api);
 
var server = app.listen(1003, ()=> { 
    var host = server.address().address == "::" ? process.env.NODE_ENV.trim() : server.address().address ;
    var port = server.address().port;   
    console.log(`Node API "write2MongoDB" is listening at http://${host}:${port}`);
}); 
 
module.exports = app;