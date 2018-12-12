const express = require('express');
const fs = require('fs');   
const path = require('path');
var targz = require('targz');   
const router = express.Router();
const db = require('../../settings.js');   
var client = require('ftp');  
var functions = require('../../functions.js');   

router.use('/', express.static('html'));
 
router.get('/getLogFilesList/:isoCode/:process', (req, res)=>{    
    let isoCode = req.params.isoCode;
    let process = req.params.process; 
    if ((!isoCode) || isoCode.match(/^[a-zA-Z][a-zA-Z]$/g)!=isoCode ) {
        return res.status(400).send({ api_error: true, message: 'Please provide a valid country isoCode!' }); 
    };  
    if ((!process) || ['porthos','aramis','datatrans','rc'].indexOf(process.toLowerCase())==-1 ) { 
        return res.status(400).send({ api_error: true, message: 'Please provide a valid process name!' }); 
    }; 
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
                        var files = list.map((k)=>{ return { 
                            type: k['type'], 
                            name: k['name'], 
                            owner: k['owner'], 
                            size: k['size'], 
                            date: functions.getProcessDateTime(k['name']), // functions.getProcessDateTime(k['name'])     // k['date'].toISOString()
                            path: functions.getProtPath(process,isoCode)
                        } });   
                        files = files.filter(k => k.type != 'd'); //all files NOT folders 
                        files = files.sort( (a, b)=> { return new Date(a.date).getTime() - new Date(b.date).getTime(); }).reverse(); //sorting files descending based on date
                        if (process.toLowerCase()=='porthos') { 
                            files = files.filter(k => k.owner === '32382');  //all porthos log files if the process is Porthos   
                            files = files.filter(k => k.name.indexOf('Duplicates')==-1);  //all porthos log files without duplicates log files
                        }; 
                        if (process.toLowerCase()=='datatrans') { 
                            files = files.filter(k => k.date.indexOf(new Date(Date.now() - 864e5).toISOString().substring(0,10)) == 0 );  //since datatrans runs 1 day behind we might need to grab the previous day one 
                        } else {
                            files = files.filter(k => k.date.indexOf(new Date().toISOString().substring(0,10)) == 0 ); //only take the curent day's files not older files.  
                        }
                        // files = files.filter(k => k.date.indexOf('2018-07-01') == 0 );  //ARAMIS TEST FILE WITH ERRORs FOR TESTING   
                        res.status(200).json({
                            api_error: false, 
                            message: `The last Log files list for the  ${isoCode} ${process} process is:`, 
                            files: files
                        });  
                    }
                })
            };
        });
    }); 
    readFTP.connect(db.ftpConnection(isoCode));    
});

