var fs = require('fs'); 
var os = require('os');

function getProtPath(process,country) {
    var path;  
    switch (process.toLowerCase()) {
        case "porthos":
            path='/move/data{country}/porthos/protocol/';
            break;
        case "aramis":
            path='/move/data{country}/aramis/protocol/';
            break; 
        case "datatrans":
            path='/move/data{country}/datatrans/';   
            break; 
        case "rc":
            path='/move/data{country}/rc/protocol/';
            break; 
    } 
    return path.replace('{country}',country.toLowerCase()) 
};
  
// splits a string by _ and searches for all the splited strings of the format YYYYmmDD folowed by a string of format HHmmSS and combines them into a date of format 2018-07-19T05:39:00(for example)
function getProcessDateTime(string) { 
    var array = string.split('_');  
    for (let [index, str] of array.entries() ) {  
       if (str.match(/([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01]))/g)) {
           if( array[index+1].match(/(([0-1]?[0-9])|(2[0-3]))[0-5][0-9][0-5][0-9]/g) ) {   
                return (array[index].substr(0,4) +'-'+ array[index].substr(4,2) +'-'+ array[index].substr(6,2) + 'T' + array[index+1].substr(0,2) +':'+ array[index+1].substr(2,2) +':'+ array[index+1].substr(4,2)+'.000Z' )
           } else { 
                // return (array[index].substr(0,4) +'-'+ array[index].substr(4,2) +'-'+ array[index].substr(6,2) + 'T00:00:00.000Z' )
           };
       } else { 
            // return ('1900-01-01T00:00:00.000Z' )
       };
    }  
};
 
function getProcessJSON(process,chunks) { 
    switch (process.toLowerCase()) {
        case "porthos":
            return getPorthosJSON(Buffer.concat(chunks).toString('utf8')); 
        case "aramis":
            return getAramisJSON(Buffer.concat(chunks).toString('utf8')); 
        case "datatrans":
            return getDatatransJSON(Buffer.concat(chunks).toString('utf8')); 
        case "rc":
            return getRCJSON(Buffer.concat(chunks).toString('utf8')); 
    }  
};
  
function getPorthosJSON(data) {     
    try {
        var convert = require('xml-js');
        var Json_string = convert.xml2json(data, {compact: true, spaces: 4});  
        const application = JSON.parse(Json_string)['protocol'].general.application['_text'];
        const dataflow = JSON.parse(Json_string)['protocol'].general.dataflow['_text'];
        const panel = dataflow.split('_')[0];
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
            application: application,
            dataflow: dataflow,
            panel: panel,
            starttime: starttime,
            endtime: endtime,
            input_count: input_count,
            output_count: output_count,
            nr_informations: nr_informations,
            nr_warnings: nr_warnings,
            nr_errors: nr_errors,
            inf_warn_err: inf_warn_err   
        })
        // console.log(result.toString());
        return JSON.parse(result);
        // return messages;

    } catch(error) { console.log(error); }  
};

