var express = require('express') 
const app = express();  
var db = require('./database'); 
var path = require('path');
var fs = require('fs');
var Client = require('ftp');   
var bodyParser = require('body-parser'); 
var processing = require('./processing.js');

app.use(express.static('public'));

//Decurent path where the script runs from:
var currentPath = process.cwd();

//Default home page Route
app.get('/', (req, res)=> {
    console.log('Return succesfull for route: ', req.path );
    res.json({ message: 'Hello! Welcome to our REST API!' });  
});
 
app.get('/getProtocol/:process/:isoCode', (req, res)=>{  
    let isoCode = req.params.isoCode;
    let process = req.params.process;
    if (!isoCode) { return res.status(400).send({ error: true, message: 'Please provide a country isoCode!' }); }  
    if (!process) { return res.status(400).send({ error: true, message: 'Please provide a process name!' }); }  
    var readFTP = new Client();
    //on connected to ftp event :
    readFTP.on('ready', ()=> { 
        //changing the file to the specific protocol path:  
        readFTP.cwd( processing.getProtPath(process,isoCode), (error)=> {
            if (error) throw error;  
            readFTP.list((error, list)=> {
                //reading the files from the desired path and structuring them in a json
                if (error) throw error; 
                var files = list.map((k)=>{ return { type: k['type'], name: k['name'], owner: k['owner'], size: k['size'], date: k['date'].toISOString() } });  // processing.getProcessDateTime(k['name'])
                if (process.toLowerCase()=='porthos') {  files = files.filter(k => k.owner === '32382'); } //all porthos log files 
                // files = files.filter(k => k.date.indexOf(new Date().toISOString().substring(0,10)) == 0 ); //only take the curent day's files not older files.  
                files = files.filter(k => k.date.indexOf('2018-08-13') == 0 );  //ARAMIS TEST FILE WITH ERRORs
                    // downloading the specific files from the list above:
                    for (let [index, filename] of files.map(k => k.name).entries() ) {      
                        if (index==0) {
                            readFTP.get( processing.getProtPath(process,isoCode) + filename, (error, stream)=> { 
                                if (error) {  
                                    console.log(error);
                                    throw res.status(400).send({ error: true, message: error }); 
                                } else {       
                                    const chunks = [];  
                                    stream.on("data", (chunk)=> { chunks.push(chunk); }) 
                                    .on('end', ()=> {  
                                        res.send({ 
                                            error: false,    
                                            file : files.map((k)=>{ return { name: k['name'], size: k['size'] } })[index] , 
                                            data : processing.getProcessJSON(process,chunks), 
                                            message: process + ' details for the country with the ' + isoCode + ' isoCode.' 
                                        })
                                    });    
                                }
                            }) 
                        }  
                    }
                readFTP.end(); 
            }); 
            readFTP.end();  
        });   
    }); 
    readFTP.connect(db); 
});



 

// port must be set to 8080 because incoming http requests are routed from port 80 to port 8080
var server = app.listen(8080, ()=> { 
    var host = server.address().address;
    var port = server.address().port; 
    console.log("Node Application is listening at http://%s:%s", host, port);
}); 
 
module.exports = app;



 
 