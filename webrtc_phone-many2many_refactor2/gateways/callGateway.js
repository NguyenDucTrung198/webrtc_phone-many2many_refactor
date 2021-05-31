const i18n = require('i18n')
const Logger = require('../helpers/logger');
const RequestHandler = require('../helpers/requestHandler');
const logger = new Logger();
const requestHandler = new RequestHandler(logger);

const _ = require('lodash');

const config = require('../config/appConfig');

const CallHelper = require('../helpers/callHelper');
//const ModelRoomMain = require("../models/roomMain");
//const ModelRoomContent = require("../models/roomContent");
//const ModelParticipantSetting = require("../models/participantSetting");
//const ModelParticipant = require("../models/participant");
//const ModelBase = require("../models/__base")

const CallDbGateway = require("../gateways/databaseGateways/callDbGateway.js");

const pushFunc = require("../helpers/pushFunc");

exports.registerResponse = async (socket, message) => {
    try {
        let userSession = CallDbGateway.register(socket, message.name);
        userSession.sendMessage({
            id: 'registerResponse',
            response: "accepted"
        });
    } catch (exception) {
        return requestHandler.sendError(exception);
    }
}

var getSound = function (audio) {
    let sound = "telephoneringtone1.wav";
    if (audio == 1) {
        sound = "telephoneringtone1.wav";
    } else if (audio == 2) {
        sound = "telephoneringtone2.wav";
    } else if (audio == 3) {
        sound = "telephoneringtone3.wav";
    } else if (audio == 4) {
        sound = "telephoneringtone4.wav";
    } else if (audio == 5) {
        sound = "telephoneringtone5.wav";
    }
    return {"sound": sound};
}

var processMissCall = async function (recordId, CallerName = "Some one") {
    if (!recordId) return 
    try {
        let dataRoomContent = await CallDbGateway.getRoomContent(recordId);
        if (dataRoomContent && (dataRoomContent['status'] == "calling" || dataRoomContent['status'] == "no_response") ) {
            let messageOnesignal = {
                "ios_badgeType": "Increase",
                "ios_badgeCount": 1,
                "headings": {
                    "en": CallerName
                },
                "contents": {
                    "en": i18n.__('Missed call')
                }
            }
            pushFunc.sendMissCall(dataRoomContent['participant'], messageOnesignal)
        }
    } catch (error) {
        console.log(error);
    }
}

