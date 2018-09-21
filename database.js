// connection configurations 

function ftpConnection(country) {  
    var host = "";
    switch (country.toLowerCase()) { 
        case "be":
        case "it":
        case "nl":
        case "no":
        case "se":
            host='nuex-apct02.gfk.com';
            break;
        case "de":
        case "fr":
            host='nuex-fsct01.gfk.com'; 
            break;
        default:
            host='nuex-apct03.gfk.com'; 
    };  
    return {   
        host: host,  
        user: 'nue.cpshub.svc',
        password: 'R2Utfn47' 
    };
};

var SSHTunelConfig = {  
    // keepAlive: true,
    username: 'gpsuser',
    password: 'gps0155', 
    host: 'dcex-rotcps01.gfk.com',  
    port: 22,
    dstHost: 'mongodb://dcex-rotcps01.gfk.com:27017/dfc-db',
    dstPort: 27017, 
    localHost:'127.0.0.1',
    localPort: 27001,
    agent : process.env.SSH_AUTH_SOCK, 
}

var mongoConnOptions = {  
    useNewUrlParser: true,
    autoIndex: false, // Don't build indexes
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0,
    connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
}
 
module.exports.ftpConnection = ftpConnection; 
module.exports.SSHTunelConfig= SSHTunelConfig; 
module.exports.mongoConnOptions= mongoConnOptions; 