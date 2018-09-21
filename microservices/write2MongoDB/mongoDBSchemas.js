var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 

///////////////////////////////////////////////////////////////////////////////Porthos

var schema_porthos = new Schema({
    country: {type: String, default: 'country'},
    application: {type: String, default: 'application'},
    run: {type: String, default: 'run'},
    date: {type: String, default: 'date'},
    filename: {type: String, default: 'filename'},
    data: {
        dataflow: {type: String, default: 'ScanPlus_dataro'},
        panel: {type: String, default: 'ScanPlus'},
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
    run: {type: String, default: 'run'},
    date: {type: String, default: 'date'},
    filename: {type: String, default: 'filename'},
    data: { 
        panel: {type: String, default: 'ScanPlus'},
        starttime: {type: String, default: '2018-01-01 06:23:23'},
        endtime: {type: String, default: '2018-01-01 06:25:25'},
        errors: {type: Number, default: '1'},
        error_details: { type: ['Mixed'] }, 
        warnings: {type: Number, default: '1'}, 
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
    run: {type: String, default: 'run'},
    date: {type: String, default: 'date'},
    filename: {type: String, default: 'filename'},
    data: { 
        panel: {type: String, default: 'ScanPlus'},
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
    run: {type: String, default: 'run'},
    date: {type: String, default: 'date'},
    filename: {type: String, default: 'filename'},
    data: { 
        panel: {type: String, default: 'ScanPlus'},
        starttime: {type: String, default: '2018-01-01 06:23:23'},
        endtime: {type: String, default: '2018-01-01 06:25:25'},
        records_loaded: {type: Number, default: '1'},
        records_failed: {type: Number, default: '1'},
        records_total: {type: Number, default: '1'},
        error_details: { type: ['Mixed'] } 
    } 
},{versionKey: false});  
  

module.exports = mongoose.model('porthos', schema_porthos, 'processes'); 
module.exports = mongoose.model('aramis', schema_aramis, 'processes'); 
module.exports = mongoose.model('datatrans', schema_datatrans, 'processes'); 
module.exports = mongoose.model('rc', schema_rc, 'processes'); 