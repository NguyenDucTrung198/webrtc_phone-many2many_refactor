const dataPushConfig = require ("../config/push-config");
const admin = dataPushConfig.admin;
const pushConfig = dataPushConfig.pushConfig;
const request = require('request');
const ModelParticipantToken =  require('../models/participantToken');
const notification_options = {
    priority: "high",
    timeToLive: 60 * 60 * 24
};

function doRequest(options) {
    return new Promise(function (resolve, reject) {
        request(options, function (error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

async function sentToAndroid(message) {
    try {
        let data = await admin.messaging().send(message);
        return data;
    } catch (err) {
        console.log(message, err)
        if (err.code == "messaging/invalid-argument") {
            try {
                ModelParticipantToken.deleteToken(message.token);
            } catch (error) {
                console.log(error);
                return;
            }
        }
        return false;
    }
}


async function sentPushNotificationToIos(message) {
    message['app_id'] = pushConfig.app_id;
    var options = {
        'method': 'POST',
        'url': 'https://onesignal.com/api/v1/notifications',
        'headers': {
          'Authorization': 'Basic '+pushConfig.onsignal_api_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
    };
    try {
        let result = await doRequest(options);
        return JSON.parse(result);
    } catch (errr){
        return false;
    } 
}

module.exports.addDeviceWithPushNotification = async function(token) {
    let message = {};
    message['app_id'] = pushConfig.app_id;
    message['identifier'] = token;
    message['device_type'] = 0;
    message['test_type'] = 1;
    var options = {
        'method': 'POST',
        'url': 'https://onesignal.com/api/v1/players',
        'headers': {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
    };
    try {
        let result = await doRequest(options);
        return JSON.parse(result);
    } catch (errr){
        return false;
    }
}


module.exports.addDeviceWithVoip = async function(token) {
    let message = {};
    message['app_id'] = pushConfig.voip_app_id;
    message['identifier'] = token;
    message['device_type'] = 0;
    message['test_type'] = 1;
    var options = {
        'method': 'POST',
        'url': 'https://onesignal.com/api/v1/players',
        'headers': {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
    };
    try {
        let result = await doRequest(options);
        return JSON.parse(result);
    } catch (errr){
        return false;
    }
}


async function sentVoipNotificationToIos(message) {
    message['app_id'] = pushConfig.voip_app_id;
    message['apns_push_type_override'] = "voip";
    var options = {
        'method': 'POST',
        'url': 'https://onesignal.com/api/v1/notifications',
        'headers': {
          'Authorization': 'Basic '+pushConfig.voip_onsignal_api_key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
    };
    try {
        let result = await doRequest(options);
        return JSON.parse(result);
    } catch (errr){
        return false;
    }
}

module.exports.sendMissCall = async function (participant, message_onesignal= {}) {
    let infoParticipantTokens = await ModelParticipantToken.getTokenByParticipant(participant);

    let sendResultIos = [];
    if (!infoParticipantTokens.length) {
        return {"ios": sendResultIos};
    }

    let registrationTokenIos = [];
    infoParticipantTokens.forEach(paTokenInfo => {
        if (paTokenInfo.platform == "ios" && paTokenInfo.type == "notification") {
            registrationTokenIos.push(paTokenInfo.token);
        }
    })
    
    if (registrationTokenIos.length == 0) {
        return {"ios": []}
    }

    message_onesignal['include_player_ids'] = registrationTokenIos;
    sendResultIos = await sentPushNotificationToIos(message_onesignal);

    return {"ios": sendResultIos};
}

module.exports.sendToParticipant = async function (participant, message_firebase={}, message_onesignal={}, platform="all", callback=function(){}) {
    let infoParticipantTokens = await ModelParticipantToken.getTokenByParticipant(participant);

    let sendResultARs = [];
    let sendResultIos = [];
    if (!infoParticipantTokens.length) {
        callback({"android": sendResultARs, "ios": sendResultIos});
        return false;
    }

    let registrationTokenAndroid = [];
    let registrationTokenIos = [];
    infoParticipantTokens.forEach(paTokenInfo => {
        if ((platform == "ios" || platform == "all") && paTokenInfo.platform == "ios" && paTokenInfo.type == "voip") {
            registrationTokenIos.push(paTokenInfo.token);
        }
        if ((platform == "android" || platform == "all") && paTokenInfo.platform == "android") {
            registrationTokenAndroid.push(paTokenInfo.token);
        }
    })
    
    
    let promisesAllAndroid = await registrationTokenAndroid.map(async function(tokenAndroid) {
        message_firebase['token'] = tokenAndroid;
        const sendResultAR = await sentToAndroid(message_firebase);
        return sendResultAR;
    })

    sendResultARs = await Promise.all(promisesAllAndroid);
    

    message_onesignal['include_player_ids'] = registrationTokenIos;
    sendResultIos = await sentVoipNotificationToIos(message_onesignal);

    // console.log("android", sendResultARs, "ios", sendResultIos)
    callback({"android": sendResultARs, "ios": sendResultIos});
    return {"android": sendResultARs, "ios": sendResultIos};
}