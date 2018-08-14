
function interpretProtocol() {
    return 'Finished'
    // console.log('Finished');
};

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
            path='/var/atrlogs/atr{country}/datatrans/';   
            break; 
        case "rc":
            path='/move/data{country}/rc/protocol/';
            break; 
    } 
    return path.replace('{country}',country.toLowerCase()) 
};
  
  
 
 




module.exports.interpretProtocol = interpretProtocol;
module.exports.getProtPath = getProtPath;