const express = require('express');
const router = express.Router();
const fs = require('fs');   
const path = require('path');
const settings = require('../../settings.js');   
var functions = require('../../functions.js');   
var client = require('ftp');  
const axios = require('axios');  
const https = require('https');  
var zlib = require('zlib'); 
var tarstream = require('tar-stream');  
var targz = require('targz');   
const unzip = require('unzip');
const unzip_stream = require('unzip-stream');
const decompress = require('decompress');
const unzipper = require('unzipper');
var stream = require('stream');

router.use('/', express.static('html'));

//READING DIRECTLY FROM THE MOUNTED DRIVES:

router.get('/getLogFilesList/:isoCode/:process', (req, res)=>{   
    let isoCode = req.params.isoCode;
    let process = req.params.process; 
    if ((!isoCode) || isoCode.match(/^[a-zA-Z][a-zA-Z]$/g)!=isoCode ) {
        return res.status(400).send({ api_error: true, message: 'Please provide a valid country isoCode!' }); 
    };  
    if ((!process) || ['porthos','aramis','datatrans','rc'].indexOf(process.toLowerCase())==-1 ) { 
        return res.status(400).send({ api_error: true, message: 'Please provide a valid process name!' }); 
    };  
    let protocol_path = "./" + settings.getProtocolDetails(isoCode).dbsettings.host + settings.getProtocolDetails(isoCode).processes.filter(k => k.process.toLowerCase() == process.toLowerCase() )[0].protocol_path 

    let currentDirPath = path.join(__dirname, protocol_path);
    function getFileList(currentDirPath) {
        var files =[];
        fs.readdirSync(currentDirPath).forEach((file)=> {  
            var filePath = path.join(currentDirPath,"/", file);
            var stats = fs.statSync(filePath);
            files.push({
                type: (stats.isDirectory() ? 'd' : 'f'),  
                name: file,  
                size: stats['size'],
                date: functions.getProcessDateTime(file), 
                path: protocol_path
            }); 
        })    
        files = files.filter(k => k.type != 'd'); //all files NOT folders 
        files = files.sort( (a, b)=> { return new Date(a.date).getTime() - new Date(b.date).getTime(); }).reverse(); //sorting files descending based on date 
        files = files.filter(k => settings.getProtocolDetails(isoCode).runs.some(m => m.test(k['name'])) );  //filtering out to have only relevant protocol files ( no GDPR stuff )
        if (process.toLowerCase()=='datatrans') { 
            files = files.filter(k => k.date.indexOf(new Date(Date.now() - 864e5).toISOString().substring(0,10)) == 0 );  //since datatrans runs 1 day behind we might need to grab the previous day one 
        } else {
            files = files.filter(k => k.date.indexOf(new Date().toISOString().substring(0,10)) == 0 ); //only take the curent day's files not older files.  
        }  
        return files;
    } 
    res.status(200).json({
        api_error: false, 
        message: `The last Log files list for the  ${isoCode} ${process} process is:`, 
        files: getFileList(currentDirPath)
    });   
});
 
