function getProtPath(process,country) {
    var path;  
    switch (process.toLowerCase()) {
        case "porthos":
            switch (country.toLowerCase()) {
                case "cz":
                    path='/move/datacs/porthos_cz/protocol/';
                    break;
                case "sk":
                    path='/move/datacs/porthos_sk/protocol/';
                    break;
                default:
                    path='/move/data{country}/porthos/protocol/'; 
            };
            break;
        case "aramis":
            switch (country.toLowerCase()) {
                case "cz":
                    path='/move/datacs/aramis_cz/protocol/';
                    break;
                case "sk":
                    path='/move/datacs/aramis_sk/protocol/';
                    break;
                default:
                    path='/move/data{country}/aramis/protocol/'; 
            }; 
            break;
        case "datatrans":
            switch (country.toLowerCase()) {
                case "cz":
                    path='/var/atrlogs/atrcs/datatrans_cz/';   
                    break;
                case "sk":
                    path='/var/atrlogs/atrcs/datatrans_sk/';    
                    break;
                default:
                    path='/var/atrlogs/atr{country}/datatrans/';       // /var/atrlogs/atr{country}/datatrans/        // /move/data{country}/datatrans/protocol/
            }; 
            break; 
        case "rc":
            switch (country.toLowerCase()) {
                case "cz":
                    path='/move/datacs/rc_cz/protocol/';
                    break;
                case "sk":
                    path='/move/datacs/rc_sk/protocol/';
                    break;
                default:
                    path='/move/data{country}/rc/protocol/'; 
            };  
            break; 
    } 
    return path.replace('{country}',country.toLowerCase()) 
};
  



// splits a string by _ and searches for all the splited strings of the format YYYYmmDD folowed by a string of format HHmmSS and combines them into a date of format 2018-07-19T05:39:00(for example)
function getProcessDateTime(string) {  
    var array = string.split('_');   
    var date = '';
    var time = '';
    for (let [index, str] of array.entries() ) {  
        if (str.match(/([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))/g)) {
                date += (array[index].substr(0,4) +'-'+ array[index].substr(4,2) +'-'+ array[index].substr(6,2)); 
            if( array[index+1].match(/(([0-1]?[0-9])|(2[0-3]))[0-5][0-9][0-5][0-9]/g) ) {    
                    time += (array[index+1].substr(0,2) +':'+ array[index+1].substr(2,2) +':'+ array[index+1].substr(4,2));
            }; 
        };
    };
    date = (date.length > 0 ? date : '1900-01-01');
    time = (time.length > 0 ? time : '00:00:00');
    return (date+'T'+time+'.000Z');
};

// returns an array of string dates between two given dates , for example : startDate='20180928' , endDate='20180930', dateArray='20180928,20180929,20180930'
function getArrayofDates(startDate, endDate, RegEX) { 
    var start = (startDate.substr(0,4) +'-'+ startDate.substr(4,2) +'-'+startDate.substr(6,2)); 
    var end = (endDate.substr(0,4) +'-'+ endDate.substr(4,2) +'-'+endDate.substr(6,2)); 
    var dateArray = new Array();
    var currentDate = new Date(start);
    while (currentDate <= new Date(end)) {
        dateArray.push( currentDate.toISOString().replace(/-|:|.000Z/g,'').replace(/T/g,'_').split('_')[0] );
        currentDate = new Date((currentDate.getTime() + 864e5 )) 
    }
    if(typeof RegEX !== "undefined") {
        return dateArray.map((k)=> { return new RegExp(k) });  //new RegExp('^'+date+'', "i")}
    } else {
        return dateArray;
    } 
}

// returns the element with the highest occurences from an array or elements (example: for [1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0, 0] the answer is 1)
function getmostOccurances(array) { 
    var result = array.sort((a,b) =>
        array.filter(v => v===a).length
        - array.filter(v => v===b).length
    ).pop();
    return result;
}; 

function getProcessRunName(string) { 
    var array = string.substring(string.split('_')[0].length+1, string.length).split('_')  //removing pannel name
    var result = "";
    for (let [index, str] of array.entries() ) {   
        result += (index>0 ? (isNaN(parseInt(str)) ? "_"+str : "") : (isNaN(parseInt(str)) ? str :  "") )    //if the pannel name contains _ than we take that into consideration
    }
    return result;
};
 
