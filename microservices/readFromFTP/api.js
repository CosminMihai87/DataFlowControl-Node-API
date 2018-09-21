const express = require('express');
const router = express.Router();
const db = require('../../database.js');   
var client = require('ftp');  
var functions = require('../../functions.js');   

router.get('/', (req, res)=> { 
    res.json({ message: 'Hello! Welcome to our readFromFTP microservice!' });  
});

router.get('/getLogFilesList/:process/:isoCode', (req, res)=>{  
    let isoCode = req.params.isoCode;
    let process = req.params.process;
    if (!isoCode) { return res.status(400).send({ api_error: true, message: 'Please provide a country isoCode!' }); }  
    if (!process) { return res.status(400).send({ api_error: true, message: 'Please provide a process name!' }); }  
    var readFTP = new client();
    //on connected to ftp event :
    readFTP.on('ready', ()=> { 
        // navigating to the proper path on the ftp depending on country and process:
        readFTP.cwd( functions.getProtPath(process,isoCode), (error)=> {  
            if (error) {   
                console.log(`Error when changing the path on the ftp server: ${error}`);
                res.status(400).send({ api_error: true, message: `Error when changing the path on the ftp server: ${error}` }); 
            } else {
                readFTP.list((error, list)=> { 
                    if (error) {    
                        console.log(`Error when getting the list of files: ${error}`);
                        res.status(400).send({ api_error: true, message: `Error when getting the list of files: ${error}` }); 
                    } else { 
                        var files = list.map((k)=>{ return { type: k['type'], name: k['name'], owner: k['owner'], size: k['size'], date: functions.getProcessDateTime(k['name'])  } });  // functions.getProcessDateTime(k['name'])     // k['date'].toISOString()
                        files = files.filter(k => k.type != 'd'); //all files NOT folders 
                        files = files.sort( (a, b)=> { return new Date(a.date).getTime() - new Date(b.date).getTime(); }).reverse(); //sorting files descending based on date
                        if (process.toLowerCase()=='porthos') { 
                             files = files.filter(k => k.owner === '32382');  //all porthos log files if the process is Porthos   
                        }; 
                        if (process.toLowerCase()=='datatrans') { 
                            files = files.filter(k => k.date.indexOf(new Date(Date.now() - 864e5).toISOString().substring(0,10)) == 0 );  //since datatrans runs 1 day behind we might need to grab the previous day one 
                        } else {
                            files = files.filter(k => k.date.indexOf(new Date().toISOString().substring(0,10)) == 0 ); //only take the curent day's files not older files.  
                        }
                        // files = files.filter(k => k.date.indexOf('2018-07-01') == 0 );  //ARAMIS TEST FILE WITH ERRORs FOR TESTING   
                        res.status(200).json({ api_error: false, message: `The Log files list for the  ${isoCode} ${process} process is:`, files: files });  
                    }
                })
            };
        });
    }); 
    readFTP.connect(db.ftpConnection(isoCode));    
});


router.get('/getLogData/:process/:isoCode/:filename', (req, res)=>{  
    let isoCode = req.params.isoCode;
    let process = req.params.process;
    let filename = req.params.filename; 
    if (!isoCode) { return res.status(400).send({ api_error: true, message: 'Please provide a country isoCode!' }); }  
    if (!process) { return res.status(400).send({ api_error: true, message: 'Please provide a process name!' }); }  
    if (!filename) { return res.status(400).send({ api_error: true, message: 'Please provide a filename!' }); }  
    var readFTP = new client();
    //on connected to ftp event :
    readFTP.on('ready', ()=> { 
        //navigating to the proper path on the ftp depending on country and process:
        readFTP.cwd( functions.getProtPath(process,isoCode), (error)=> {  
            if (error) {   
                console.log(`Error when changing the path on the ftp server: ${error}`);
                res.status(400).send({ api_error: true, message: `Error when changing the path on the ftp server: ${error}` }); 
            } else { 
                readFTP.get( functions.getProtPath(process,isoCode) + filename, (error, stream )=> {  
                    if (error) {    
                        console.log(`Error when parsing and processing file ${filename} : ${error}`); 
                        res.status(400).send({ api_error: true, message: `Error when parsing and processing file ${filename} : ${error}` }); 
                    } else {       
                        const chunks = [];  
                        stream.on("data", (chunk)=> { chunks.push(chunk); }) 
                        .on('end', ()=> {  
                            res.status(200).json({
                                api_error: false, 
                                message: `The LogData for the ${isoCode} ${process} file '${filename}' is:`,
                                process: {
                                    country: isoCode,
                                    application: process,
                                    run : functions.getProcessDateTime(filename).replace(/-|:|.000Z/g,'').replace(/T/g,'_'),
                                    date : functions.getProcessDateTime(filename),
                                    filename : filename, 
                                    data : functions.getProcessJSON(process,chunks,filename)  
                                }
                            });  
                        });  
                    }
                })  
            };
        });
    }); 
    readFTP.connect(db.ftpConnection(isoCode));   
});


module.exports = router;