router.get('/getLogFilesList/:isoCode/:process/:date', (req, res)=>{  
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
    var readFTP = new client(); 
    readFTP.on('ready', ()=> { 
        var final_list = [];  
        readFTP.cwd( functions.getProtPath(process,isoCode), (error)=> {  
            if (error) {   
                console.log(`Error when changing the path on the ftp server: ${error}`);
                res.status(400).send({ api_error: true, message: `Error when changing the path on the ftp server: ${error}` }); 
            } else {
                readFTP.list((error, list)=> {  
                    if (error) {    
                        console.log(`Error when getting the list of files: ${error}`);
                        res.status(400).send({ api_error: true, message: `Error when getting the list of files: ${error}` }); 
                    };
                    if (process.toLowerCase()=='porthos') {  
                        list = list.filter(k => k.owner === '32382'); //all porthos log files if the process is Porthos  
                        list = list.filter(k => k.name.indexOf('Duplicates')==-1);  //all porthos log files without duplicates log files
                     };   
                    var filtered =  list.filter(k => k.name.indexOf(date)!=-1 ); 
                    if ( filtered.length > 0 ) {   
                        filtered.forEach(item => {
                            final_list.push(  
                                { 
                                    type: item.type, 
                                    name: item.name,
                                    owner: item.owner,
                                    size: item.size,
                                    date: functions.getProcessDateTime(item.name),
                                    path: functions.getProtPath(process,isoCode)    
                                }
                            );
                        }); 
                        res.status(200).json({ 
                            api_error: false, 
                            message: `The Log files list for the  ${isoCode} ${process} process from ${date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8)} are:`, 
                            files: final_list 
                        });    
                    } else {
                        //this means it has been archived so we need to "dig deeper" for the files :) : 
                        readFTP.cwd( functions.getProtPath(process,isoCode)+'archive', (error)=> {   
                            if (error) {    
                                console.log(`Error when changing the path on the ftp server: ${error}`);
                                res.status(400).send({ api_error: true, message: `Error when changing the path on the ftp server: ${error}` }); 
                            } else {
                                readFTP.list((error, list)=> {  
                                    if (error) {    
                                        console.log(`Error when getting the list of files: ${error}`);
                                        res.status(400).send({ api_error: true, message: `Error when getting the list of files: ${error}` }); 
                                    } else {
                                        list = list.filter(k => k.name.indexOf(date)!=-1 ); 
                                        if  (list.length > 0) {
                                            // we download the archive since we cannot parse from archives   
                                            readFTP.get( functions.getProtPath(process,isoCode)+'/archive/'+ list[0].name , (error, stream) => { 
                                                if (error) {
                                                    console.log(`Error when downloading the archive file locally: ${error}`);
                                                    res.status(400).send({ api_error: true, message: `Error when downloading the archive file locally: ${error}` }); 
                                                }
                                                stream.once('close', ()=> { readFTP.end(); }); 
                                                stream.pipe(fs.createWriteStream( path.join(__dirname, './../../downloads/') +list[0].name));    
                                                stream.on('finish', () => {   
                                                    // the async unzip function
                                                    async function unzip(path){ 
                                                        return await new Promise((resolve, reject) => { 
                                                            targz.decompress({
                                                                src: path,
                                                                dest: path.split('.')[1]
                                                            }, (error) => {
                                                                if(error) {
                                                                    console.log(`Error when extracting the .tar.gz archive locally: ${error}`); 
                                                                    reject(`Error when extracting the .tar.gz archive locally: ${error}`); 
                                                                } else { 
                                                                    console.log(`Decompressed locally succesfully : ${path.split('.')[1]}`);
                                                                    resolve(path.split('.')[1]);
                                                                }
                                                            })
                                                        });
                                                    };  
                                                    // getting (async) the files from the unzipped path  
                                                    async function getFileList(path) { 
                                                        return await new Promise((resolve, reject) => {
                                                            try {  
                                                                fs.readdir(path, (error, files) => {
                                                                    if(error) {
                                                                        console.log(`Error when getting the names of the files from local extracted folder: ${error}`);
                                                                        reject(`Error when getting the names of the files from local extracted folder: ${error}`);
                                                                        res.status(400).send({ api_error: true, message: `Error when getting the names of the files from local extracted folder: ${error}` }); 
                                                                    } else {  
                                                                        var resp = []; 
                                                                        files.forEach(file => {  
                                                                            if (file.indexOf('GDPR')==-1 && file.indexOf('Duplicates')==-1) {
                                                                                resp.push({ 
                                                                                        type: '-', 
                                                                                        name: file,
                                                                                        owner: '32382',
                                                                                        size: fs.statSync(path+'/'+file).size,
                                                                                        date: functions.getProcessDateTime(file),
                                                                                        path: functions.getProtPath(process,isoCode)+'archive/'+list[0].name 
                                                                                });
                                                                            }
                                                                        });  
                                                                        resolve(resp);
                                                                    }  
                                                                })
                                                            } catch (error) {
                                                                console.log(`Error when getting the names of the files via sync function 'getFileList': ${error}`);
                                                                reject(`Error when getting the names of the files via sync function 'getFileList: ${error}`);
                                                                throw res.status(400).send({ api_error: true, message: `Error when getting the names of the files via sync function 'getFileList': ${error}` });  
                                                            } 
                                                        });
                                                    };   
                                                    // cleaning up the downloads folder where we downloaded , unzipped and processed the files 
                                                    async function clean_up(path2clean) {
                                                        return await new Promise((resolve, reject) => {
                                                            fs.readdir(path2clean, (err, files) => {    
                                                                if (err) throw err; 
                                                                for (const file of files) { 
                                                                    fs.unlink(path.join(path2clean, file), err => { 
                                                                        if (err) {
                                                                            reject(error)
                                                                            throw err;
                                                                        } else {
                                                                            resolve(`Deleted locally succesfully : ${path2clean}`)
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        });
                                                    };   
                                                    // the process in order : unzipp the downloaded files , work with them to get the res json to display, then delete the downloaded fiels
                                                    unzip( path.join(__dirname, './../../downloads/') +list[0].name).then((finalpath)=>{ 
                                                        getFileList( finalpath ).then((result)=>{ 
                                                            res.status(200).json({ 
                                                                api_error: false, 
                                                                message: `The Log files list for the ${isoCode} ${process} process from ${date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8)} are:`, 
                                                                files: result 
                                                            }); 
                                                            clean_up( path.join(__dirname, './../../downloads/') ).then((response)=>{
                                                                console.log(response);
                                                            }); 
                                                        });    
                                                    }); 
                                                });
                                            }); 
                                        }
                                    }
                                });      
                            }
                        });  
                    } 
                })  
            };
        });
    }); 
    readFTP.connect(db.ftpConnection(isoCode)); 
});
 
router.get('/getLogData/:isoCode/:process/:filename', (req, res)=>{  
    let isoCode = req.params.isoCode;
    let process = req.params.process;
    let filename = req.params.filename; 
    if ((!isoCode) || isoCode.match(/^[a-zA-Z][a-zA-Z]$/g)!=isoCode ) {
        return res.status(400).send({ api_error: true, message: 'Please provide a valid country isoCode!' }); 
    };  
    if ((!process) || ['porthos','aramis','datatrans','rc'].indexOf(process.toLowerCase())==-1 ) 
        { return res.status(400).send({ api_error: true, message: 'Please provide a valid process name!' }); 
    }; 
    if (!filename) {   
        return res.status(400).send({ api_error: true, message: 'Please provide a filename!' }); 
    };      
    var readFTP = new client();
    //on connected to ftp event :
    readFTP.on('ready', ()=> { 
        //navigating to the proper path on the ftp depending on country and process:
        readFTP.cwd( functions.getProtPath(process,isoCode), (error)=> {  
            if (error) {   
                console.log(`Error when changing the path on the ftp server: ${error}`);
                res.status(400).send({ api_error: true, message: `Error when changing the path on the ftp server: ${error}` }); 
            } else { 
                readFTP.list((error, list)=> {  
                    if (error) {    
                        console.log(`Error when getting the list of files: ${error}`);
                        res.status(400).send({ api_error: true, message: `Error when getting the list of files: ${error}` }); 
                    };
                    if (process.toLowerCase()=='porthos') {  list = list.filter(k => k.owner === '32382');  };  //all porthos log files if the process is Porthos   
                    var filtered =  list.filter(k => k.name==filename ); 
                    if ( filtered.length > 0 ) {   
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
                                            application: process.toLowerCase(),
                                            panel: filename.split('_')[0],
                                            run : functions.getProcessDateTime(filename).replace(/-|:|.000Z/g,'').replace(/T/g,'_'),
                                            process_type: functions.getPorthosType(process,filename),
                                            date : functions.getProcessDateTime(filename),
                                            filename : filename, 
                                            data : functions.getProcessJSON(process, Buffer.concat(chunks).toString('utf8'), filename)  
                                        }
                                    });  
                                });  
                            }
                        })  
                    } else { 
                        date = functions.getProcessDateTime(filename).replace(/-|:|.000Z/g,'').replace(/T/g,'_').split('_')[0];
                        //this means it has been archived so we need to "dig deeper" for the files :) : 
                        readFTP.cwd( functions.getProtPath(process,isoCode)+'/archive', (error)=> {  
                            if (error) {    
                                console.log(`Error when changing the path on the ftp server: ${error}`);
                                res.status(400).send({ api_error: true, message: `Error when changing the path on the ftp server: ${error}` }); 
                            } else {
                                readFTP.list((error, list)=> {  
                                    if (error) {    
                                        console.log(`Error when getting the list of files: ${error}`);
                                        res.status(400).send({ api_error: true, message: `Error when getting the list of files: ${error}` }); 
                                    } else {
                                        list = list.filter(k => k.name.indexOf(date)!=-1 ); 
                                        if  (list.length > 0) {
                                            // we download the archive since we cannot parse from archives   
                                            readFTP.get( functions.getProtPath(process,isoCode)+'/archive/'+ list[0].name , (error, stream) => { 
                                                if (error) {
                                                    console.log(`Error when downloading the archive file locally: ${error}`);
                                                    res.status(400).send({ api_error: true, message: `Error when downloading the archive file locally: ${error}` }); 
                                                }
                                                stream.once('close', ()=> { readFTP.end(); }); 
                                                stream.pipe(fs.createWriteStream('./downloads/'+list[0].name));
                                                stream.on('finish', () => {   
                                                    // the async unzip function
                                                    async function unzip(path){
                                                        return await new Promise((resolve, reject) => { 
                                                            targz.decompress({
                                                                src: path,
                                                                dest: path.split('.')[1]
                                                            }, (error) => {
                                                                if(error) {
                                                                    console.log(`Error when extracting the .tar.gz archive locally: ${error}`); 
                                                                    reject(`Error when extracting the .tar.gz archive locally: ${error}`); 
                                                                } else { 
                                                                    console.log(`Decompressed locally succesfully : ${path.split('.')[1]}`);
                                                                    resolve(path.split('.')[1]);
                                                                }
                                                            })
                                                        });
                                                    };  
                                                    // getting (async) the files from the unzipped path  
                                                    async function getProcessDetails(path) {  
                                                        return await new Promise((resolve, reject) => {
                                                            try {   
                                                                fs.readFile(path+'/'+filename, {encoding: 'utf-8'}, (error,data)=>{
                                                                    if (error) {    
                                                                        console.log(`Error when reading the local downloaded file : ${filename} : ${error}`); 
                                                                        res.status(400).send({ api_error: true, message: `Error when reading the local downloaded file : ${filename} : ${error}` }); 
                                                                    } else {      
                                                                        resolve({  
                                                                                api_error: false, 
                                                                                message: `The LogData for the ${isoCode} ${process} file '${filename}' is:`,
                                                                                process: {
                                                                                    country: isoCode,
                                                                                    application: process,
                                                                                    panel: filename.split('_')[0], 
                                                                                    run : functions.getProcessDateTime(filename).replace(/-|:|.000Z/g,'').replace(/T/g,'_'),
                                                                                    process_type: functions.getPorthosType(process,filename),
                                                                                    date : functions.getProcessDateTime(filename),
                                                                                    filename : filename,  
                                                                                    data : functions.getProcessJSON(process,data,filename)  
                                                                                }
                                                                        })      
                                                                    }
                                                                });     
                                                            } catch (error) {
                                                                console.log(`Error when getting the names of the files via sync function 'getProcessDetails': ${error}`);
                                                                reject(`Error when getting the names of the files via sync function 'getProcessDetails: ${error}`);
                                                                throw res.status(400).send({ api_error: true, message: `Error when getting the names of the files via sync function 'getProcessDetails': ${error}` });  
                                                            } 
                                                        });
                                                    };   
                                                    // cleaning up the downloads folder where we downloaded , unzipped and processed the files 
                                                    async function clean_up(path2clean) {
                                                        return await new Promise((resolve, reject) => {
                                                            fs.readdir(path2clean, (err, files) => {     
                                                                if (err) throw err; 
                                                                for (const file of files) { 
                                                                    fs.unlink(path.join(path2clean, file), err => { 
                                                                        if (err) {
                                                                            reject(error)
                                                                            throw err;
                                                                        } else {
                                                                            resolve(`Deleted locally succesfully : ${path2clean}`)
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        });
                                                    };   
                                                    // the process in order : unzipp the downloaded files , work with them to get the res json to display, then delete the downloaded fiels
                                                    unzip('./downloads/'+list[0].name).then((path)=>{
                                                        getProcessDetails(path).then((result)=>{ 
                                                            res.status(200).json(result);
                                                            clean_up('./downloads/').then((response)=>{
                                                                console.log(response);
                                                            }); 
                                                        });    
                                                    });  
                                                });
                                            });
                                        } 
                                    }
                                }); 
                            }
                        });  // readFTP.cwd( functions.getProtPath(process,isoCode)+'/archive', (error)=> {  
                    } // if ( filtered.length > 0 ) { 
                }); //readFTP.list((error, list)=> {  
            } // if (error) {   
        }); // readFTP.cwd( functions.getProtPath(process,isoCode), (error)=> {  
    }); // readFTP.on('ready', ()=> { 
    readFTP.connect(db.ftpConnection(isoCode));   
});

router.get('*', (req, res)=> {  
    res.sendFile(path.join(__dirname + '/index.html'));
});

module.exports = router;