// return the porthos type based on the name of the log file : 
function getPorthosType(process,string) {  
    // removing the ".log" that comes at the end :
    var array = string.split(".")[0];
    // removing pannel name , which always comes first
    array = array.substring(array.split('_')[0].length+1, array.length).split('_')  
    // the rest of the string should contain the panel type and the date and time all separated by "_" , 
    // so we eliminate the date+time and what remains needs to be te pannel type, if nothing remains thant we consider it "export" type
    var result = "";
    for (let [index, str] of array.entries()) {   
        if (isNaN(parseInt(str))) {
            result = result + str + "_";
        }
    }
    if (process=="porthos") { // only porthos has this feature, it;s missing for the other processes
        return (result=="" ? "export" : result.substring(0,result.length-1)  ); //removing the _ at the end.
    } else {
        return "missing";
    }
};  

function getProcessJSON(process,data,filename) { 
    switch (process.toLowerCase()) {
        case "porthos": 
            return getPorthosJSON(data,filename); 
        case "aramis":
            return getAramisJSON(data,filename); 
        case "datatrans":
            return getDatatransJSON(data,filename); 
        case "rc":
            return getRCJSON(data,filename); 
    }  
};
  
function getPorthosJSON(data,filename) {     
    try {
        var convert = require('xml-js');
        var Json_string = convert.xml2json(data, {compact: true, spaces: 4});   
        const dataflow = JSON.parse(Json_string)['protocol'].general.dataflow['_text']; 
        const starttime = JSON.parse(Json_string)['protocol'].general.start['_text']; 
        const endtime = JSON.parse(Json_string)['protocol'].summary.end['_text'];
        const input_count = JSON.parse(Json_string)['protocol'].statistics.input_count['_text'];
        const output_count = JSON.parse(Json_string)['protocol'].statistics.output_count['_text']; 

        // when mapping we remove unnecesary text like "  (description ..etc..." from the text of the information/error/warning:
        var messages =  JSON.parse(Json_string)['protocol'].messages.message.map((k)=>{ 
            return { 
                type: k['_attributes'].type, 
                text: ( k['text']._text.indexOf('  (description ')!=-1 ?  k['text']._text.split('  (description ')[0] :  k['text']._text )
            }
        });   

        //removing messages like : '8 file(s) ready for processing.' or 'Process 1/8...etc'
        messages = messages.filter(k => (k.text.indexOf('file(s) ready for processing.')==-1 && k.text.substring(0,8)!='Process ') );

        //calculating total nr of information, warnings and errors :
        const nr_informations =  messages.filter(k => k.type === 'Information').length ;
        const nr_warnings =  messages.filter(k => k.type === 'Warning').length ;   
        const nr_errors = messages.filter(k => k.type === 'Error').length ;  

        // grouping up errors and counting them by the text of the error
        const unique = [...new Set(messages.map(k => k.text))]; 
        const inf_warn_err = unique.map((k)=>{ 
            return {text: k, 
                    type: messages.filter(j => j.text === k)[0].type,
                    nr: (messages.reduce(function (n, mess) { return n + (mess.text == k); }, 0)) 
            } 
        });  

        var result = JSON.stringify({ 
            dataflow: dataflow, 
            starttime: starttime.replace('T',' ').substring(0,starttime.length-2),
            endtime: endtime.replace('T',' ').substring(0,starttime.length-2),
            input_count: input_count,
            output_count: output_count,
            nr_informations: nr_informations,
            nr_warnings: nr_warnings,
            nr_errors: nr_errors,
            inf_warn_err: inf_warn_err   
        }) 
        return JSON.parse(result);  
    } catch(error) {  
        console.log(`Error when converting and processing ${filename} to JSON : ${error}`);
        return JSON.parse( JSON.stringify( { error: true, message: `Error when converting and processing ${filename} to JSON : ${error}` } ) ); 
    }  
};

