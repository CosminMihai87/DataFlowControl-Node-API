const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../../database.js');    
const schema = require('./schema.js'); 
const mongoose = require('mongoose'); 
const functions = require('../../functions.js');   
var bodyParser = require('body-parser');
router.use(bodyParser.json({limit: '10mb', extended: true})); // support json encoded bodies
router.use(bodyParser.urlencoded({limit: '10mb', extended: true})); // support encoded bodies
  
router.use('/', express.static('html'));

require('inject-tunnel-ssh')([db.SSHTunelConfig])
.on('error', (err)=>{
    console.error(`Error when calling the 'checkLogData' microservice - Tunnel-SSH-injection: ${err}`);
    res.status(400).send({ api_error: true, message: `Error when calling the 'checkLogData' microservice - Tunnel-SSH-injection: ${err}` }); 
}); 
  
router.get('/getData/:isoCode/:process/:date', (req, res)=>{  
    let isoCode = req.params.isoCode;
    let process = req.params.process.toLowerCase();
    let date = req.params.date;   
    if ((!isoCode) || isoCode.match(/^[a-zA-Z][a-zA-Z]$/g)!=isoCode ) {
        return res.status(400).send({ api_error: true, message: 'Please provide a valid country isoCode!' }); 
    };  
    if ((!process) || ['porthos','aramis','datatrans','rc','all'].indexOf(process.toLowerCase())==-1 ) 
        { return res.status(400).send({ api_error: true, message: 'Please provide a valid process name!' }); 
    }; 
    if ((!date) || date.match(/([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))/g)!=date ) {   
        return res.status(400).send({ api_error: true, message: 'Please provide a valid date!' }); 
    };   
    var dbURI = db.SSHTunelConfig.dstHost;   
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
            case "all": 
                var processModel = mongoose.model('all', schema.schema_all, 'processes_'+isoCode); 
                break;   
        };  
        var process_array = [] ;
        if (process == "all") {
            process_array = ['porthos','aramis','datatrans','rc'];
        } else {
            process_array.push(process);
        }  
        var query = processModel.find({ application: {"$in": process_array }, run: new RegExp('^'+date+'', "i") }); 
        query.exec((err, result)=> { 
            if (err) {
                console.log(`Error when calling the 'readFromMongoDB' microservice - DBQuery issue on execution: ${err}`); 
                res.status(400).send({ api_error: true, message: `Error when calling the 'readFromMongoDB' microservice - DBQuery issue on execution: ${err}` });
            } else {    
                res.status(200).json({ api_error: false, runs: result });  
            }; 
            mongoose.connection.close();
        });     
    }).catch((error) => { 
        console.log(`Error when calling the 'readFromMongoDB' microservice - MongoDB connection error: ${error}`);   
        throw res.status(400).send({ api_error: true, message: `Error when calling the 'readFromMongoDB' microservice - MongoDB connection error: ${error}` }); 
    });    
}); 

router.get('/getData/:isoCode/:process/:dateFrom/:dateTo', (req, res)=>{  
    let isoCode = req.params.isoCode;
    let process = req.params.process.toLowerCase();
    let dateFrom = req.params.dateFrom;   
    let dateTo = req.params.dateTo; 
    if ((!isoCode) || isoCode.match(/^[a-zA-Z][a-zA-Z]$/g)!=isoCode ) {
        return res.status(400).send({ api_error: true, message: 'Please provide a valid country isoCode!' }); 
    };  
    if ((!process) || ['porthos','aramis','datatrans','rc','all'].indexOf(process.toLowerCase())==-1 ) 
        { return res.status(400).send({ api_error: true, message: 'Please provide a valid process name!' }); 
    }; 
    if ((!dateFrom) || dateFrom.match(/([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))/g)!=dateFrom ) {   
        return res.status(400).send({ api_error: true, message: 'Please provide a valid dateFrom!' }); 
    };   
    if ((!dateTo) || dateTo.match(/([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))/g)!=dateTo ) {   
        return res.status(400).send({ api_error: true, message: 'Please provide a valid dateTo!' }); 
    };   
    var dbURI = db.SSHTunelConfig.dstHost;   
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
            case "all": 
                var processModel = mongoose.model('all', schema.schema_all, 'processes_'+isoCode); 
                break;     
        };    
        var process_array = [] ;
        if (process == "all") {
            process_array = ['porthos','aramis','datatrans','rc'];
        } else {
            process_array.push(process);
        }
        var date_array = functions.getArrayofDates(dateFrom, dateTo, "RegEX");  
        var query = processModel.find({ application: {"$in": process_array }, run: {"$in": date_array }} ); 
        // var query = processModel.find({ application: process, run: {"$in": date_array }} ); 
        query.exec((err, result)=> { 
            if (err) {
                console.log(`Error when calling the 'readFromMongoDB' microservice - DBQuery issue on execution: ${err}`); 
                res.status(400).send({ api_error: true, message: `Error when calling the 'readFromMongoDB' microservice - DBQuery issue on execution: ${err}` });
            } else {    
                res.status(200).json({ api_error: false, runs: result });  
            }; 
            mongoose.connection.close();
        });     
    }).catch((error) => { 
        console.log(`Error when calling the 'readFromMongoDB' microservice - MongoDB connection error: ${error}`);   
        throw res.status(400).send({ api_error: true, message: `Error when calling the 'readFromMongoDB' microservice - MongoDB connection error: ${error}` }); 
    });    
}); 

router.get('/getDataflowData/:isoCode/:date', (req, res)=>{  
    let isoCode = req.params.isoCode; 
    let date = req.params.date;   
    if ((!isoCode) || isoCode.match(/^[a-zA-Z][a-zA-Z]$/g)!=isoCode ) {
        return res.status(400).send({ api_error: true, message: 'Please provide a valid country isoCode!' }); 
    };   
    if ((!date) || date.match(/([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))/g)!=date ) {   
        return res.status(400).send({ api_error: true, message: 'Please provide a valid date!' }); 
    };   
    var dbURI = db.SSHTunelConfig.dstHost;   
    mongoose.connect( dbURI, db.mongoConnOptions).then(() => {   
        var processModel = mongoose.model('all', schema.schema_all, 'processes_'+isoCode);  
        var query = processModel.find({ application: {"$in": ['porthos','aramis','datatrans','rc'] }, run: new RegExp('^'+date+'', "i") }); 
        query.exec((err, result)=> { 
            if (err) {
                console.log(`Error when calling the 'readFromMongoDB' microservice - DBQuery issue on execution: ${err}`); 
                res.status(400).send({ api_error: true, message: `Error when calling the 'readFromMongoDB' microservice - DBQuery issue on execution: ${err}` });
            } else {     
                res.status(200).json({ 
                    api_error: false, 
                    country: isoCode,
                    date: date, 
                    process: functions.getDataflowJSON(result) 
                });   
            }; 
            mongoose.connection.close();
        });     
    }).catch((error) => { 
        console.log(`Error when calling the 'readFromMongoDB' microservice - MongoDB connection error: ${error}`);   
        throw res.status(400).send({ api_error: true, message: `Error when calling the 'readFromMongoDB' microservice - MongoDB connection error: ${error}` }); 
    });    
});
 

router.get('*', (req, res)=> {  
    res.sendFile(path.join(__dirname + '/index.html'));
});



module.exports = router;