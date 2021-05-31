const conn = require("../../config/db.js");
const _tableRoomContent = 'room_content';
const _tableMain = 'participant_room_favorite';
//const config = require("../../config/appConfig.js");

//const ModelRoomContent = require("../../models/roomContent.js");
const ModelParticipantRoomFavorite = require("../../models/participantRoomFavorite.js");

module.exports.getListFavorites = async (participant, page=1) => {
    return await ModelParticipantRoomFavorite.getListByParticipant(participant, page);
}

module.exports.getTotalPageFavorites = async (participant) => {
    return await ModelParticipantRoomFavorite.countPageByParticipant(participant);
}

module.exports.updateFavorite = async (recordId, favorite) => {
	return await ModelParticipantRoomFavorite.updateFavorite(recordId, favorite);
}

module.exports.deleteFavorite = async (recordId, name, roomName) => {
	return new Promise((resolve, reject)=>{
		let sqlUpdateFv = `UPDATE ${_tableRoomContent} set favorite = NULL WHERE participant = "${name}" AND favorite="${roomName}"`;
		conn.query(sqlUpdateFv, (err, res) => {
			if (err) {
				return reject(err);
			}
			let sqlDelete = `DELETE FROM ${_tableMain} WHERE id = ${recordId}`;
			conn.query(sqlDelete, (err1, res1) => {
				if (err1) {
					return reject(err1);
				}
				return resolve({ id: recordId });
			})
		})
	})
}