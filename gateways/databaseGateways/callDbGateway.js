const conn = require("../../config/db.js");
const _tableRoomMain = 'room_main';
const _tableRoomContent = 'room_content';
//const config = require("../../config/appConfig.js");

const ModelRoomContent = require("../../models/roomContent.js");
const ModelRoomMain = require("../../models/roomMain.js");
const ModelParticipant = require("../../models/participant.js");
const ModelParticipantSetting = require("../../models/participantSetting.js");
const ModelParticipantToken = require("../../models/participantToken.js");

exports.register = (socket, name) => {
    return ModelParticipant.register(socket, name);
}

exports.getParticipantById = (socketId) => {
    return ModelParticipant.getById(socketId);
}

exports.getParticipantByName = (name) => {
    return ModelParticipant.getByName(name);
}

exports.getRoomContent = async (recordId) => {
    return await ModelRoomContent.getRoomContent(recordId);
}

exports.insertRoomContent = async (roomId, participant, status) => {
    return await ModelRoomContent.insertRoomContent(roomId, participant, status);
}

exports.inserRoomMain = async (roomName, callerStr, calleeStr, titleCall) => {
    return await ModelRoomMain.inserRoomMain(roomName, callerStr, calleeStr, titleCall);
}

exports.updateStatusRoomMainById = async (recordId, status) => {
    return await ModelRoomMain.updateStatusRoomMainById(recordId, status);
}

exports.setStatusRoomContent = async (recordId, status) => {
    return await ModelRoomContent.setStatusRoomContent(recordId, status);
}

exports.updateRoomContent = async (recordId, status) => {
    return await ModelRoomContent.updateRoomContent(recordId, status);
}

exports.getRoomContentByParticipantAndStatus = async (participant, status="accept") => {
    return await ModelRoomContent.getRoomContentByParticipantAndStatus(participant, status);
}

exports.updateStatusByStatusAndRoomId = async (oldStatus, newStatus, roomId) => {
    return await ModelRoomContent.updateStatusByStatusAndRoomId(oldStatus, newStatus, roomId)
}

exports.participantSettingGetAll = async (participant=[]) => {
    return await ModelParticipantSetting.getAll(participant);
}

exports.checkCalling = async (participant) => {
    return new Promise( function (resolve, reject) {
        let query = `SELECT rct.id, rm.room_name, rm.caller, rct.participant, rct.status as status_rct, rm.status as status_rm 
                        FROM room_content as rct inner join room_main as rm 
                        ON rct.room_id = rm.id 
                        WHERE (rct.status = 'calling' OR rm.status = 'calling' OR (rm.status = 'talking' AND rct.status <> 'accept')) AND rct.participant = "${participant}" order by rct.id desc LIMIT 1`;
        conn.query(query, function (err, result) {
            if (err) reject(err);
            resolve(result);
        })
    })
}

exports.saveReasonReject = async (recordId, reasonId, reasonMessage="") => {
    return await ModelRoomContent.updateReasonRejectByRecordId(recordId, reasonId, reasonMessage);
}

exports.saveToken = async (participant, platform, token, type) => {
    return await ModelParticipantToken.saveToken(participant, platform, token, type);
}

exports.initStartSocket = async () => {
    let query1 = `UPDATE ${_tableRoomMain} SET status = 'end' WHERE (status='talking' OR status = 'calling')`;
    conn.query(query1, function (err, result) {
        
    })
    let query2 = `UPDATE ${_tableRoomContent} SET status = 'no_response' WHERE (status='calling')`;
    conn.query(query2, function (err, result) {
        
    })
    let query3 = `UPDATE ${_tableRoomContent} SET status = 'end' WHERE (status='accept')`;
    conn.query(query3, function (err, result) {
        
    })
}