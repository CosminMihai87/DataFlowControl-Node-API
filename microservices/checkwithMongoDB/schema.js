var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 

///////////////////////////////////////////////////////////////////////////////schema
const schema = new Schema({ 
    application: {type: String, default: 'application'}, 
    filename: {type: String, default: 'filename'} 
},{versionKey: false});  
   
module.exports.schema = schema;