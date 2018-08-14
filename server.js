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
app.get('/', function(req, res) {
    console.log('Return succesfull for route: ', req.path );
    res.json({ message: 'Hello! Welcome to our REST API!' });  
});

//de investigat  https://github.com/paulmillr/chokidar 

app.get('/getProtocol/:process/:isoCode', function(req, res){  
    let isoCode = req.params.isoCode;
    let process = req.params.process;
    if (!isoCode) { return res.status(400).send({ error: true, message: 'Please provide a country isoCode!' }); }  
    if (!process) { return res.status(400).send({ error: true, message: 'Please provide a process name!' }); }  
    var readFTP = new Client();
    //on connected to ftp event :
    readFTP.on('ready', function() { 
        //changing the file to the specific protocol path:
        readFTP.cwd( processing.getProtPath(process,isoCode), function(error) {
            if (error) throw error;  
            readFTP.list(function(error, list) {
                //reading the files from the desired path and structuring them in a json
                if (error) throw error; 
                var files = list.map(function(k){ return { type: k['type'], name: k['name'], size: k['size'], date: k['date'] }  });  
                    //downloading the specific files from the list above:
                    readFTP.get( processing.getProtPath(process,isoCode)+ 'ScanPlus_dataro_20180814_062047.log', function(error, stream) { 
                        if (error) {  
                            console.log(error);
                            throw res.status(400).send({ error: true, message: error }); 
                        } else {    
                            stream.pipe(fs.createWriteStream(currentPath+'\\downloads\\'+'ScanPlus_dataro_20180814_062047.log'));
                            stream.once('close', function() {    
                                readFTP.end(); 

                                return res.send({ 
                                    error: false,  
                                    // data: processing.interpretProtocol(), 
                                    files : files,
                                    message: 'Details for the country with the ' + isoCode + ' isoCode.' 
                                });
                            }); 
                        }
                    }); 

                readFTP.end(); 
            });
            readFTP.end(); 
        });
 

       
    }); 
    readFTP.connect(db); 
});









// port must be set to 8080 because incoming http requests are routed from port 80 to port 8080
var server = app.listen(8080, function () { 
    var host = server.address().address;
    var port = server.address().port; 
    console.log("Node Application is listening at http://%s:%s", host, port);
}); 
 
module.exports = app;



 
 