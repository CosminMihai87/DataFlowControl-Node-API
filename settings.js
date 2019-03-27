// connection configurations 

function ftpConnection(country) {  
    var host = "";
    switch (country.toLowerCase()) { 
        case "be":
        case "it":
        case "nl":
        case "no":
        case "se":
            host='dcex-apatrp02'; //old : nuex-apct02.gfk.com
            break;
        case "de":
        case "fr":
            host='dcex-apatrp01'; //old : nuex-fsct01.gfk.com
            break;
        default:
            host='dcex-apatrp03'; //old : nuex-apct03.gfk.com
    };  
    return {   
        host: host,  
        user: 'nue.cpshub.svc',
        password: '8PhtzoxN4ijff92Bifq94yz72yUFnq',  
        connTimeout:'30000'
    };
}; 

var SSHTunelConfig = {  
    // keepAlive: true,
    username: 'gpsuser',
    password: 'gps0155', 
    host: 'dcex-rotcps01.gfk.com',  
    port: 22,
    dstHost: 'mongodb://cnmiha:Cosmin1987@dcex-rotcps01.gfk.com:27017/dfc-db',
    dstPort: 27017, 
    localHost:'127.0.0.1',
    localPort: 27001,
    agent : process.env.SSH_AUTH_SOCK, 
}

