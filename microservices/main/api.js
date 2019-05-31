const express = require('express'); 
const router = express.Router(); 
const axios = require('axios');      
const path = require('path'); 
const https = require('https');

router.use('/', express.static('html'));

router.get('/updateMongoDB/:isoCode', (req, res)=> {    
    // WORK IN PROGRESS   
});  

router.get('/updateMongoDB/:isoCode/:process', (req, res)=> {    
    let isoCode = req.params.isoCode;
    let process = req.params.process; 
    if ((!isoCode) || isoCode.match(/^[a-zA-Z][a-zA-Z]$/g)!=isoCode ) {
        return res.status(400).send({ api_error: true, message: 'Please provide a valid country isoCode!' }); 
    };  
    if ((!process) || ['porthos','aramis','datatrans','rc'].indexOf(process.toLowerCase())==-1 ) 
        { return res.status(400).send({ api_error: true, message: 'Please provide a valid process name!' }); 
    };   
    // grabing the filelist from the FTP server 
    axios.get('https://localhost:1001/getLogFilesList/'+ isoCode +'/'+ process, { httpsAgent: new https.Agent({ rejectUnauthorized: false })} ) 
    .then((response) => {     
        console.log(response.data); 
        filelist = response.data.files.map((k)=>{ return {name: k.name, date: k.date} });    
        const all_checkLogData_Calls = async () => {
            var returnJson =[];  
            try {
                let to_call = filelist.map((k) => { return axios.get('https://localhost:1002/checkLogData/'+ isoCode +'/'+ process +'/'+ k.name, { httpsAgent: new https.Agent({ rejectUnauthorized: false })} ) } );
                let called = await Promise.all(to_call);  
                called.forEach(response => {  
                    // if the file is not found we call the microservice to write it to the db 
                    if (response.data.found == false ) {  
                        // we call the microservice that parses the log and extracts the data in a json format 
                        axios.get('https://localhost:1001/getLogData/'+ isoCode +'/'+ process +'/'+ response.data.filename, { httpsAgent: new https.Agent({ rejectUnauthorized: false })} )
                        .then((response) => {    
                            // we call another microservice to write the data extracted in the DB
                            axios.post('https://localhost:1003/sendLogData/'+ isoCode +'/'+ process , response.data.process, { httpsAgent: new https.Agent({ rejectUnauthorized: false })} )
                            .then((response) => {     
                                // const add_to_returnJson = async () => {
                                //     return { filename: response.data.filename, message: response.data.message, process: response.data.process }; 
                                // };
                                // add_to_returnJson().then((result) => {  
                                //     console.log(result.message)
                                //     returnJson.push(result);   
                                // }); 
                                console.log( response.data.message );
                            }) 
                            .catch((error) => {
                                console.log(`Error when calling the 'sendLogData' from main server for our ${response.data.process.filename} ${isoCode} ${process} run: ${error}`);
                                throw res.status(400).send({ api_error: true, message: `Error when calling the 'sendLogData' from main server for our ${response.data.process.filename} ${isoCode} ${process} run: ${error}` }); 
                            });     
                        }) 
                        .catch((error) => { 
                            console.log(`Error when calling the 'getLogData' from main server for our ${response.data.filename} ${isoCode} ${process} run: ${error}`);
                            throw res.status(400).send({ api_error: true, message: `Error when calling the 'getLogData' from main server for our ${response.data.filename} ${isoCode} ${process} run: ${error}` }); 
                        });    
                    } else { 
                        returnJson.push({ filename: response.data.filename, message: `'${response.data.filename}' from the ${isoCode} ${process} process already exists in the DB!`, process: {} });
                    }; 
                }); //foreach  
                return returnJson;
            } catch (error) { 
                console.log(`Error when calling the 'all_checkLogData_Calls' from main server: ${error}`);
                throw res.status(400).send({ api_error: true, message: `Error when calling the 'all_checkLogData_Calls' from main server: ${error}` }); 
            }
        };
        all_checkLogData_Calls().then((returnJson) => {  
            res.status(200).json({ api_error : false, actions: returnJson })
        }); 
    })
    .catch((error) => {
        console.log(`Error when calling the 'getLogFilesList' from main server: ${error}`);
        throw res.status(400).send({ api_error: true, message: `Error when calling the 'getLogFilesList' from main server: ${error}` }); 
    });  
}); 