function getAramisJSON(data) {   
    try {
        let lines = data.split('\n'); 
        for (let [index, line] of lines.entries() ) {      
            if (line.indexOf('input file:  ')==0) {
                let len = line.split('/').length; 
            };
            if (line.indexOf('starting ARaMIS')==0) {
                let len = line.split(' ').length;
                var starttime = line.split(' ')[len-2] + 'T' + line.split(' ')[len-1] + '+2';
            };
            if (line.indexOf('finished at: ')==0) {
                let len = line.split(' ').length;
                var endtime = line.split(' ')[len-2] + 'T' + line.split(' ')[len-1] + '+2';
            };
            if (line.indexOf('DBUser:')==0) { var dbUser = line.split(':')[1].trim(); }; 
            if (line.indexOf('DBServer:')==0) { var dbServer = line.split(':')[1].trim(); }; 
            if (line.indexOf('DB:')==0) { var db = line.split(':')[1].trim(); };   
            if (line.indexOf('Errors:')==0) { var nr_errors = parseInt(line.split(':')[1]); }; 
            if (line.indexOf('Warnings:')==0) { var nr_warnings = parseInt(line.split(':')[1]); }; 
            if (line.indexOf('Purchacts total:')==0) { var purchacts_total = parseInt(line.split(':')[1]); }; 
            if (line.indexOf('Articles total:')==0) { var articles_total = parseInt(line.split(':')[1]); }; 
            if (line.indexOf('Number of processed purchacts:')==0) { var nr_processed_purchacts = parseInt(line.split(':')[1]); }; 
            if (line.indexOf('Number of processed movement records:')==0) { var nr_processed_movement_records = parseInt(line.split(':')[1]); }; 
            if (line.indexOf('Records processed:')==0) { var records_processed = parseInt(line.split(':')[1]); }; 
            if (line.indexOf('Number of faulty purchacts:')==0) { var nr_faulty_purchacts = parseInt(line.split(':')[1]); }; 
            if (line.indexOf('Number of faulty movement records:')==0) { var nr_faulty_movement_records = parseInt(line.split(':')[1]); }; 

            if (line.indexOf('ERROR BEGIN')==0) { var ERROR_BEGIN_index = index; }; 
            if (line.indexOf('ERROR END')==0) { var ERROR_END_index = index; }; 
            if (line.indexOf('WARNING BEGIN')==0) { var WARNING_BEGIN_index = index; }; 
            if (line.indexOf('WARNING END')==0) { var WARNING_END_index = index; };
            if (line.indexOf('INFO BEGIN')==0) { var INFO_BEGIN_index = index; }; 
            if (line.indexOf('INFO END')==0) { var INFO_END_index = index; };  
        }
        var ERROR=[];
        var WARNING=[];
        var INFO=[];
        for (let [index, line] of lines.entries() ) {      
            let lines = data.split('\n'); 
            if (index >= ERROR_BEGIN_index && index <= ERROR_END_index && lines[index].length>0 ) { ERROR.push(lines[index]) }; 
            if (index >= WARNING_BEGIN_index && index <= WARNING_END_index && lines[index].length>0 ) { WARNING.push(lines[index]) };  
            if (index >= INFO_BEGIN_index && index <= INFO_END_index && lines[index].length>0 ) { INFO.push(lines[index]) }; 
        }
        var inf_warn_err=[]; 

        // ERRORS //
        if (ERROR.length>2) { // if this array contains more than 2 lines "ERROR BEGIN" and "ERROR END"   
            //mapping the positions where we need to push a '\n' in our array to separate the grooups of erros
            var index_array=[];
            for (let [index, line] of ERROR.entries() ) {     
                if (index>0 && index<ERROR.length-1) {   
                    if (line.match(/^\b(?!Line|\d)\b.+/g)) {   
                        index_array.push(index);  
                    }
                }
            }  
            //pushing the '\n' elements in the ERROR array on the certain positions before the error text to group them up easily if we split 
            for (let [index, value] of index_array.entries() ) {
                ERROR.splice(value+index, 0, '\n');
            }
            //removing the first and last elements of the ERROR array they are useless. 
            ERROR.splice(0, 1);
            ERROR.splice(ERROR.length-1, 1); 
            //splitting the ERROR array by element '\n' into and array of arrays.
            const ERRORs_array = [];  
            ERROR.forEach(item => item === '\n' ?
                ERRORs_array.push(['ERROR:']) :
                ERRORs_array[ERRORs_array.length - 1].push(item)
            ); 
            //constructing our json and attaching it to the output :  
            for (let errorgroup of ERRORs_array) { 
                var errorgroup_arr =  ERRORs_array[ERRORs_array.indexOf(errorgroup)]; 
                var header = errorgroup[2].split('\t');  
                var details_array=[];
                for (let value of errorgroup_arr ) {       
                    if ( errorgroup_arr.indexOf(value)>2 ) {   //ignoring the first 2 values since they are 'ERROR' and '[the error text]'  
                        var details = {};
                        for (let [i, val] of value.split('\t').entries() ) {     
                            let atribute = header[i];  
                            details[atribute] = val;
                        } 
                        details_array.push(details)
                    } 
                }
                inf_warn_err.push({ 
                    text: errorgroup[1], 
                    type: "Error",
                    nr: errorgroup.length-3,   
                    details: details_array
                });
            }  
        }

        // WARNINGS //
        if (WARNING.length>2) { // if this array contains more than 2 lines "WARNING BEGIN" and "WARNING END"   
            //mapping the positions where we need to push a '\n' in our array to separate the grooups of erros
            var index_array=[];
            for (let [index, line] of WARNING.entries() ) {     
                if (index>0 && index<WARNING.length-1) {   
                    if (line.match(/^\b(?!Line|\d)\b.+/g)) {   
                        index_array.push(index);  
                    }
                }
            }  
            //pushing the '\n' elements in the WARNING array on the certain positions before the WARNING text to group them up easily if we split 
            for (let [index, value] of index_array.entries() ) {
                WARNING.splice(value+index, 0, '\n');
            }
            //removing the first and last elements of the WARNING array they are useless. 
            WARNING.splice(0, 1);
            WARNING.splice(WARNING.length-1, 1); 
            //splitting the WARNING array by element '\n' into and array of arrays.
            const WARNINGs_array = [];  
            WARNING.forEach(item => item === '\n' ?
                WARNINGs_array.push(['WARNING:']) :
                WARNINGs_array[WARNINGs_array.length - 1].push(item)
            ); 
            //constructing our json and attaching it to the output :  
            for (let WARNINGgroup of WARNINGs_array) { 
                var WARNINGgroup_arr =  WARNINGs_array[WARNINGs_array.indexOf(WARNINGgroup)]; 
                var header = WARNINGgroup[2].split('\t');  
                var details_array=[];
                for (let value of WARNINGgroup_arr ) {       
                    if ( WARNINGgroup_arr.indexOf(value)>2 ) {   //ignoring the first 2 values since they are 'WARNING' and '[the WARNING text]'  
                        var details = {};
                        for (let [i, val] of value.split('\t').entries() ) {     
                            let atribute = header[i];  
                            details[atribute] = val;
                        } 
                        details_array.push(details)
                    } 
                }
                inf_warn_err.push({ 
                    text: WARNINGgroup[1], 
                    type: "Warning",
                    nr: WARNINGgroup.length-3,  
                    details: details_array 
                }); 
            }  
        }
      
        var result = JSON.stringify({  
            starttime: starttime.replace('T',' ').substring(0,starttime.length-2), 
            endtime: endtime.replace('T',' ').substring(0,starttime.length-2), 
            db: db,
            dbUser: dbUser,
            dbServer: dbServer,
            nr_errors: nr_errors,
            nr_warnings: nr_warnings,
            inf_warn_err: inf_warn_err, 
            purchacts_total: purchacts_total,
            articles_total: articles_total,
            nr_processed_purchacts: nr_processed_purchacts,
            nr_processed_movement_records: nr_processed_movement_records,
            records_processed: records_processed,
            nr_faulty_purchacts: nr_faulty_purchacts,
            nr_faulty_movement_records: nr_faulty_movement_records 
        })
        return JSON.parse(result); 
    } catch (error) {  
        console.log(`Error when converting and processing ${filename} to JSON : ${error}`);
        return JSON.parse( JSON.stringify( { error: true, message: `Error when converting and processing ${filename} to JSON : ${error}` } ) ); 
    }   
};

