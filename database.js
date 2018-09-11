// connection configurations 

function connection(country) {  
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
 
module.exports.connection = connection; 