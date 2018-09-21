const express = require('express');
const router = express.Router();
const db = require('../../database.js');  
const tunnel = require('tunnel-ssh');  
const mongoDBSchemas = require('./mongoDBSchemas.js'); 
const mongoose = require('mongoose');
const Schema = mongoose.Schema; 
var bodyParser = require('body-parser');
router.use(bodyParser.json({limit: '10mb', extended: true})); // support json encoded bodies
router.use(bodyParser.urlencoded({limit: '10mb', extended: true})); // support encoded bodies
  
router.get('/', (req, res)=> { 
    res.json({ message: 'Hello! Welcome to our write2MongoDB microservice!' });  
});

require('inject-tunnel-ssh')([db.SSHTunelConfig])
.on('error', (err)=>{
    console.error(`Error when calling the 'checkLogData' microservice - Tunnel-SSH-injection: ${err}`);
    res.status(400).send({ api_error: true, message: `Error when calling the 'checkLogData' microservice - Tunnel-SSH-injection: ${err}` }); 
}); 
  
router.post('/sendLogData/:process', (req, res)=>{    
    let process = req.params.process;  
    if (!process) { return res.status(400).send({ api_error: true, message: 'Please provide a process name!' }); }   
    var dbURI = 'mongodb://dcex-rotcps01.gfk.com:27017/dfc-db'; 
    var jsonData = req.body;  
    var filename = req.body.filename;  
    var country = req.body.country;   
    mongoose.connect( dbURI, db.mongoConnOptions).then(() => {   
        switch (process.toLowerCase()) {
            case "porthos":
                var processModel = mongoose.model('porthos'); 
                break;
            case "aramis":
                var processModel = mongoose.model('aramis'); 
                break;
            case "datatrans":
                var processModel = mongoose.model('datatrans');  
                break;
            case "rc":
                var processModel = mongoose.model('rc'); 
                break;
        };   
        var newProcess = new processModel(jsonData);     
        newProcess.save((err)=> {
            if (err) { 
                console.log(`Error when calling the 'sendLogData' microservice - Error writing to MongoDB database: ${err}`); 
                res.status(400).send({ api_error: true, message: `Error when calling the 'sendLogData' microservice -  Error writing to MongoDB database: ${err}` });
            } else {
                res.status(200).json({ api_error: false, message: `'${filename}' from the ${country} ${process} process was succesfully written to DB!`, process: jsonData }); 
            }
            mongoose.connection.close();    
        });  
    }).catch((error) => { 
        console.log(`Error when calling the 'sendLogData' microservice - MongoDB connection error: ${error}`);   
        throw res.status(400).send({ api_error: true, message: `Error when calling the 'sendLogData' microservice - MongoDB connection error: ${error}` }); 
    });      
}); 

module.exports = router;