function getDatatransJSON(data) {     
    try {
        let lines = data.split('\n'); 
        var ERROR=[];
        for (let [index, line] of lines.entries() ) {    
            if (line.indexOf('** error: ')==0) { 
                ERROR.push(line)
            }  
            if (line.indexOf('New articles were created for the following keys:')==0) { var START_new_art_created_index = index; } 
            if (line.indexOf('finished file: ')==0) { var END_new_art_created_index = index; } 
            if (line.indexOf('processing file: ')==0) { var filename = line.split('processing file: ')[1]; } 
        }
        var new_art_created=[]; 
        for (let [index, line] of lines.entries() ) {      
            let lines = data.split('\n'); 
            if (index-1 > START_new_art_created_index && index < END_new_art_created_index && lines[index].length>0 ) { new_art_created.push(lines[index]) };  
        }  
        var new_art_created_pre = new_art_created.map((k)=>{ return { article: k.split(' ')[0], date: k.split(' ')[1] }} ); 
        var ERROR_pre = ERROR.map((k)=>{ 
            return { 
                text : k.split('.xml: ')[1].split('\'')[0].replace(':','').trim(),  
                line : k.split(' ')[3].replace(',',''), 
                article: k.split('.xml: ')[1].split('\'')[1]
            }} 
        );
        
        //ERROR_details:    ( grouped up by error type text and counted also) 
        const ERROR_details = [...new Set(ERROR_pre.map(k => k.text))]
            .map((k)=>{ 
                    return {
                        text: k,  
                        type: "Error",  
                        nr: (ERROR_pre.reduce(function (n, mess) { return n + (mess.text== k); }, 0)), 
                        details: ERROR_pre.filter(j => j.text === k).map((l)=>{ return { line: l['line'], article: l['article'] }})
                    }}
                ); 

        //new_art_created_details:    ( grouped up by date of creation and counted also)
        const new_art_created_details = [...new Set(new_art_created_pre.map(k => k.date))]
            .map((k)=>{ 
                    return {   
                        date: k,  
                        nr: (new_art_created_pre.reduce(function (n, mess) { return n + (mess.date== k); }, 0)),  
                        articles: new_art_created_pre.filter(j => j.date === k).map((l)=> { return l['article']  }) 
                    }}
                ); 
 
        var result = JSON.stringify({  
            starttime: getProcessDateTime(filename).replace('T',' ').substring(0,getProcessDateTime(filename).length-5),
            endtime: getProcessDateTime(filename).replace('T',' ').substring(0,getProcessDateTime(filename).length-5), 
            nr_errors: ERROR.length,
            inf_warn_err: ERROR_details,
            nr_new_art_created: new_art_created.length, 
            new_art_created_details: new_art_created_details
        })
        return JSON.parse(result); 
    } catch (error) {  
        console.log(`Error when converting and processing ${filename} to JSON : ${error}`);
        return JSON.parse( JSON.stringify( { error: true, message: `Error when converting and processing ${filename} to JSON : ${error}` } ) ); 
    }   
};

