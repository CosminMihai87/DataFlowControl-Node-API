const express = require('express');
const db = require('../../settings.js');  
const router = express.Router(); 
const path = require('path');
var schema = require('./schema.js'); 
var mongoose = require('mongoose');
  
router.use('/', express.static('html'));

require('inject-tunnel-ssh')([db.SSHTunelConfig])
.on('error', (err)=>{
    console.error(`Error when calling the 'checkLogData' microservice - Tunnel-SSH-injection: ${err}`);
    res.status(400).send({ api_error: true, message: `Error when calling the 'checkLogData' microservice - Tunnel-SSH-injection: ${err}` }); 
}); 
   
router.get('/checkLogData/:isoCode/:process/:filename', (req, res)=>{  
    let isoCode = req.params.isoCode;
    let process = req.params.process;
    let filename = req.params.filename;   
    if ((!process) || ['porthos','aramis','datatrans','rc'].indexOf(process.toLowerCase())==-1 ) 
        { return res.status(400).send({ api_error: true, message: 'Please provide a valid process name!' }); 
    }; 
    if (!filename) {   
        return res.status(400).send({ api_error: true, message: 'Please provide a filename!' }); 
    };      
    if ((!isoCode) || isoCode.match(/^[a-zA-Z][a-zA-Z]$/g)!=isoCode ) {
        return res.status(400).send({ api_error: true, message: 'Please provide a valid country isoCode!' }); 
    };  
    if (!filename) { return res.status(400).send({ api_error: true, message: 'Please provide the filename parameter!' }); };
    var dbURI = db.SSHTunelConfig.dstHost;   
    mongoose.connect( dbURI, db.mongoConnOptions).then(() => {   
        const processModel = mongoose.model('processes_'+isoCode, schema.schema ); 
        var query = processModel.findOne({filename: filename, application: process });  
        query.exec((err, result)=> { 
            console.log(result);
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

router.get('*', (req, res)=> {  
    res.sendFile(path.join(__dirname + '/index.html'));
});
  
  
module.exports = router;