var mongoConnOptions = {  
    user: "cnmiha",
    pass: "Cosmin1987",
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

function getProtocolDetails(country) {  
    let result = { runs:[], processes: [], dbsettings: [] }; 
    var host = "";
    switch (country.toLowerCase()) { 
        case "at":
            host='dcex-apatrp03';   
            result.runs=[ 
                /ScanIT_\d{8}_\d{6}/, 
                /ScanPlus_\d{8}_\d{6}/,  
                /SmartScan_\d{8}_\d{6}_(export|nonpurchase|TehnicalRC)/ 
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/dataat/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/move/dataat/aramis/protocol/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrat/datatrans/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "move/dataat/rc/protocol/" }); 
            break;
        case "be":
            host='dcex-apatrp02';     
            break;
        case "bg":
            host='dcex-apatrp03';  
            result.runs=[  
                /PaperPencil_\d{8}_\d{6}/ 
            ]; 
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/databg/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/move/databg/aramis/protocol/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrbg/datatrans/" }); 
            break;
        case "cz":
            host='dcex-apatrp03';   
            result.runs=[  
                /ScanPlus_\d{8}_\d{6}/ 
            ]; 
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/datacs/porthos_cz/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/move/datacs/aramis_cz/protocol/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrcs/datatrans_cz/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/move/datacs/rc_cz/protocol/" });
            break;
        case "de": 
            host='dcex-apatrp01';   
            result.runs=[  
                /ScanIT_\d{8}_\d{6}/,  
                /ScanIT_\d{8}_\d{6}_nonpurchase/,  
                /ScanEasy_\d{8}_\d{6}/,  
                /ScanEasy_\d{8}_\d{6}_nonpurchase/,   
                /SmartScan_\d{8}_\d{6}_(nonpurchase_export|export|rcinfo)/,  
                /ScanPlus_\d{8}_\d{6}_(up|code|export|rcinfo)/,  
                /Universalpanel_\d{8}_\d{6}_export/,  
                /ECPOScan_\d{8}_\d{6}_export/,  
                /MyScan_\d{8}_\d{6}_(export|code|rcinfo|up_week|up_month|nonpurchase)/ 
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/datade/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/move/datade/aramis/protocol/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/move/datade/datatrans/log/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/move/datade/rc/protocol/" });
            break;
        case "dk":
            host='dcex-apatrp03';    
            break;
        case "fr":  
            host='dcex-apatrp01';   
            result.runs=[ 
                /MediaScope_\d{8}_\d{6}_export/ 
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/datafr/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/move/datafr/aramis/protocol/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/move/datafr/datatrans/log/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/move/datafr/rc/protocol/" });
            break;
        case "hr":  
            host='dcex-apatrp03';   
            result.runs=[  
                /Smartscan_\d{8}_\d{6}/,  
                /SmartScan_\d{8}_\d{6}_(nonpurchase|TehnicalRC)/ 
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/datahr/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/move/datahr/aramis/protocol/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrhr/datatrans/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/move/datahr/rc/protocol/" });
            break;
        case "hu":  
            host='dcex-apatrp03';   
            result.runs=[  
                /SmartScan_\d{8}_\d{6}/,  
                /SmartScan_\d{8}_\d{6}_(nonpurchase|TehnicalRC)/, 
                /Telco_output_\d{8}_\d{6}/,  
                /ScanPlus_datahu_\d{8}_\d{6}/,  
                /ScanPlus_datahu_RC_\d{8}_\d{6}/
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/datahu/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/move/datahu/aramis/protocol/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrhu/datatrans/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/move/datahu/rc/protocol/" });
            break;
        case "it":  
            host='dcex-apatrp02';   
            result.runs=[   
                /SmartScan_\d{8}_\d{6}_(export|nonpurchase|TehnicalRC)/ 
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/datait/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/var/atrlogs/atrit/aramis/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrit/datatrans/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/move/datait/rc/protocol/" });
            break;
        case "nl":  
            host='dcex-apatrp02';   
            result.runs=[  
                /SmartScan_\d{8}_\d{6}/,  
                /SmartScan_\d{8}_\d{6}_(nonpurchase|technical|export)/ 
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/datanl/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/var/atrlogs/atrnl/aramis/smartscan/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrnl/datatrans/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/var/atrlogs/atrnl/rc/" });
            break;
        case "no":  
            host='dcex-apatrp02';   
            result.runs=[  
                /Smartscan_\d{8}_\d{6}/,  
                /SmartScan_\d{8}_\d{6}_(export|nonpurchase|TehnicalRC)/, 
                /ECPO_\d{8}_\d{6}_(FMCG_Unproc|FMCG|FMCG_TILL)/ 
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/datano/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/move/datano/aramis/protocol/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrno/datatrans/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/move/datano/rc/protocol/" });
            break;
        case "pl":  
            host='dcex-apatrp03';   
            result.runs=[ 
                /ScanPLUS_\d{8}_\d{6}_(export|code|rcinfo)/ 
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/datapl/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/var/atrlogs/atrpl/aramis/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrpl/datatrans/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/move/datapl/rc/protocol/" });
            break;
        case "ro":  
            host='dcex-apatrp03';   
            result.runs=[ 
                /ScanPlus_RO_RC_\d{8}_\d{6}/, 
                /ScanPlus_dataro_\d{8}_\d{6}/ 
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/dataro/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/move/dataro/aramis/protocol/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrro/datatrans/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/move/dataro/rc/protocol/" });
            break;
        case "rs":  
            host='dcex-apatrp03';   
            result.runs=[  
                /Smartscan_\d{8}_\d{6}_(TehnicalRC)/,  
                /SmartScan_\d{8}_\d{6}/,  
                /SmartScan_\d{8}_\d{6}_(nonpurchase)/ 
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/datars/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/move/datars/aramis/protocol/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrrs/datatrans/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/move/datars/rc/protocol/" });
            break;
        case "ru":  
            host='dcex-apatrp03';   
            result.runs=[  
                /Smartscan_\d{8}_\d{6}_(TehnicalRC)/,   
                /SmartScan_\d{8}_\d{6}_(nonpurchase|export)/ 
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/dataru/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/var/atrlogs/atrru/aramis/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrru/datatrans/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/move/dataru/rc/protocol/" });
            break;
        case "se":  
            host='dcex-apatrp02';    
            break;
        case "sk": 
            host='dcex-apatrp03';   
            result.runs=[  
                /ScanPlus_\d{8}_\d{6}/ 
            ]; 
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/datacs/porthos_sk/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/move/datacs/aramis_sk/protocol/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrcs/datatrans_sk/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/move/datacs/rc_sk/protocol/" });
            break;
        case "za":   
            host='dcex-apatrp03';   
            result.runs=[   
                /ZA0\d{1}_\d{8}_\d{6}_(backbone|nonpurchase|purchase)/ 
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/dataza/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/move/dataza/aramis/protocol/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrza/datatrans/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "/move/dataza/rc/protocol/" });
            break;
        default:  
            host='dcex-apatrp03';  
            result.runs=[ 
                /ScanPlus_RO_RC_\d{8}_\d{6}/, 
                /ScanPlus_dataro_\d{8}_\d{6}/ 
            ];
            result.processes.push({ process: "Porthos", type: "PreNabs", protocol_path: "/move/dataro/porthos/protocol/" });
            result.processes.push({ process: "Aramis", type: "PreNabs", protocol_path: "/move/dataro/aramis/protocol/" });
            result.processes.push({ process: "Datatrans", type: "PreNabs", protocol_path: "/var/atrlogs/atrro/datatrans/" });
            result.processes.push({ process: "RC", type: "PreNabs", protocol_path: "move/dataro/rc/protocol/" });
    };   
    result.dbsettings = {   
        host: host,  
        user: 'nue.cpshub.svc',
        password: '8PhtzoxN4ijff92Bifq94yz72yUFnq',
        connTimeout:'30000'
    }; 
    return result; 
}; 
 
module.exports.ftpConnection = ftpConnection; 
module.exports.SSHTunelConfig = SSHTunelConfig; 
module.exports.mongoConnOptions = mongoConnOptions;  
module.exports.getProtocolDetails = getProtocolDetails; 