function getRCJSON(data) {   
    try {  
        let lines = data.split('\n'); 
        for (let [index, line] of lines.entries() ) {     
            if (line.indexOf('Records loaded: ')==0) { var records_loaded = line.split('Records loaded: ')[1].trim(); } 
            if (line.indexOf('Records failed: ')==0) { var records_failed = line.split('Records failed: ')[1].trim(); } 
            if (line.indexOf('Records total : ')==0) { var records_total = line.split('Records total : ')[1].trim(); } 
            if (line.indexOf('Process started at ')==0) { var starttime = new Date().toISOString().substring(0,10)+ ' ' + line.split('Process started at ')[1].trim(); } 
            if (line.indexOf('Process finished at ')==0) { var endtime = new Date().toISOString().substring(0,10)+ ' ' +  line.split('Process finished at ')[1].trim(); } 
    
            if (line.indexOf('ERRORS:')==0) { var ERROR_BEGIN_index = index+2; }  
            if (line.indexOf('Statistic')==0) { var ERROR_END_index = index-2; }   
        }

        var ERROR=[]; 
        for (let [index, line] of lines.entries() ) {       
            if (index >= ERROR_BEGIN_index && index <= ERROR_END_index && lines[index].length>0) { ERROR.push(lines[index].replace(': ','')) };  
        }
        var inf_warn_err=[]; 
        var nr_errors=0; 
        if (ERROR.length>0) {
            //mapping the positions where we need to push a '\n' in our array to separate the grooups of erros
            var index_array=[];
            for (let [index, line] of ERROR.entries() ) {       
                if (line.match(/^[^\d].*/g)) {   
                    index_array.push(index);  
                } 
            }  
            //pushing the '\n' elements in the ERROR array on the certain positions before the error text to group them up easily if we split 
            for (let [index, value] of index_array.entries() ) {
                ERROR.splice(value+index, 0, '\n');
            }
            //splitting the ERROR array by element '\n' into and array of arrays.
            const ERRORs_array = [];  
            ERROR.forEach(item => item === '\n' ?
                ERRORs_array.push(['ERROR:']) :
                ERRORs_array[ERRORs_array.length - 1].push(item)
            );    
            //constructing our json and attaching it to the output :   
            for (let errorgroup of ERRORs_array) { 
                var errorgroup_arr =  ERRORs_array[ERRORs_array.indexOf(errorgroup)];  
                var details_array=[];
                for (let value of errorgroup_arr ) {       
                    if ( errorgroup_arr.indexOf(value)>=2 ) {   //ignoring the first 2 values since they are 'ERROR' and '[the error text]'   
                        nr_errors++;
                        var details = {
                            household: value.split(' ')[0],
                            panelcode: value.split(' ')[3], 
                            year: value.split(' ')[4],
                            week: value.split(' ')[5],
                            RCvalue: value.split(' ')[6]
                        }; 
                        details_array.push(details)
                    } 
                }
                inf_warn_err.push({ 
                    text: errorgroup[1], 
                    type: "Error",  
                    nr: errorgroup.length-2,  
                    details: details_array 
                });
            }   
        } 
 
        var result = JSON.stringify({  
            starttime: starttime,
            endtime : endtime, 
            nr_errors: nr_errors,
            inf_warn_err: inf_warn_err, 
            records_loaded: records_loaded,
            records_failed: records_failed,
            records_total: records_total 
        })
        return JSON.parse(result); 
    }  catch (error) {  
        console.log(`Error when converting and processing ${filename} to JSON : ${error}`);
        return JSON.parse( JSON.stringify( { error: true, message: `Error when converting and processing ${filename} to JSON : ${error}` } ) ); 
    }   
};
 
