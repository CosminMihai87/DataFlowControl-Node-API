var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 

///////////////////////////////////////////////////////////////////////////////schema
const schema = new Schema({
    country: {type: String, default: 'country'},
    application: {type: String, default: 'application'},
    panel: {type: String, default: 'panel'},
    run: {type: String, default: 'run'},
    process_type: {type: String, default: 'process_type'},
    date: {type: String, default: 'date'},
    filename: {type: String, default: 'filename'},
    data: { type: ['Mixed'] }  
},{versionKey: false});   
   
module.exports.schema = schema;