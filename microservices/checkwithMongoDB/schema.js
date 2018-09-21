var mongoose = require('mongoose');  
const Schema = mongoose.Schema; 

///////////////////////////////////////////////////////////////////////////////schema
const schema = new Schema({ 
    run: {type: String, default: 'run'}, 
    filename: {type: String, default: 'filename'} 
},{versionKey: false});  
 
module.exports.schema = schema;