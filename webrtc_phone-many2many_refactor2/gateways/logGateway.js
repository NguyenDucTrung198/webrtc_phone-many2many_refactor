const i18n = require('i18n')
const Logger = require('../helpers/logger');
const RequestHandler = require('../helpers/requestHandler');
const logger = new Logger();
const requestHandler = new RequestHandler(logger);

const LogDbGateway = require("../gateways/databaseGateways/logDbGateway.js");


exports.getCallLogsResponse = async (participant, page) => {
    try {
        let listData = await LogDbGateway.getLogsByPaticipant(participant, page);
        let roomArray = [];
        listData.forEach(function(v){
            if (!roomArray.includes(v.room_id)) {
                roomArray.push(v.room_id);
            }
        })
        let reasonReject = await LogDbGateway.getReasonByRoom(roomArray);
        let recordInRoom = {};
        reasonReject.forEach(function (item) {
            if (!recordInRoom[item.room_id]) {
                recordInRoom[item.room_id] = [];
            }
            (recordInRoom[item.room_id]).push(item);
        })
        let totalPage = await LogDbGateway.getTotalPageLogs(participant);
        let dataResponse = {
            "list": listData,
            "total": totalPage,
            "record_room": recordInRoom
        }
        return requestHandler.sendSuccess(dataResponse);
    } catch( err) {
        return requestHandler.sendError(err);
    }
}

exports.saveFavorite = async (name, roomName, recordId, remove=false) => {
    try {
        if (remove) {
            await LogDbGateway.updateFavoriteLogByRecordId(recordId);
            let dataCheckParticipantFavorite = await LogDbGateway.countParticipantFavoriteByRoomName(name, roomName);
            if (dataCheckParticipantFavorite.total == 0) {
                await LogDbGateway.delParticipantFavoriteByRoomName(name, roomName);
            }
            return requestHandler.sendSuccess();
        } else {
            await LogDbGateway.updateFavoriteLogByRecordId(recordId, roomName);
            let dataCheckParticipantFavorite = await LogDbGateway.countParticipantFavorite(name, roomName);
            if (dataCheckParticipantFavorite.total == 0) {
                await LogDbGateway.insertParticipantFavorite(name, roomName);
            }
            return requestHandler.sendSuccess();
        }
    } catch( err) {
        return requestHandler.sendError(err);
    }
}