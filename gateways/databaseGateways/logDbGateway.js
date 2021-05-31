const conn = require("../../config/db.js");
const config = require("../../config/appConfig.js");

const ModelRoomContent = require("../../models/roomContent.js");
const ModelParticipantRoomFavorite = require("../../models/participantRoomFavorite.js");

const _tableRoomContent = 'room_content';
const _tableRoomMain = 'room_main';

module.exports.getLogsByPaticipant = async (participant, page=1) => {
    return new Promise( function (resolve, reject) {
        let startRecord = (page-1)*config.app.recordPerPage;
        let query = `SELECT rct.*, rm.caller, rm.callee, rm.room_name FROM ${_tableRoomContent} as rct INNER JOIN ${_tableRoomMain} as rm ON rct.room_id = rm.id WHERE participant = "${participant}" order by rct.id desc LIMIT ${startRecord},${config.app.recordPerPage}`;
        conn.query(query, [participant], function (err, result) {
            if (err) reject(err);
            resolve(result);
        })
    })
}

module.exports.getTotalPageLogs = async (participant) => {
    return await ModelRoomContent.getTotalPageByParticipant(participant);
}

module.exports.getReasonByRoom = async (room=[]) => {
	return await ModelRoomContent.getReasonByRoom(room);
}

module.exports.updateFavoriteLogByRecordId = async (recordId, favorite = "NULL") => {
    return await ModelRoomContent.updateFavoriteByRecordId(recordId, favorite);
}

module.exports.countParticipantFavoriteByRoomName = async (participant, roomName) => {
    return await ModelRoomContent.countParticipantFavoriteByRoomName(participant, roomName);
}

module.exports.delParticipantFavoriteByRoomName = async (participant, roomName) => {
	return await ModelParticipantRoomFavorite.delRecordByParticipantAndRoomName(participant, roomName);
}

module.exports.countParticipantFavorite = async (participant, roomName) => {
	return await ModelParticipantRoomFavorite.countRecordByParticipantAndRoom(participant, roomName);
}

module.exports.insertParticipantFavorite = async (participant, roomName) => {
	return await ModelParticipantRoomFavorite.insertParticipantFavorite(participant, roomName);
}