function getDataflowJSON_data(data) {   
    try {    
        // mapping individual panels  
        const panels = [...new Set(data.map(k => k.panel))]; 
        var result=[]; 
        var porthos_es=[];
        var aramis_es=[];
        var datatrans_es=[];
        var rc_es=[];  
        // calculating status of the processes ran for each pannel
        for (let [index, panel] of panels.entries() ) {   
            porthos_es =  data.filter(k => (k.panel==panel && k.application=="porthos"))
                            .map(x=> { return {
                                run : x.run,
                                process_type: x.process_type,
                                date: x.date,
                                status: (x.data[0].nr_errors>0) ? "error" :  ((x.data[0].nr_warnings>0) ? "warning" : "ok" )
                            }});
            aramis_es =  data.filter(k => (k.panel==panel && k.application=="aramis"))
                            .map(x=> { return {
                                run : x.run,
                                process_type: x.process_type,
                                date: x.date,
                                status: (x.data[0].nr_errors>0) ? "error" :  ((x.data[0].nr_warnings>0) ? "warning" : "ok" )
                            }});
            datatrans_es =  data.filter(k => (k.panel==panel && k.application=="datatrans"))
                            .map(x=> { return {
                                run : x.run,
                                process_type: x.process_type,
                                date: x.date,
                                status: (x.data[0].nr_errors>0) ? "error" :  ((x.data[0].nr_warnings>0) ? "warning" : "ok" )
                            }});
            rc_es =  data.filter(k => (k.panel==panel && k.application=="rc"))
                            .map(x=> { return {
                                run : x.run,
                                process_type: x.process_type,
                                date: x.date,
                                status: (x.data[0].nr_errors>0) ? "error" :  ((x.data[0].nr_warnings>0) ? "warning" : "ok" )
                            }});  
            result.push({
                panel: panel,  
                processes: {
                    porthos : porthos_es,
                    aramis: aramis_es,
                    datatrans: datatrans_es,
                    rc: rc_es
                } 
            }); 
        }    
        return JSON.parse(JSON.stringify(result));   
    }  catch (error) {  
        console.log(`Error when running 'getDataflowJSON_data' : ${error}`);
        return JSON.parse( JSON.stringify( { error: true, message: `Error when running 'getDataflowJSON_data' : ${error}` } ) ); 
    }   
};