exports.call = async (socket, message) => {
    let roomName = "";
    let userSession = CallDbGateway.getParticipantById(socket.id);
    if (!userSession) {
        console.log("!userSession");
        return false;
    }
    if ("roomName" in message && message.roomName) {
        roomName = message.roomName;
        message.from = userSession.name;
        message.to = roomName;
    } else {
        roomName = CallHelper.genRoomName(message.from, message.to)
        message.roomName = roomName;
    }
    let titleCall = (message.titleCall).trim();
    let callerStr = (message.from).trim();
    let calleeStr = (message.to).replace(/、/g, ",");
    let toArr = calleeStr.split(",");
    let index = toArr.indexOf(userSession.name);
    if (index !== -1) {
        toArr.splice(index, 1);
        message.to = toArr.join();
    }
    
    let callerSession = userSession;

    // Message to caller
    let messageToCaller = {
        id: 'dataForCaller',
        from: callerStr,
        roomName: roomName
    };
    
    CallHelper.joinRoom(socket, message, async (err, exist) =>  {
        if (err) {
            console.error(`join Room error ${err}`);
        }
        if (exist) {
            let roomId = CallHelper.rooms[roomName]['roomId'];
            try {
                let dataInsRoomContent = await CallDbGateway.insertRoomContent(roomId, callerStr, "accept");
                messageToCaller.record_id = dataInsRoomContent.insertId;
                callerSession['idContent'+String(roomId)] = dataInsRoomContent.insertId;
                callerSession.sendMessage(messageToCaller);
            } catch (error) {
                console.log(error);
            }
            return;
        }

        let roomId = 0;
        let resInsRoomMain = {};
        let resInsRoomContent = {};

        try {
            resInsRoomMain = await CallDbGateway.inserRoomMain(roomName, callerStr, calleeStr, titleCall);
            roomId = resInsRoomMain.insertId;
            CallHelper.rooms[roomName]['roomId'] = roomId;
        } catch (error) {
            console.log(error);
            return
        }

        try {
            resInsRoomContent = await CallDbGateway.insertRoomContent(roomId, callerStr, "calling");
            messageToCaller.record_id = resInsRoomContent.insertId;
            callerSession['idContent'+String(roomId)] = resInsRoomContent.insertId;
            callerSession.sendMessage(messageToCaller);
        } catch (error) {
            console.log(error);
            return;
        }
        // Send message to peer
        let messageToPeer = {
            id: 'incomingCall',
            from: callerStr,
            room: roomName,
            titleCall: titleCall
        };

        let dataMessageToPeerMobile = {
            event: "incoming_call",
            id: 'incomingCall',
            mb_from: callerStr,
            room: roomName,
            record_id: (resInsRoomMain.insertId).toString(),
            titleCall: titleCall
        };

        let resParticipantSettings = {};
        let dataSettingAudio = {};
        let callSameDomainOfCaller = 0;
        let receiveNotSameDomain = {};
        let rejectNotLogin = {};
        var participantSetting = _.cloneDeep(toArr);
        participantSetting.push(callerStr);
        try {
            resParticipantSettings = await CallDbGateway.participantSettingGetAll(participantSetting);
        } catch (error) {
            console.log(error);
            return;
        }
        resParticipantSettings.forEach(function (item) {
            dataSettingAudio[item.participant] = item.audio;
            if (item.participant == callerStr) {
                callSameDomainOfCaller = item.call_same_domain;
            }
            receiveNotSameDomain[item.participant] = item.receive_not_same_domain;
            rejectNotLogin[item.participant] = item.reject_not_login;
        })
        //
        let messageFirebase = {
            data: dataMessageToPeerMobile
        };
        let participantNotCallOtherDomain = [];
        let participantNotReceiveOtherDomain = [];
        let participantCancelByNotLogin = [];
        toArr.forEach(async function(v) {
            let peerName = v.trim();
            let domainCaller = CallHelper.getDomainFromEmail(callerStr);
            let domainPeer = CallHelper.getDomainFromEmail(peerName);
            if (!callSameDomainOfCaller) {
                if (domainPeer != domainCaller) {
                    participantNotCallOtherDomain.push(peerName);
                    return CallDbGateway.insertRoomContent(roomId, peerName, "call_same_domain");
                }
            }

            if (!receiveNotSameDomain[peerName] && domainPeer != domainCaller) {
                participantNotReceiveOtherDomain.push(peerName);
                return CallDbGateway.insertRoomContent(roomId, peerName, "receive_not_same_domain");
            }

            if (rejectNotLogin[peerName] && (!userSession.hasLogin || Object.keys(userSession.hasLogin).length == 0)) {
                participantCancelByNotLogin.push(peerName);
                return CallDbGateway.insertRoomContent(roomId, peerName, "reject_not_login");
            }

            let peerSessions = CallDbGateway.getParticipantByName(peerName);
            let audio = 1;
            if (dataSettingAudio[peerName]) {
                audio = dataSettingAudio[peerName];
            }
            let messageOnesignal = {
                "headings": {
                    "en": "Incomming call"
                },
                "contents": {
                    "en": callerStr
                },
                "ios_sound": (getSound(audio))['sound'],
                "data": messageToPeer
            };

            if (peerSessions && peerSessions.length) {
                try {
                    let resInsRoomContentPeer = await CallDbGateway.insertRoomContent(roomId, peerName, "calling");
                    messageToPeer.record_id = resInsRoomContentPeer.insertId;
                    peerSessions.forEach(function(peerSession) {
                        peerSession['idContent'+String(roomId)] = resInsRoomContentPeer.insertId;
                        peerSession.sendMessage(messageToPeer);
                    })
                    pushFunc.sendToParticipant(peerName, messageFirebase, messageOnesignal, "all", function(resultSend) {
                        let hasSent = false;
                        if (resultSend['ios']['id']) {
                            hasSent = 1;
                        }
                        if (hasSent) {
                            setTimeout( function(){
                                processMissCall(result.insertId, caller_str);
                            }, config.app.timeoutCalling)
                        }
                    });
                } catch (error) {
                    console.log(error);
                    return;
                }
            } else {
                try {
                    let resInsRoomContentPeer = await CallDbGateway.insertRoomContent(roomId, peerName, "pending");
                    let recordId = resInsRoomContentPeer.insertId;
                    messageToPeer.record_id = recordId;
                    pushFunc.sendToParticipant(peerName, messageFirebase, messageOnesignal, "all", async function(rs2) {
                        let hasSent = false;
                        rs2['android'].forEach(vrs2 => {
                            if (vrs2 != false) hasSent = 1;
                        })
                        if (rs2['ios']['id']) {
                            hasSent = 1;
                        }
                        if (hasSent) {
                            try {
                                await CallDbGateway.setStatusRoomContent(recordId, "calling");
                                setTimeout( function(){
                                    processMissCall(recordId, callerStr);
                                }, config.app.timeoutCalling)
                            } catch (error) {
                                console.log(error)
                                return;
                            }
                        } else {
                            try {
                                await CallDbGateway.setStatusRoomContent(recordId, "offline");
                                let messageToCaller = {
                                    id: 'offline',
                                    peer: peerName
                                }
                                userSession.sendMessage(messageToCaller);
                            } catch (error) {
                                console.log(error)
                                return;
                            }
                        }
                    });
                } catch (error) {
                    console.log(error);
                    return;
                }
            }
        })
        let messageCallSettingReject = {
            id: 'callSettingReject',
            participantNotCallOtherDomain: participantNotCallOtherDomain,
            participantNotReceiveOtherDomain: participantNotReceiveOtherDomain,
            participantCancelByNotLogin: participantCancelByNotLogin
        }
        callerSession.sendMessage(messageCallSettingReject);
    })
}

