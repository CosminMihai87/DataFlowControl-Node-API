const express = require('express');
const db = require('../../database.js');  
const router = express.Router();
var tunnel = require('tunnel-ssh');   
var schema = require('./schema.js'); 
var mongoose = require('mongoose');
  
router.get('/', (req, res)=> { 
    res.json({ message: 'Hello! Welcome to our checkwithMongoDB microservice!' });  
});
  
require('inject-tunnel-ssh')([db.SSHTunelConfig])
.on('error', (err)=>{
    console.error(`Error when calling the 'checkLogData' microservice - Tunnel-SSH-injection: ${err}`);
    res.status(400).send({ api_error: true, message: `Error when calling the 'checkLogData' microservice - Tunnel-SSH-injection: ${err}` }); 
}); 
   
router.get('/checkLogData/:process/:filename', (req, res)=>{  
    let process = req.params.process;
    let filename = req.params.filename;   
    if (!process) { return res.status(400).send({ api_error: true, message: 'Please provide the process parameter!' }); };  
    if (!filename) { return res.status(400).send({ api_error: true, message: 'Please provide the filename parameter!' }); };
    var dbURI = 'mongodb://dcex-rotcps01.gfk.com:27017/dfc-db';   
        mongoose.connect( dbURI, db.mongoConnOptions).then(() => {   
            const processModel = mongoose.model('processes', schema.schema ); 
            var query = processModel.findOne({filename: filename, application: process });
            query.select('filename'); 
            query.exec((err, result)=> { 
                if (err) {
                    console.log(`Error when calling the 'checkLogData' microservice - DBQuery issue on execution: ${err}`); 
                    res.status(400).send({ api_error: true, message: `Error when calling the 'checkLogData' microservice - DBQuery issue on execution: ${err}` });
                } else {  
                    //if the filename was found in the DB, return true, else return false
                    if (result != null) {
                        res.status(200).json({ api_error: false, filename: filename, found: true, message: `The filename '${filename}' for the ${process} run was found in the DB!` });   
                    } else { 
                        res.status(200).json({ api_error: false, filename: filename, found: false, message: `The filename '${filename}' for the ${process} run was NOT found in the DB!` }); 
                    } 
                }; 
                mongoose.connection.close();
            });     
        }).catch((error) => { 
            console.log(`Error when calling the 'checkLogData' microservice - MongoDB connection error: ${error}`);   
            throw res.status(400).send({ api_error: true, message: `Error when calling the 'checkLogData' microservice - MongoDB connection error: ${error}` }); 
        });    
}); 

 
  
module.exports = router;