function getDataflowJSON_data_details(data) {   
    // try {      
        var porthos = []; 
        var porthos_unique = [];
        var aramis = []; 
        var aramis_unique = []; 
        var datatrans = [];
        var datatrans_unique = [];
        var rc = [];
        var rc_unique = [];
        //porthos:
        data.filter(k => k.application=="porthos")
        .forEach(k => k.data[0].inf_warn_err
            .filter( k => (k.type.toLowerCase()=="warning" || k.type.toLowerCase()=="error") )
                .forEach(k => porthos.push( {text: k.text, type: k.type, nr: k.nr} ) 
            ) 
        );   
        [...new Set(porthos.map(k => k.text))].forEach(k => { porthos_unique.push({ 
            text: k,
            type: porthos.filter(m => m.text == k)[0].type.toLowerCase(),
            nr: porthos.filter(m => m.text == k).reduce((sum, el) => { return sum + el.nr },0)  
            })
        }); 

        //aramis:
        data.filter(k => k.application=="aramis")
        .forEach(k => k.data[0].inf_warn_err
            .forEach(k => aramis.push( {text: k.text, type: "error", nr: k.nr} ))
        );  
        [...new Set(aramis.map(k => k.text))].forEach(k => {aramis_unique.push({ 
            text: k,
            type: aramis.filter(m => m.text == k)[0].type,
            nr: aramis.filter(m => m.text == k).reduce((sum, el) => { return sum + el.nr },0)  
            })
        }); 

        //datatrans:
        data.filter(k => k.application=="datatrans")
        .forEach(k => k.data[0].inf_warn_err 
            .forEach(k => datatrans.push( {text: k.text, type: "error", nr: k.nr} ))
        );  
        [...new Set(datatrans.map(k => k.text))].forEach(k => {datatrans_unique.push({ 
            text: k,
            type: datatrans.filter(m => m.text == k)[0].type,
            nr: datatrans.filter(m => m.text == k).reduce((sum, el) => { return sum + el.nr },0)  
            })
        }); 

        //rc: 
        data.filter(k => k.application=="rc")
        .forEach(k => k.data[0].inf_warn_err
            .forEach(k => rc.push( {text: k.text, type: "error", nr: k.nr} ))
        );
        [...new Set(rc.map(k => k.text))].forEach(k => {rc_unique.push({ 
            text: k,
            type: rc.filter(m => m.text == k)[0].type,
            nr: rc.filter(m => m.text == k).reduce((sum, el) => { return sum + el.nr },0)  
            })
        }); 

        var result = {  
            porthos : porthos_unique,
            aramis: aramis_unique,
            datatrans: datatrans_unique,
            rc: rc_unique
        };  
        return JSON.parse(JSON.stringify(result));   
    // }  catch (error) {  
    //     console.log(`Error when running 'getDataflowJSON_data_details' : ${error}`);
    //     return JSON.parse( JSON.stringify( { error: true, message: `Error when running 'getDataflowJSON_data_details' : ${error}` } ) ); 
    // }   
};
 
function getDataflowJSON_progressbars(data,nr_days,expected) { 
    try {   
        var expected_porthos = expected.porthos*nr_days;
        var expected_aramis = expected.aramis*nr_days;
        var expected_datatrans = expected.datatrans*nr_days;
        var expected_rc = expected.rc*nr_days;
    
        // calcuating the percentage and nr or warning/errors/ok in total (on all pannels for a country for a day)
        const details = getDataflowJSON_data(data); 
        const panels = [...new Set(details.map(k => k.panel))];   
        var porthos_nr_ok=0, porthos_nr_warning=0, porthos_nr_error=0;
        var aramis_nr_ok=0, aramis_nr_warning=0, aramis_nr_error=0;
        var datatrans_nr_ok=0, datatrans_nr_warning=0, datatrans_nr_error=0;
        var rc_nr_ok=0, rc_nr_warning=0, rc_nr_error=0; 

        for (let [index, panel] of panels.entries() ) {    
            porthos_nr_ok += details.filter(k => k.panel==panel)[0].processes.porthos.filter(k => k.status=="ok").length;
            porthos_nr_warning += details.filter(k => k.panel==panel)[0].processes.porthos.filter(k => k.status=="warning").length;
            porthos_nr_error += details.filter(k => k.panel==panel)[0].processes.porthos.filter(k => k.status=="error").length;
            aramis_nr_ok += details.filter(k => k.panel==panel)[0].processes.aramis.filter(k => k.status=="ok").length;
            aramis_nr_warning += details.filter(k => k.panel==panel)[0].processes.aramis.filter(k => k.status=="warning").length;
            aramis_nr_error += details.filter(k => k.panel==panel)[0].processes.aramis.filter(k => k.status=="error").length;
            datatrans_nr_ok += details.filter(k => k.panel==panel)[0].processes.datatrans.filter(k => k.status=="ok").length;
            datatrans_nr_warning += details.filter(k => k.panel==panel)[0].processes.datatrans.filter(k => k.status=="warning").length;
            datatrans_nr_error += details.filter(k => k.panel==panel)[0].processes.datatrans.filter(k => k.status=="error").length; 
            rc_nr_ok += details.filter(k => k.panel==panel)[0].processes.rc.filter(k => k.status=="ok").length;
            rc_nr_warning += details.filter(k => k.panel==panel)[0].processes.rc.filter(k => k.status=="warning").length;
            rc_nr_error += details.filter(k => k.panel==panel)[0].processes.rc.filter(k => k.status=="error").length; 
        } 
        var result = {
            porthos: {
                ok: {
                    nr: porthos_nr_ok,
                    percent: ((porthos_nr_ok*100)/expected_porthos).toFixed(2)+"%"
                },
                warning: {
                    nr: porthos_nr_warning,
                    percent: ((porthos_nr_warning*100)/expected_porthos).toFixed(2)+"%"
                },
                error: {
                    nr: porthos_nr_error,
                    percent: ((porthos_nr_error*100)/expected_porthos).toFixed(2)+"%"
                }
            },
            aramis: {
                ok: {
                    nr: aramis_nr_ok,
                    percent: ((aramis_nr_ok*100)/expected_aramis).toFixed(2)+"%"
                },
                warning: {
                    nr: aramis_nr_warning,
                    percent: ((aramis_nr_warning*100)/expected_aramis).toFixed(2)+"%"
                },
                error: {
                    nr: aramis_nr_error,
                    percent: ((aramis_nr_error*100)/expected_aramis).toFixed(2)+"%"
                }
            },
            datatrans: {
                ok: {
                    nr: datatrans_nr_ok,
                    percent: ((datatrans_nr_ok*100)/expected_datatrans).toFixed(2)+"%"
                },
                warning: {
                    nr: datatrans_nr_warning,
                    percent: ((datatrans_nr_warning*100)/expected_datatrans).toFixed(2)+"%"
                },
                error: {
                    nr: datatrans_nr_error,
                    percent: ((datatrans_nr_error*100)/expected_datatrans).toFixed(2)+"%"
                }
            },
            rc: {
                ok: {
                    nr: rc_nr_ok,
                    percent: ((rc_nr_ok*100)/expected_rc).toFixed(2)+"%"
                },
                warning: {
                    nr: rc_nr_warning,
                    percent: ((rc_nr_warning*100)/expected_rc).toFixed(2)+"%"
                },
                error: {
                    nr: rc_nr_error,
                    percent: ((rc_nr_error*100)/expected_rc).toFixed(2)+"%"
                }
            }
        };     
        return JSON.parse(JSON.stringify(result));   

    }  catch (error) {  
        console.log(`Error when running 'getDataflowJSON_progressbars' : ${error}`);
        return JSON.parse( JSON.stringify( { error: true, message: `Error when running 'getDataflowJSON_progressbars' : ${error}` } ) ); 
    }   
};

