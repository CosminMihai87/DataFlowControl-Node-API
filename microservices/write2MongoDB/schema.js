var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 

///////////////////////////////////////////////////////////////////////////////Porthos

var schema_porthos = new Schema({
    country: {type: String, default: 'country'},
    application: {type: String, default: 'application'},
    panel: {type: String, default: 'panel'}, 
    run: {type: String, default: 'run'},
    process_type: {type: String, default: 'process_type'},
    date: {type: String, default: 'date'},
    filename: {type: String, default: 'filename'},
    data: {
        dataflow: {type: String, default: 'dataflow'},
        starttime: {type: String, default: '2018-01-01 06:23:23'},
        endtime: {type: String, default: '2018-01-01 06:25:25'},
        input_count: {type: Number, default: '1'},
        output_count: {type: Number, default: '1'},
        nr_informations:{type: Number, default: '1'},
        nr_warnings: {type: Number, default: '1'},
        nr_errors: {type: Number, default: '1'}, 
        inf_warn_err: {  type: [ 'Mixed'  ]  }
    } 
},{versionKey: false});  

///////////////////////////////////////////////////////////////////////////////Aramis 
const schema_aramis = new Schema({
    country: {type: String, default: 'country'},
    application: {type: String, default: 'application'},
    panel: {type: String, default: 'panel'},
    run: {type: String, default: 'run'},
    process_type: {type: String, default: 'missing'},
    date: {type: String, default: 'date'},
    filename: {type: String, default: 'filename'},
    data: { 
        starttime: {type: String, default: '2018-01-01 06:23:23'},
        endtime: {type: String, default: '2018-01-01 06:25:25'},
        nr_errors: {type: Number, default: '1'},
        error_details: { type: ['Mixed'] }, 
        nr_warnings: {type: Number, default: '1'}, 
        warning_details: { type: ['Mixed'] }, 
        info_details: { type: ['Mixed'] }, 
        purchacts_total: {type: Number, default: '1'},
        articles_total: {type: Number, default: '1'},
        nr_processed_purchacts: {type: Number, default: '1'},
        nr_processed_movement_records: {type: Number, default: '1'},
        records_processed: {type: Number, default: '1'},
        nr_faulty_purchacts: {type: Number, default: '1'},
        nr_faulty_movement_records: {type: Number, default: '1'} 
    } 
},{versionKey: false});  

///////////////////////////////////////////////////////////////////////////////Datatrans
const schema_datatrans = new Schema({
    country: {type: String, default: 'country'},
    application: {type: String, default: 'application'},
    panel: {type: String, default: 'panel'},
    run: {type: String, default: 'run'},
    process_type: {type: String, default: 'missing'},
    date: {type: String, default: 'date'},
    filename: {type: String, default: 'filename'},
    data: { 
        nr_errors: {type: Number, default: '1'},
        nr_new_art_created: {type: Number, default: '1'},
        error_details: { type: ['Mixed'] },
        new_art_created_details: { type: ['Mixed'] }
    } 
},{versionKey: false});  

///////////////////////////////////////////////////////////////////////////////RC
const schema_rc = new Schema({
    country: {type: String, default: 'country'},
    application: {type: String, default: 'application'},
    panel: {type: String, default: 'panel'},
    run: {type: String, default: 'run'},
    process_type: {type: String, default: 'missing'},
    date: {type: String, default: 'date'},
    filename: {type: String, default: 'filename'},
    data: { 
        starttime: {type: String, default: '2018-01-01 06:23:23'},
        endtime: {type: String, default: '2018-01-01 06:25:25'},
        records_loaded: {type: Number, default: '1'},
        records_failed: {type: Number, default: '1'},
        records_total: {type: Number, default: '1'},
        nr_errors : {type: Number, default: '1'},
        error_details: { type: ['Mixed'] } 
    } 
},{versionKey: false});  
  

///////////////////////////////////////////////////////////////////////////////dataflow
const schema_dataflow = new Schema({
    country: {type: String, default: 'country'},
    date: {type: String, default: 'date'},  
    application: {type: String, default: 'application'},
    panel: { type: ['Mixed'] } 
},{versionKey: false});   


module.exports.schema_porthos = schema_porthos; 
module.exports.schema_aramis = schema_aramis; 
module.exports.schema_datatrans = schema_datatrans; 
module.exports.schema_rc = schema_rc; 
module.exports.schema_dataflow = schema_dataflow; 