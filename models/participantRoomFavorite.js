const conn = require("../config/db.js");
const config = require('./../config/appConfig');

const _tableMain = 'participant_room_favorite';

class ParticipantRoomFavorite {
    constructor(data) {
		this.participant = data.participant;
		this.room_name = data.room_name;
	}

    static async delRecordByParticipantAndRoomName (participant, roomName) {
        return new Promise((resolve, reject)=> {
            conn.query(`DELETE FROM ${_tableMain} WHERE participant = "${participant}" AND room_name="${roomName}"`, (error, elements)=>{
                if(error){
                    return reject(error);
                }
                return resolve(elements);;
            });
        })
    }
    
    static async countRecordByParticipantAndRoom (participant, roomName) {
        return new Promise((resolve, reject) => {
            let xxy = conn.query(`SELECT COUNT(*) as total FROM ${_tableMain} WHERE participant = "${participant}" AND room_name="${roomName}"`, (error, elements)=>{
                //console.log (xxy.sql)
                if(error){
                    return reject(error);
                }
                return resolve(elements[0]);;
            });
        })
    }

    static async countPageByParticipant(participant) {
        let recordPerPage = config.app.recordPerPage;
        return new Promise((resolve, reject)=> {
            conn.query(`SELECT COUNT(*) as total FROM ${_tableMain} WHERE participant ="${participant}"`,  (error, elements)=>{
                if(error){
                    return reject(error);
                }
                return resolve(Math.ceil(elements[0].total/recordPerPage));
            });
        })
    }

    static async insertParticipantFavorite (participant, roomName) {
        return new Promise((resolve, reject)=> {
            let xxz = conn.query(`INSERT INTO ${_tableMain} (participant, room_name) VALUES (?)`, [[participant, roomName]], (error, elements)=>{
                //console.log(xxz.sql);
                if(error){
                    return reject(error);
                }
                return resolve(elements);;
            });
        })
    }

    static async getListByParticipant (participant, page=1) {
        let recordPerPage = config.app.recordPerPage;
        let startRecord = (page-1)*recordPerPage;
        return new Promise((resolve, reject)=> {
            conn.query(`SELECT * FROM ${_tableMain} WHERE participant = "${participant}" ORDER BY priority DESC,updated_date DESC LIMIT ${startRecord},${recordPerPage}`,  (error, elements)=>{
                if(error){
                    return reject(error);
                }
                return resolve(elements);
            });
        })
    }

    static async updateFavorite (recordId, favorite) {
        return new Promise((resolve, reject)=>{
            conn.query(`UPDATE ${_tableMain} SET ? WHERE id = ?`,
                [favorite, recordId],
                (err, res) => {
                    if (err) {
                        return reject(err);
                    }
            
                    if (res.affectedRows == 0) {
                        return resolve({ message: "not found" });
                    }
                    return resolve({ id: recordId, ...favorite });
                }
            );
        })
    }
}

module.exports = ParticipantRoomFavorite;