function getDataflowJSON_articleout(data,date,labels_data) {   
    try {      
        var aramis = []; 
        if (date.indexOf('-') != -1) {
            var dateFrom = date.split('-')[0];
            var dateTo = date.split('-')[1];
            var dateArray = getArrayofDates(dateFrom,dateTo);
        } else {
            var dateArray = [date];
        } 
        //aramis: 
        data = data.filter(k => k.application=="aramis"); 
        dateArray.forEach(k => aramis.push( 
                {
                    labels: (k.substr(6,2) +'/'+ k.substr(4,2) +'/'+ k.substr(0,4)),
                    data: data.filter(m => m.run.split('_')[0]==k).reduce((sum, el) => { return sum + el.data[0].records_processed },0)     
                } 
            ) 
        );   
        return JSON.parse(JSON.stringify(
            {  
                data: aramis.map((k)=>{ return k.labels }),
                labels: aramis.map((k)=>{ return k.data }) 
            }
        ));   
    }  catch (error) {  
        console.log(`Error when running 'getDataflowJSON_articleout' : ${error}`);
        return JSON.parse( JSON.stringify( { error: true, message: `Error when running 'getDataflowJSON_articleout' : ${error}` } ) ); 
    }   
};




  
 
module.exports.getProtPath = getProtPath;
module.exports.getProcessDateTime = getProcessDateTime;
module.exports.getArrayofDates = getArrayofDates;
module.exports.getmostOccurances = getmostOccurances;
module.exports.getProcessRunName = getProcessRunName;
module.exports.getPorthosType = getPorthosType;
module.exports.getProcessJSON = getProcessJSON;
module.exports.getPorthosJSON = getPorthosJSON;  
module.exports.getAramisJSON = getAramisJSON; 
module.exports.getDatatransJSON = getDatatransJSON; 
module.exports.getRCJSON = getRCJSON;  
module.exports.getDataflowJSON_data = getDataflowJSON_data;  
module.exports.getDataflowJSON_data_details = getDataflowJSON_data_details;  
module.exports.getDataflowJSON_progressbars = getDataflowJSON_progressbars;  
module.exports.getDataflowJSON_articleout = getDataflowJSON_articleout; 

