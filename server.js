var express = require('express') 
const app = express();  
var db = require('./database.js'); 
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
        readFTP.cwd( processing.getProtPath(process,isoCode), (error)=> {  
            if (error) {   
                console.log(`Error when changing the path on the ftp server: ${error}`);
                throw res.status(400).send({ error: true, message: `Error when changing the path on the ftp server: ${error}` }); 
            }
            getFileDetails(readFTP).then((files)=> {   
                //we call the for as an ASYNC function so that the res.send waits for answer from this for and then writes it to the UI
                async function get_all_files() {
                    var return_array =[];
                    for (let [index, filename] of files.map(k => k.name).entries() ) {    
                        var jsonResult = await getProcessedFile(readFTP,files,filename,index,process,isoCode); //we wait for each read from ftp to finish to start the next one
                        return_array.push(jsonResult);
                    }
                    return return_array;
                }
                get_all_files().then((jsonResult) => { 
                    res.send({ process : jsonResult })
                }); 
            }); 
        })
    });  
     
    readFTP.connect(db.connection(isoCode)); 

    var getFileDetails = function(readFTP){
        return new Promise((resolve, reject)=> {
            readFTP.list((error, list)=> {
                if (error) {   
                    reject(`Error when getting the list of files: ${error}`)
                    console.log(`Error when getting the list of files: ${error}`);
                    throw res.status(400).send({ error: true, message: `Error when getting the list of files: ${error}` }); 
                }
                var files = list.map((k)=>{ return { type: k['type'], name: k['name'], owner: k['owner'], size: k['size'], date: k['date'].toISOString() } });  // processing.getProcessDateTime(k['name'])
                files = files.filter(k => k.type != 'd'); //all files NOT folders 
                files = files.sort( (a, b)=> { return new Date(a.date).getTime() - new Date(b.date).getTime(); }).reverse(); //sorting files descending based on date
                if (process.toLowerCase()=='porthos') {  files = files.filter(k => k.owner === '32382'); }  //all porthos log files if the process is Porthos   
                files = files.filter(k => k.date.indexOf(new Date().toISOString().substring(0,10)) == 0 ); //only take the curent day's files not older files. 
                // files = files.filter(k => k.date.indexOf('2018-07-01') == 0 );  //ARAMIS TEST FILE WITH ERRORs    
                resolve(files); 
            })
        })
    }
 
    async function getProcessedFile(readFTP,files,filename,index,process,isoCode){   
        return new Promise((resolve, reject)=> {
            readFTP.get( processing.getProtPath(process,isoCode) + filename, (error, stream )=> {  
                if (error) {   
                    reject(`Error when parsing and processing file ${filename} : ${error}`);
                    console.log(`Error when parsing and processing file ${filename} : ${error}`);
                    throw res.status(400).send({ error: true, message: `Error when parsing and processing file ${filename} : ${error}` }); 
                } else {       
                    const chunks = [];  
                    stream.on("data", (chunk)=> { chunks.push(chunk); }) 
                    .on('end', ()=> {  
                        resolve({ 
                            country: isoCode,
                            application: process,
                            run : processing.getProcessRunName(filename),
                            date : processing.getProcessDateTime(filename),
                            filename : filename, 
                            data : processing.getProcessJSON(process,chunks,filename)   
                        });   
                    });  
                }
            })   
        })
    }
    
});



 

// port must be set to 8080 because incoming http requests are routed from port 80 to port 8080
var server = app.listen(8080, ()=> { 
    var host = server.address().address;
    var port = server.address().port; 
    console.log("Node Application is listening at http://%s:%s", host, port);
}); 
 
module.exports = app;



 
 