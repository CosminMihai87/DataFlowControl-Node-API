const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../../database.js');    
const schema = require('./schema.js'); 
const mongoose = require('mongoose'); 
var bodyParser = require('body-parser');
router.use(bodyParser.json({limit: '10mb', extended: true})); // support json encoded bodies
router.use(bodyParser.urlencoded({limit: '10mb', extended: true})); // support encoded bodies
  
router.use('/', express.static('html'));

require('inject-tunnel-ssh')([db.SSHTunelConfig])
.on('error', (err)=>{
    console.error(`Error when calling the 'checkLogData' microservice - Tunnel-SSH-injection: ${err}`);
    res.status(400).send({ api_error: true, message: `Error when calling the 'checkLogData' microservice - Tunnel-SSH-injection: ${err}` }); 
}); 
  
router.post('/sendLogData/:isoCode/:process', (req, res)=>{    
    let process = req.params.process;  
    let isoCode = req.params.isoCode; 
    if ((!isoCode) || isoCode.match(/^[a-zA-Z][a-zA-Z]$/g)!=isoCode ) {
        return res.status(400).send({ api_error: true, message: 'Please provide a valid country isoCode!' }); 
    };
    if ((!process) || ['porthos','aramis','datatrans','rc'].indexOf(process.toLowerCase())==-1 ) 
        { return res.status(400).send({ api_error: true, message: 'Please provide a valid process name!' }); 
    };  
    var dbURI = db.SSHTunelConfig.dstHost;
    var jsonData = req.body;  
    var filename = req.body.filename;  
    var country = req.body.country;   
    mongoose.connect( dbURI, db.mongoConnOptions).then(() => {   
        switch (process.toLowerCase()) {
            case "porthos": 
                var processModel = mongoose.model('porthos', schema.schema_porthos, 'processes_'+isoCode); 
                break;
            case "aramis": 
                var processModel = mongoose.model('aramis', schema.schema_aramis, 'processes_'+isoCode); 
                break;
            case "datatrans": 
                var processModel = mongoose.model('datatrans', schema.schema_datatrans, 'processes_'+isoCode); 
                break;
            case "rc": 
                var processModel = mongoose.model('rc', schema.schema_rc, 'processes_'+isoCode); 
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
   
router.get('*', (req, res)=> {  
    res.sendFile(path.join(__dirname + '/index.html'));
});



module.exports = router;