router.get('/updateMongoDB/:isoCode/:process/:date', (req, res)=> {   
    let isoCode = req.params.isoCode;
    let process = req.params.process; 
    let date = req.params.date; 
    if ((!isoCode) || isoCode.match(/^[a-zA-Z][a-zA-Z]$/g)!=isoCode ) {
        return res.status(400).send({ api_error: true, message: 'Please provide a valid country isoCode!' }); 
    };  
    if ((!process) || ['porthos','aramis','datatrans','rc'].indexOf(process.toLowerCase())==-1 ) 
        { return res.status(400).send({ api_error: true, message: 'Please provide a valid process name!' }); 
    }; 
    if ((!date) || date.match(/([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))/g)!=date ) {   
        return res.status(400).send({ api_error: true, message: 'Please provide a valid date!' }); 
    };    
    // grabing the filelist from the FTP server 
    axios.get('https://localhost:1001/getLogFilesList/'+ isoCode +'/'+ process +'/'+ date, { httpsAgent: new https.Agent({ rejectUnauthorized: false })} )
    .then((response) => {      
        filelist = response.data.files.map((k)=>{ return {name: k.name, date: k.date} });    
        const all_checkLogData_Calls = async () => {
            var returnJson =[]; 
            try {
                let to_call = filelist.map((k) => { return axios.get('https://localhost:1002/checkLogData/'+ isoCode +'/'+ process +'/'+ k.name, { httpsAgent: new https.Agent({ rejectUnauthorized: false })} ) } );
                let called = await Promise.all(to_call);  
                called.forEach(response => { 
                    // if the file is not found we call the microservice to write it to the db 
                    if (response.data.found == false ) {  
                        // we call the microservice that parses the log and extracts the data in a json format 
                        axios.get('https://localhost:1001/getLogData/'+ isoCode +'/'+ process +'/'+ response.data.filename, { httpsAgent: new https.Agent({ rejectUnauthorized: false })} )
                        .then((response) => {    
                            // we call another microservice to write the data extracted in the DB
                            axios.post('https://localhost:1003/sendLogData/'+ isoCode +'/'+ process , response.data.process, { httpsAgent: new https.Agent({ rejectUnauthorized: false })} )
                            .then((response) => {    
                                // const add_to_returnJson = async () => {
                                //     return { filename: response.data.filename, message: response.data.message, process: response.data.process }; 
                                // };
                                // add_to_returnJson().then((result) => {  
                                //     console.log(result.message)
                                //     returnJson.push(result);
                                // }); 
                                console.log(response.data.message);
                            }) 
                            .catch((error) => {
                                console.log(`Error when calling the 'sendLogData' from main server for our ${response.data.process.filename} ${isoCode} ${process} run: ${error}`);
                                throw res.status(400).send({ api_error: true, message: `Error when calling the 'sendLogData' from main server for our ${response.data.process.filename} ${isoCode} ${process} run: ${error}` }); 
                            });     
                        }) 
                        .catch((error) => { 
                            console.log(`Error when calling the 'getLogData' from main server for our ${response.data.filename} ${isoCode} ${process} run: ${error}`);
                            throw res.status(400).send({ api_error: true, message: `Error when calling the 'getLogData' from main server for our ${response.data.filename} ${isoCode} ${process} run: ${error}` }); 
                        });    
                    } else { 
                        returnJson.push({ filename: response.data.filename, message: `'${response.data.filename}' from the ${isoCode} ${process} process already exists in the DB!`, process: {} });
                    }; 
                }); //foreach  
                return returnJson;
            } catch (error) { 
                console.log(`Error when calling the 'all_checkLogData_Calls' from main server: ${error}`);
                throw res.status(400).send({ api_error: true, message: `Error when calling the 'all_checkLogData_Calls' from main server: ${error}` }); 
            }
        };
        all_checkLogData_Calls().then((returnJson) => {  
            res.status(200).json({ api_error : false, actions: returnJson })
        }); 
    })
    .catch((error) => {
        console.log(`Error when calling the 'getLogFilesList' from main server: ${error}`);
        throw res.status(400).send({ api_error: true, message: `Error when calling the 'getLogFilesList' from main server: ${error}` }); 
    });  
}); 

