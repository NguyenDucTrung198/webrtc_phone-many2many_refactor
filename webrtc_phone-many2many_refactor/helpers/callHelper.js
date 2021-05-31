const config = require('./../config/appConfig');
const kurento = require("kurento-client");
const ModelParticipant = require("../models/participant");
let rooms = {};
exports.rooms = rooms

var getArrayPeer = exports.getArrayPeer = (to="") => {
    let to_str = (to).replace(/、/g, ",");
    return to_str.split(",");
}

exports.genRoomName = (from="", to="") => {
    let targetArr = [];
    targetArr.push((from).trim());
    let toArr = getArrayPeer(to);
    toArr.forEach(function(v) {
        if (!targetArr.includes(v)) {
            targetArr.push(v.trim());
        }
    })
    targetArr = targetArr.sort();
    return targetArr.join();
}

exports.getDomainFromEmail = (email = "") => {
    email = email.toLowerCase();
    return email.substring(email.lastIndexOf("@") +1);
}

/**
 * getKurento Client
 * 
 * @param {function} callback 
 */
 function getKurentoClient(callback) {
    kurento(config.app.kurentoWsUri, (error, kurentoClient) => {
        if (error) {
            let message = `Could not find media server at address ${wsUrl}`;
            return callback(`${message} . Exiting with error ${error}`);
        }
        callback(null, kurentoClient);
    });
}

/**
 * Get room. Creates room if room does not exists
 * 
 * @param {string} roomName 
 * @param {function} callback 
 */
 var getRoom = function (roomName, callback) {
    let room = rooms[roomName];

    if (room == null) {
        console.log(`create new room : ${roomName}`);
        getKurentoClient((error, kurentoClient) => {
            if (error) {
                return callback(error);
            }

            kurentoClient.create('MediaPipeline', (error, pipeline) => {
                if (error) {
                    return callback(error);
                }
                room = {
                    name: roomName,
                    creator: "",
                    pipeline: pipeline,
                    participants: {},
                    kurentoClient: kurentoClient
                };

                rooms[roomName] = room;
                callback(null, room);
            });
        });
    } else {
        console.log(`get existing room : ${roomName}`);
        callback(null, room, 1);
    }
}

/**
 * join call room
 * 
 * @param {*} socket 
 * @param {*} room 
 * @param {*} userName 
 * @param {*} callback 
 */
 var join = function (socket, room, callback, enableVideo=0) {
    /*
    // add user to session
    let userSession = new Session(socket, userName, room.name);

    // register
    userRegister.register(userSession);
    */
    let userSession = ModelParticipant.getById(socket.id);
    if (!userSession) {
        console.log( "ERR: Not found userSession");
        return false;
    }
    userSession.roomName = room.name;
    room.pipeline.create('WebRtcEndpoint', (error, outgoingMedia) => {
        if (error) {
            console.error('no participant in room');
            if (Object.keys(room.participants).length === 0) {
                room.pipeline.release();
            }
            return callback(error);
        }

        // else
        // outgoingMedia.setMaxVideoRecvBandwidth(300);
        // outgoingMedia.setMinVideoRecvBandwidth(100);
        userSession.setOutgoingMedia(outgoingMedia);
    

        // add ice candidate the get sent before endpoint is established
        // socket.id : room iceCandidate Queue
        let iceCandidateQueue = userSession.iceCandidateQueue[userSession.name];
        if (iceCandidateQueue) {
            while (iceCandidateQueue.length) {
                let message = iceCandidateQueue.shift();
                console.error(`user: ${userSession.id} collect candidate for outgoing media`);
                userSession.outgoingMedia.addIceCandidate(message.candidate);
            }
        }

        // ICE 
        // listener
        userSession.outgoingMedia.on('OnIceCandidate', event => {
            // ka ka ka ka ka
            // console.log(`generate outgoing candidate ${userSession.id}`);
            let candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
            userSession.sendMessage({
                id: 'iceCandidate',
                name: userSession.name,
                candidate: candidate
            });
        });

         
         let usersInRoom = room.participants;


        // notify other user that new user is joing
        for (let i in usersInRoom) {
            if (usersInRoom[i].name != userSession.name) {
                usersInRoom[i].sendMessage({
                    id: 'newParticipantArrived',
                    name: userSession.name,
                    roomName: userSession.roomName
                });
            }
        }


        // send list of current user in the room to current participant
        let existingUsers = [];
        for (let i in usersInRoom) {
            if (usersInRoom[i].name != userSession.name) {
                existingUsers.push(usersInRoom[i].name);
            }
        }
        userSession.sendMessage({
            id: 'existingParticipants',
            data: existingUsers,
            roomName: room.name,
            enableVideo: enableVideo
        });

        // Creator room
        if (Object.keys(room.participants).length == 0) {
            room.creator = userSession
        }
        // register user to room
        room.participants[userSession.name] = userSession;

        callback(null, userSession);
    });
}

