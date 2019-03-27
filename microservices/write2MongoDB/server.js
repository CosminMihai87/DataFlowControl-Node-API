 var express = require('express');  
const app = express();  
const fs = require('fs');
const path = require('path');
const https = require('https');
const api = require('./api');
  
// Get our API routes
app.use('/', api);
 
var certOptions = { 
    key: fs.readFileSync(path.join(__dirname, './../certificates/', 'ca.key')),
    cert: fs.readFileSync(path.join(__dirname, './../certificates/', 'ca.crt')) 
};
var port = 1003;

var server = https
.createServer(certOptions, app)
.listen(port, () =>{
    var host = server.address().address == "::" ? process.env.NODE_ENV.trim() : server.address().address ;
    var port = server.address().port;   
    console.log(`Node API "write2MongoDB" is listening at https://${host}:${port}`);
})
  
module.exports = app;