router.get('/updateMongoDB_ftp/:isoCode/:process/:date', (req, res)=> {   
    let isoCode = req.params.isoCode;
    let process = req.params.process; 
    let date = req.params.date; 
    if ((!isoCode) || isoCode.match(/^[a-zA-Z][a-zA-Z]$/g)!=isoCode ) {
        return res.status(400).send({ api_error: true, message: 'Please provide a valid country isoCode!' }); 
    };  
    if ((!process) || ['porthos','aramis','datatrans','rc'].indexOf(process.toLowerCase())==-1 ) 
        { return res.status(400).send({ api_error: true, message: 'Please provide a valid process name!' }); 
    }; 
    if ((!date) || date.match(/([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))/g)!=date ) {   
        return res.status(400).send({ api_error: true, message: 'Please provide a valid date!' }); 
    };    
    // grabing the filelist from the FTP server 
    axios.get('https://localhost:1001/getLogFilesList_ftp/'+ isoCode +'/'+ process +'/'+ date, { httpsAgent: new https.Agent({ rejectUnauthorized: false })} )
    .then((response) => {      
        filelist = response.data.files.map((k)=>{ return {name: k.name, date: k.date} });    
        const all_checkLogData_Calls = async () => {
            var returnJson =[]; 
            try {
                let to_call = filelist.map((k) => { return axios.get('https://localhost:1002/checkLogData/'+ isoCode +'/'+ process +'/'+ k.name, { httpsAgent: new https.Agent({ rejectUnauthorized: false })} ) } );
                let called = await Promise.all(to_call);  
                called.forEach(response => { 
                    // if the file is not found we call the microservice to write it to the db 
                    if (response.data.found == false ) {  
                        // we call the microservice that parses the log and extracts the data in a json format 
                        axios.get('https://localhost:1001/getLogData_ftp/'+ isoCode +'/'+ process +'/'+ response.data.filename, { httpsAgent: new https.Agent({ rejectUnauthorized: false })} )
                        .then((response) => {    
                            // we call another microservice to write the data extracted in the DB
                            axios.post('https://localhost:1003/sendLogData/'+ isoCode +'/'+ process , response.data.process, { httpsAgent: new https.Agent({ rejectUnauthorized: false })} )
                            .then((response) => {    
                                // const add_to_returnJson = async () => {
                                //     return { filename: response.data.filename, message: response.data.message, process: response.data.process }; 
                                // };
                                // add_to_returnJson().then((result) => {  
                                //     console.log(result.message)
                                //     returnJson.push(result);
                                // }); 
                                console.log(response.data.message);
                            }) 
                            .catch((error) => {
                                console.log(`Error when calling the 'sendLogData' from main server for our ${response.data.process.filename} ${isoCode} ${process} run: ${error}`);
                                throw res.status(400).send({ api_error: true, message: `Error when calling the 'sendLogData' from main server for our ${response.data.process.filename} ${isoCode} ${process} run: ${error}` }); 
                            });     
                        }) 
                        .catch((error) => { 
                            console.log(`Error when calling the 'getLogData' from main server for our ${response.data.filename} ${isoCode} ${process} run: ${error}`);
                            throw res.status(400).send({ api_error: true, message: `Error when calling the 'getLogData' from main server for our ${response.data.filename} ${isoCode} ${process} run: ${error}` }); 
                        });    
                    } else { 
                        returnJson.push({ filename: response.data.filename, message: `'${response.data.filename}' from the ${isoCode} ${process} process already exists in the DB!`, process: {} });
                    }; 
                }); //foreach  
                return returnJson;
            } catch (error) { 
                console.log(`Error when calling the 'all_checkLogData_Calls' from main server: ${error}`);
                throw res.status(400).send({ api_error: true, message: `Error when calling the 'all_checkLogData_Calls' from main server: ${error}` }); 
            }
        };
        all_checkLogData_Calls().then((returnJson) => {  
            res.status(200).json({ api_error : false, actions: returnJson })
        }); 
    })
    .catch((error) => {
        console.log(`Error when calling the 'getLogFilesList_ftp' from main server: ${error}`);
        throw res.status(400).send({ api_error: true, message: `Error when calling the 'getLogFilesList_ftp' from main server: ${error}` }); 
    });  
}); 

router.get('*', (req, res)=> {  
    res.sendFile(path.join(__dirname + '/index.html'));
});


module.exports = router;



 
 