/**
 * 
 * @param {*} socket 
 * @param {*} message 
 * @param {*} callback 
 */
 var joinRoom = exports.joinRoom = (socket, message, callback) => {

    // get room 
    getRoom(message.roomName, (error, room, exist) => {
        if (error) {
            callback(error);
            return;
        }
        
        // join user to room
        join(socket, room, (err, user) => {
            console.log(`join success : ${user.name}`);
            if (err) {
                callback(err);
                return;
            }
            if (exist) {
                let userSession = ModelParticipant.getById(socket.id);
                userSession.sendMessage({
                    id: 'existRoom',
                    roomName: message.roomName
                })
            }
            callback(null, exist);
        });
    });
}

/**
 * 
 * @param {*} userSession 
 * @param {*} sender 
 * @param {*} callback 
 */
 var getEndpointForUser = exports.getEndpointForUser = (userSession, sender, callback) => {

    if (userSession.name === sender.name) { 
        return callback(null, userSession.outgoingMedia);
    }

    let incoming = userSession.incomingMedia[sender.name];
    
    if (incoming == null) {
        console.log(`user : ${userSession.id} create endpoint to receive video from : ${sender.id}`);
        getRoom(userSession.roomName, (error, room) => {
            if (error) {
                console.error('error89x: ' + error);
                callback(error);
                return;
            }
            room.pipeline.create('WebRtcEndpoint', (error, incoming) => {
                if (error) {
                    if (Object.keys(room.participants).length === 0) {
                        room.pipeline.release();
                    }
                    console.error('error901: ' + error);
                    callback(error);
                    return;
                }

                console.log(`user: ${userSession.name} successfully create pipeline`);
                incoming.setMaxVideoRecvBandwidth(300);
                incoming.setMinVideoRecvBandwidth(100);
                userSession.incomingMedia[sender.name] = incoming;
                

                // add ice candidate the get sent before endpoints is establlished
                let iceCandidateQueue = userSession.iceCandidateQueue[sender.name];
                if (iceCandidateQueue) {
                    while (iceCandidateQueue.length) {
                        let message = iceCandidateQueue.shift();
                        console.log(`user: ${userSession.name} collect candidate for ${message.data.sender}`);
                        incoming.addIceCandidate(message.candidate);
                    }
                }

                incoming.on('OnIceCandidate', event => {
                    // ka ka ka ka ka
                    // console.log(`generate incoming media candidate: ${userSession.id} from ${sender.id}`);
                    let candidate = kurento.register.complexTypes.IceCandidate(event.candidate);
                    userSession.sendMessage({
                        id: 'iceCandidate',
                        name: sender.name,
                        candidate: candidate
                    });
                });
                if (!sender.outgoingMedia) return;
                sender.outgoingMedia.connect(incoming, error => {
                    if (error) {
                        console.error('error93x: ' + error);
                        //console.log(error);
                        callback(error);
                        return;
                    }
                    callback(null, incoming);
                });
            });
        })
    } else {
        if (!sender.outgoingMedia) return;
        console.log(`user: ${userSession.name} get existing endpoint to receive video from: ${sender.name}`);
        sender.outgoingMedia.connect(incoming, error => {
            if (error) {
                callback(error);
            }
            //callback(null, incoming);
        });
    }
}

/**
 * receive video from sender
 * 
 * @param {*} socket 
 * @param {*} senderName 
 * @param {*} sdpOffer 
 * @param {*} callback 
 */
 var receiveVideoFrom = exports.receiveVideoFrom = (socket, senderName, sdpOffer, callback) => {
    let userSession = ModelParticipant.getById(socket.id);
    let senders = ModelParticipant.getByName(senderName);
    senders.forEach(function(sender) {
        getEndpointForUser(userSession, sender, (error, endpoint) => {
            if (error) {
                console.error(error);
                callback(error);
            }
    
            endpoint.processOffer(sdpOffer, (error, sdpAnswer) => {
                console.log(`process offer from ${sender.name} to ${userSession.name}`);
                if (error) {
                    return callback(error);
                }
                let data = {
                    id: 'receiveVideoAnswer',
                    name: sender.name,
                    sdpAnswer: sdpAnswer
                };
                userSession.sendMessage(data);
    
                endpoint.gatherCandidates(error => {
                    if (error) {
                        return callback(error);
                    }
                });
    
                return callback(null, sdpAnswer);
            });
        });
    })
}

/**
 *  Add ICE candidate, required for WebRTC calls
 * 
 * @param {*} socket 
 * @param {*} message 
 * @param {*} callback 
 */
 var addIceCandidate = exports.addIceCandidate = (socket, message, callback) => {
    let user = ModelParticipant.getById(socket.id);
    if (user != null) {
        // assign type to IceCandidate
        let candidate = kurento.register.complexTypes.IceCandidate(message.candidate);
        user.addIceCandidate(message, candidate);
        callback();
    } else {
        console.error(`ice candidate with no user receive : ${message.sender}`);
        callback(new Error("addIceCandidate failed"));
    }
}