exports.incomingCallResponse = (socket, message) => {
    let userSession = CallDbGateway.getParticipantById(socket.id);
    if (userSession.name) {
        let users = CallDbGateway.getParticipantByName(userSession.name);
        users.forEach(function(user) {
            if (user.id != socket.id) {
                user.sendMessage({
                    id: 'otherDeviceResponse'
                })
            }
        })
    }
    if (message.callResponse == "accept") {
        CallHelper.joinRoom(socket, message, err => {
            if (err) {
                console.error(`join Room error ${err}`);
                return;
            }
            //db.updateRoomContent(message.record_id, "accept");
        });
    } else {
        CallDbGateway.updateRoomContent(message.record_id, message.callResponse);
        let room = CallHelper.rooms[message.roomName];
        if (room) {
            room.creator.sendMessage({id: "callResponse", response: "rejected", peer: userSession.name, message: message.message});
        }
    }
}

exports.receiveVideoFrom = (socket, senderName, sdpOffer) => {
    CallHelper.receiveVideoFrom(socket, senderName, sdpOffer, (error) => {
        
    })
}

exports.leaveRoomResponse = async (socket) => {
    var userSession = CallDbGateway.getParticipantById(socket.id);
    if (!userSession) {
        return;
    }
    var room = CallHelper.rooms[userSession.roomName];
    if(!room) {
        return;
    }

    if (typeof (userSession['idContent'+String(room.roomId)]) != "undefined" && userSession['idContent'+String(room.roomId)]) {
        let recordId = userSession['idContent'+String(room.roomId)];
        CallDbGateway.updateRoomContent(recordId, "end");
        delete userSession['idContent'+String(room.roomId)];
    } else {
        let dataRoomContent = await CallDbGateway.getRoomContentByParticipantAndStatus(userSession.name);
        dataRoomContent.forEach(function (item) {
            if (item && item.id) {
                CallDbGateway.updateRoomContent(item.id, "end");
            }
        })
    }

    if (room.creator == userSession) {
        let peerArr = CallHelper.getArrayPeer(room.name);
        peerArr.forEach(function(v) {
            let message_to_peer = {
                id: "hostRejected",
                caller: userSession.name,
                room: room.name
            };
            if (v != userSession.name) {
                let peerSessions = CallDbGateway.getParticipantByName(v);
                if (peerSessions) {
                    peerSessions.forEach(function(peerSession) {
                        peerSession.sendMessage(message_to_peer);
                    })
                }
                
            }
        })
    }

    console.log('notify all user that ' + userSession.name + ' is leaving the room ' + room.name);
    var usersInRoom = room.participants;
    delete usersInRoom[userSession.name];
    userSession.outgoingMedia.release();

    // release incoming media for the leaving user
    for (var i in userSession.incomingMedia) {
        userSession.incomingMedia[i].release();
        delete userSession.incomingMedia[i];
    }

    var data = {
        id: 'participantLeft',
        name: userSession.name
    };
    for (var i in usersInRoom) {
        var user = usersInRoom[i];
        // release viewer from this
        if (typeof (user.incomingMedia[userSession.name]) != "undefined") {
            user.incomingMedia[userSession.name].release();
        }
        delete user.incomingMedia[userSession.name];

        // notify all user in the room
        user.sendMessage(data);
    }

    // Release pipeline and delete room when room is empty
    if (Object.keys(room.participants).length == 0) {
        room.pipeline.release();
        

        let peerArr = CallHelper.getArrayPeer(room.name);
        peerArr.forEach(function(v) {
            let messageToPeer = {
                id: "callEnd",
                roomName: room.name
            };
            let peerSessions = CallDbGateway.getParticipantByName(v);
            if (peerSessions) {
                peerSessions.forEach(function(peerSession) {
                    peerSession.sendMessage(messageToPeer);
                })
            }
        })
        if (room.roomId) {
            CallDbGateway.updateStatusByStatusAndRoomId("calling", "no_response", room.roomId);
            CallDbGateway.updateStatusRoomMainById(room.roomId, "end");
        }
        //db.updateRoomMain(room.roomId, "end");
        delete CallHelper.rooms[userSession.roomName];
    }
    delete userSession.roomName;
}