function getAramisJSON(data) {   
    let lines = data.split('\n'); 
    for (let [index, line] of lines.entries() ) {      
        if (line.indexOf('input file:  ')==0) {
            let len = line.split('/').length;
            var panel = line.split('/')[len-1].split('_')[0];
        }
        if (line.indexOf('starting ARaMIS')==0) {
            let len = line.split(' ').length;
            var starttime = line.split(' ')[len-2] + 'T' + line.split(' ')[len-1] + '+2';
        }
        if (line.indexOf('finished at: ')==0) {
            let len = line.split(' ').length;
            var endtime = line.split(' ')[len-2] + 'T' + line.split(' ')[len-1] + '+2';
        }
        if (line.indexOf('Errors:')==0) { var errors = line.split(':')[1]; } 
        if (line.indexOf('Warnings:')==0) { var warnings = line.split(':')[1]; } 
        if (line.indexOf('Purchacts total:')==0) { var purchacts_total = line.split(':')[1]; } 
        if (line.indexOf('Articles total:')==0) { var articles_total = line.split(':')[1]; } 
        if (line.indexOf('Number of processed purchacts:')==0) { var nr_processed_purchacts = line.split(':')[1]; } 
        if (line.indexOf('Number of processed movement records:')==0) { var nr_processed_movement_records = line.split(':')[1]; } 
        if (line.indexOf('Records processed:')==0) { var records_processed = line.split(':')[1]; } 
        if (line.indexOf('Number of faulty purchacts:')==0) { var nr_faulty_purchacts = line.split(':')[1]; } 
        if (line.indexOf('Number of faulty movement records:')==0) { var nr_faulty_movement_records = line.split(':')[1]; } 

        if (line.indexOf('ERROR BEGIN')==0) { var ERROR_BEGIN_index = index; } 
        if (line.indexOf('ERROR END')==0) { var ERROR_END_index = index; } 
        if (line.indexOf('WARNING BEGIN')==0) { var WARNING_BEGIN_index = index; } 
        if (line.indexOf('WARNING END')==0) { var WARNING_END_index = index; } 
        if (line.indexOf('INFO BEGIN')==0) { var INFO_BEGIN_index = index; } 
        if (line.indexOf('INFO END')==0) { var INFO_END_index = index; }  
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
    var error_details=[];
    var warning_details=[];
    var info_details=[]; 

    if (ERROR.length>2) { // if this array contains more than 2 lines "ERROR BEGIN" and "ERROR END" 
        var temp_array=[];
        for (let [index, line] of ERROR.entries() ) {     
            if (index>2 && index<ERROR.length-1) {  
                temp_array.push({
                        Line: ERROR[index].split('\t')[0],
                        PurchactId: ERROR[index].split('\t')[1],
                        domain: ERROR[index].split('\t')[2],
                        feature_name: ERROR[index].split('\t')[3],
                        feature_value: ERROR[index].split('\t')[4],
                        requested_feature: ERROR[index].split('\t')[5],
                        pickDate: ERROR[index].split('\t')[6]
                })
            }
        } 
        error_details.push({ text: ERROR[1], nr_errors: temp_array.length, details: temp_array });
    }

    if (WARNING.length>2) { // if this array contains more than 2 lines "ERROR BEGIN" and "ERROR END" 
        var temp_array=[];
        for (let [index, line] of WARNING.entries() ) {     
            if (index>2 && index<WARNING.length-1) {  
                temp_array.push({
                        Line: WARNING[index].split('\t')[0],
                        PurchactId: WARNING[index].split('\t')[1],
                        domain: WARNING[index].split('\t')[2],
                        feature_name: WARNING[index].split('\t')[3],
                        feature_value: WARNING[index].split('\t')[4],
                        requested_feature: WARNING[index].split('\t')[5],
                        pickDate: WARNING[index].split('\t')[6]
                })
            }
        } 
        warning_details.push({ text: WARNING[1], details: temp_array });
    }

    const application = 'Aramis';  

    var result = JSON.stringify({
        application: application, 
        panel: panel,
        starttime: starttime,
        endtime: endtime,
        errors: errors,
        error_details: error_details,
        warnings: warnings,
        warning_details: warning_details,
        info_details: info_details,
        purchacts_total: purchacts_total,
        articles_total: articles_total,
        nr_processed_purchacts: nr_processed_purchacts,
        nr_processed_movement_records: nr_processed_movement_records,
        records_processed: records_processed,
        nr_faulty_purchacts: nr_faulty_purchacts,
        nr_faulty_movement_records: nr_faulty_movement_records 
    })
    return JSON.parse(result); 
};

function getDatatransJSON(data) {     
    return {"application":"Datatrans"}
};

function getRCJSON(data) {     
    return {"application":"RC"}
};




















 
module.exports.getProtPath = getProtPath;
module.exports.getProcessDateTime = getProcessDateTime;
module.exports.getProcessJSON = getProcessJSON;
module.exports.getPorthosJSON = getPorthosJSON;  
module.exports.getAramisJSON = getAramisJSON; 
module.exports.getDatatransJSON = getDatatransJSON; 
module.exports.getRCJSON = getRCJSON; 