router.get('/getLogFilesList/:isoCode/:process/:date', (req, res)=>{  
    let isoCode = req.params.isoCode;
    let process = req.params.process;
    let date = req.params.date; 
    if ((!isoCode) || isoCode.match(/^[a-zA-Z][a-zA-Z]$/g)!=isoCode ) {
         return res.status(400).send({ api_error: true, message: 'Please provide a valid country isoCode!' }); a
    };  
    if ((!process) || ['porthos','aramis','datatrans','rc'].indexOf(process.toLowerCase())==-1 ) 
        { return res.status(400).send({ api_error: true, message: 'Please provide a valid process name!' }); 
    }; 
    if ((!date) || date.match(/([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))/g)!=date ) {   
        return res.status(400).send({ api_error: true, message: 'Please provide a valid date!' }); 
    };     
    let protocol_path = "./" + settings.getProtocolDetails(isoCode).dbsettings.host + settings.getProtocolDetails(isoCode).processes.filter(k => k.process.toLowerCase() == process.toLowerCase() )[0].protocol_path 
    
    let currentDirPath = path.join(__dirname, protocol_path);
    function getFileList(currentDirPath, filelist) {
        filelist = filelist || [];
        fs.readdirSync(currentDirPath).forEach((file)=> {  
            var filePath = path.join(currentDirPath,"/", file);
            var stats = fs.statSync(filePath);
            if (stats.isDirectory()){
                getFileList(filePath, filelist);
            } else { 
                filelist.push(filePath);
            }  
        })    
        return filelist; 
    } 
    // only take the file that we are interested from the list above: 
    var filtered =  getFileList(currentDirPath).filter(k => k.indexOf(date)!=-1);   
    var result = [];
    if ( filtered.filter(k =>  (k.indexOf('archive')!=-1 || k.indexOf('.tar')!=-1 || k.indexOf('.gz')!=-1)).length==0 ) {   
        //if the file is NOT archived:  
        result = filtered.map(k => { return {
            type: 'f',  
            name: k.split('\\').slice(-1)[0],  
            size: fs.statSync(k)['size'],
            date: functions.getProcessDateTime(k.split('\\').slice(-1)[0]), 
            path: k.split('readFromFTP')[1]
        }})
        .sort( (a, b)=> { return new Date(a.date).getTime() - new Date(b.date).getTime(); }).reverse()  //sorting files descending based on date 
        .filter(k => settings.getProtocolDetails(isoCode).runs.some(m => m.test(k['name'])) );  //filtering out to have only relevant protocol files ( no GDPR stuff )
        res.status(200).json({
            api_error: false,  
            message: `The Log files list for the  ${isoCode} ${process} process from ${date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8)} are:`, 
            files: result
        });  

    //if the file is archived .tar.gz:  
    } else if ( filtered.filter(k =>  (k.indexOf('.tar')!=-1 && k.indexOf('.gz')!=-1)).length>0 ) {   
        var extract = gunzip.extract(); 
        extract.on('entry', (header, stream, cb) => { 
            result.push({
                type: 'f',   
                name: header.name,  
                // size: fs.statSync(header.name)['size'],
                date: functions.getProcessDateTime(header.name), 
                path: filtered[0].split('readFromFTP')[1]
            }); 
            stream.on('end', () => {
                cb();
            }); 
            stream.resume();
        }); 
        extract.on('finish', () => { 
            res.status(200).json({
                api_error: false,  
                message: `The Log files list for the  ${isoCode} ${process} process from ${date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8)} are:`, 
                files: result.sort( (a, b)=> { return new Date(a.date).getTime() - new Date(b.date).getTime(); }).reverse()  //sorting files descending based on date 
                            .filter(k => settings.getProtocolDetails(isoCode).runs.some(m => m.test(k['name'])) )  //filtering out to have only relevant protocol files ( no GDPR stuff )
            });    
        }); 
        fs.createReadStream(filtered[0])
        .pipe(zlib.createGunzip())
        .pipe(extract);   

    //if the file is archived .gz:  
    }  else if ( filtered.filter(k => (k.indexOf('.gz')!=-1)).length>0 ) {    

        // fs.createReadStream(filtered[0])
        // .pipe(zlib.createGunzip())
        // .on('data', (header, stream, cb) => { 
        //     console.log(header);
        //     console.log(stream);
        //     result.push({
        //         type: 'f',   
        //         name: header.name,   
        //         // date: functions.getProcessDateTime(header.name), 
        //         path: filtered[0].split('readFromFTP')[1]
        //     }); 
        //     stream.on('end', () => {
        //         cb();
        //     }); 
        //     stream.resume();
        // })
        // .on('finish', () => {  
        //     res.status(200).json({
        //         api_error: false,  
        //         message: `The Log files list for the  ${isoCode} ${process} process from ${date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8)} are:`, 
        //         files: result
        //     });    
        // }); 

        // fs.createReadStream(filtered[0])
        // .pipe(unzip_stream.Parse())
        // .on('entry', (entry) => {   
        //     var fileName = entry.path;
        //     var type = entry.type; // 'Directory' or 'File'
        //     var size = entry.size; 
        //     console.log(fileName);
        //     // if (fileName === "this IS the file I'm looking for") {
        //     //     entry.pipe(fs.createWriteStream('output/path'));
        //     // } else {
        //     //     entry.autodrain();
        //     // }
        // });
        

    }
});