exports.addIceCandidate = (socket, message) => {
    CallHelper.addIceCandidate(socket, message, (error) => {
        
    });
}

exports.startCalling = async (socket, message) => {
    let dataRoomContent = await CallDbGateway.getRoomContent(message.record_id);
    if (dataRoomContent.status == "calling") {
        CallDbGateway.updateRoomContent(message.record_id, "accept");
        CallDbGateway.updateStatusRoomMainById(dataRoomContent.room_id, "talking");
    }
}

exports.reJoinRoom = async (socket, message) => {
    CallHelper.joinRoom(socket, message, async (err) => {
        if (err) {
            console.error(`join Room error ${err}`);
            return;
        }
        let userSession = CallDbGateway.getParticipantById(socket.id);
        let roomName = userSession.roomName;
        let roomId = CallHelper.rooms[roomName]['roomId'];
        try {
            let dataInsRoomContent = await CallDbGateway.insertRoomContent(roomId, userSession.name, "accept");
            userSession['idContent'+String(roomId)] = dataInsRoomContent.insertId;
            userSession.sendMessage({id:"dataForCaller", record_id: dataInsRoomContent.insertId, roomName: userSession.roomName})
        } catch (error) {
            console.log(error);
        }
    });
}

exports.checkCalling = async (participant) => {
    // Validate request
    if (!participant) {
        return requestHandler.sendError(
            i18n.__('Missing params')
        )
    }
    try {
        let res = await CallDbGateway.checkCalling(participant);
        return requestHandler.sendSuccess(res);
    } catch( err) {
        return requestHandler.sendError(err.sqlMessage);
    }
}

exports.hasLogin = async (socket, message) => {
    let userSession = CallDbGateway.getParticipantById(socket.id);
    if (!userSession) return;
    if (Object.keys(message.data).length === 0) {
        userSession.hasLogin = {};
    } else if (message.data.email) {
        let email = message.data.email;
        let domain = CallHelper.getDomainFromEmail(email);
        userSession.hasLogin = {"domain": domain};
    }
}

exports.saveReasonReject = async (recordId, reasonId, reasonMessage, from, name) => {
    if (!recordId || !reasonId || !from || !name) return requestHandler.sendError(i18n.__("Missing params"));
    try {
        let res = await CallDbGateway.saveReasonReject(recordId, reasonId, reasonMessage, from, name);
        let userSessions = CallDbGateway.getParticipantByName(from);
        if (userSessions) {
            userSessions.forEach(function(userSession) {
                userSession.sendMessage({"id": "reasonRejectIncome", "from": name, "reasonId": reasonId, "reasonMessage": reasonMessage});
            })
        }
        return requestHandler.sendSuccess(res);
    } catch( err) {
        return requestHandler.sendError(err.sqlMessage);
    }
}

exports.saveToken = async (participant, token, platform, type) => {
    if (!participant || !token || !platform || !type) return requestHandler.sendError(i18n.__("Missing params"));
    if (type == "voip" && platform == "ios") {
        let response = {}
        // add device to voip
        let sendResultIos = await pushFunc.addDeviceWithVoip(token);
        if (sendResultIos["id"]) {
            response = await CallDbGateway.saveToken(participant, "ios", sendResultIos["id"], "voip");
        } else {
            return requestHandler.sendError(i18n.__("Token not valid"));
        }
        return requestHandler.sendSuccess(response);
    } else if (type == "notification" && platform == "ios") {
        // add device to push notification
        let addDeviceNotification = await pushFunc.addDeviceWithPushNotification(token);
        if (addDeviceNotification["id"]) {
            response = await CallDbGateway.saveToken(participant, "ios", addDeviceNotification["id"], "notification");
        } else {
            return requestHandler.sendError(i18n.__("Token not valid"));
        }
        return requestHandler.sendSuccess(response);
    }

    let response = await CallDbGateway.saveToken(participant, platform, token, type);
    return requestHandler.sendSuccess(response);
}

exports.initStartSocket = async () => {
    return await CallDbGateway.initStartSocket();
}