router.get('/getLog/:isoCode/:process/:filename', (req, res)=>{  
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
    let protocol_path = "./" + settings.getProtocolDetails(isoCode).dbsettings.host + settings.getProtocolDetails(isoCode).processes.filter(k => k.process.toLowerCase() == process.toLowerCase() )[0].protocol_path 
    
    let currentDirPath = path.join(__dirname, protocol_path); 
    function getFileList(currentDirPath, filelist) {
        filelist = filelist || [];
        fs.readdirSync(currentDirPath).forEach((file)=> {  
            let filePath = path.join(currentDirPath,"/", file);
            let stats = fs.statSync(filePath);
            if (stats.isDirectory()){
                getFileList(filePath, filelist);
            } else { 
                filelist.push(filePath);
            }  
        })    
        return filelist; 
    } 

    // if the file is locally then the path is local path, if the file is archived then the path to the archive is stated ( for the extraction process):
    var file_path = "" 
    file_path = (getFileList(currentDirPath).filter(k => k.indexOf(filename)!=-1).length>0)  ?  getFileList(currentDirPath).filter(k => k.indexOf(filename)!=-1)[0] : getFileList(currentDirPath).filter(k => k.indexOf( functions.getProcessDateTime(filename).split('T')[0].replace(/-/g,'') )!=-1)[0];  

    if (file_path.indexOf('archive')!=-1 || file_path.indexOf('.tar')!=-1 || file_path.indexOf('.gz')!=-1 ) {    
        //if the file is archived:  
        var data = "";
        var extract = tarstream.extract(); 
        extract.on('entry', (header, stream, cb) => {  
            stream.on('data', (chunk) => {
            if (header.name == filename)
                data += chunk;
            }); 
            stream.on('end', () => {
                cb();
            }); 
            stream.resume();
        }); 
        extract.on('finish', () => { 
            res.status(200).json({
                api_error: false,  
                message: `The content of the Log file ${filename} for the ${isoCode} ${process} process is:`, 
                file: data
            });    
        }); 
        fs.createReadStream( file_path )
            .pipe(zlib.createGunzip())
            .pipe(extract);     
    } else {  
        //if the file is NOT archived:
        if (!fs.existsSync(file_path)) {
            console.log(`Error when reading the local file : ${file_path} : ${error}`); 
            res.status(400).send({ api_error: true, message: `Error when reading the local file : ${file_path} : ${error}` }); 
        } else {  
            res.status(200).json({
                api_error: false,  
                message: `The content of the Log file ${filename} for the ${isoCode} ${process} process is:`, 
                file: fs.readFileSync(file_path, 'utf-8') 
            });  
        } 
    };  
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
 
    axios.get('https://localhost:1001/getLog/'+ isoCode +'/'+ process +'/'+ filename, { httpsAgent: new https.Agent({ rejectUnauthorized: false })} ) 
    .then((response) => {   
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
                data : functions.getProcessJSON(process, response.data.file, filename)  
            }
        });  
    }) 
    .catch((error) => {
        console.log(`Error when calling the 'getLog' from readFromFTP microservice : ${error}`);
        throw res.status(400).send({ api_error: true, message: `Error when calling the 'getLog' from readFromFTP microservice: ${error}` }); 
    }); 
}); 

 
//READING FROM FTP:

router.get('/getLogFilesList_ftp/:isoCode/:process', (req, res)=>{   
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
                   
                        // filtering out to have only relevant protocol files 
                        files = files.filter(k => settings.getProtocolDetails(isoCode).runs.some(m => m.test(k['name'])) );   

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
    readFTP.connect(settings.getProtocolDetails(isoCode).dbsettings);    
});

router.get('/getLogFilesList_ftp/:isoCode/:process/:date', (req, res)=>{  
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
                    // filtering out to have only relevant protocol files 
                    list = list.filter(k => settings.getProtocolDetails(isoCode).runs.some(m => m.test(k['name'])) );   
                    // filtering based on the date from the api request
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
    readFTP.connect(settings.getProtocolDetails(isoCode).dbsettings);    
});
 
router.get('/getLogData_ftp/:isoCode/:process/:filename', (req, res)=>{  
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
                                                stream.pipe(fs.createWriteStream( path.join(__dirname, './../../downloads/') + list[0].name));
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
                                                    unzip( path.join(__dirname, './../../downloads/') +list[0].name ).then((finalpath)=>{
                                                        getProcessDetails(finalpath).then((result)=>{ 
                                                            res.status(200).json(result);
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
                        });  // readFTP.cwd( functions.getProtPath(process,isoCode)+'/archive', (error)=> {  
                    } // if ( filtered.length > 0 ) { 
                }); //readFTP.list((error, list)=> {  
            } // if (error) {   
        }); // readFTP.cwd( functions.getProtPath(process,isoCode), (error)=> {  
    }); // readFTP.on('ready', ()=> { 
    readFTP.connect(settings.getProtocolDetails(isoCode).dbsettings);       
});


router.get('*', (req, res)=> {  
    res.sendFile(path.join(__dirname + '/index.html'));
});

module.exports = router;