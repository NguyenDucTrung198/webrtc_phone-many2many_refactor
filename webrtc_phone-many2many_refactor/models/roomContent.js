const conn = require("../config/db.js");
const config = require('./../config/appConfig');

const _tableMain = 'room_content';


class RoomContent {
    constructor(roomContent) {
		this.participant = roomContent.participant;
		this.room_id = roomContent.roomId;
		this.status = roomContent.status;
	}

    static async insertRoomContent (roomId, participant, status) {
        let datetime = new Date();
        let dateS = datetime.toISOString().slice(0,10);
        let start_datetime = null;
        return new Promise( function (resolve, reject) {
            if (status == "accept") {
                start_datetime = new Date();
            }
            
            let query = "INSERT INTO room_content(room_id, participant, status, start_date, start_datetime) VALUES ?";
            let values = [
                [roomId, participant, status, dateS, start_datetime]
            ];
            conn.query(query, [values], function (err, result) {
                if (err) reject(err);
                resolve(result);
            })
        })
    }
    
    static async getRoomContent (recordId) {
        return new Promise( function (resolve, reject) {
            let query = `SELECT * FROM ${_tableMain} WHERE id = ${recordId}`;
            conn.query(query, function (err, result) {
                if (err) reject(err);
                resolve(result[0]);
            })
        })
    }
    
    static async setStatusRoomContent (recordId, status) {
        return new Promise( function (resolve, reject) {
            let query = `UPDATE ${_tableMain} SET status = "${status}"  WHERE id=${recordId}`;
            conn.query(query, function (err, result) {
                if (err) reject(err);
                resolve(result);
            })
        })
    }
    
    static async updateRoomContent (recordId, status) {
        if (status == "reject" || status == "no_response" || status == "busy") {
            return new Promise( function (resolve, reject) {
                let query = `UPDATE room_content SET status = "${status}" WHERE id= ${recordId}`;
                conn.query(query, function (err, result) {
                    if (err) reject(err);
                    resolve(result);
                });
            })
        } else if (status == "accept") {
            return new Promise( function (resolve, reject) {
                let query = `UPDATE ${_tableMain} SET start_datetime = NOW(), status = "${status}" WHERE id=${recordId}`;
                conn.query(query, function (err, result) {
                    if (err) reject(err);
                    resolve(result);
                });
            })
        } else if (status == "end") {
            return new Promise( function (resolve, reject) {
                conn.query(`SELECT * FROM ${_tableMain} WHERE id = ${recordId}`, function (err, result) {
                    if (err) reject(err);
                    if (!result.length) return;
                    let oldStatus = result[0].status;
                    let oldStartDatetime = result[0].start_datetime;
                    let startDatetime = result[0].start_datetime;
                    let roomId = result[0].room_id
    
                    let newStatus = "";
                    if (oldStatus == "accept") {
                        newStatus = "end";
                    } else if (oldStatus == "calling") {
                        if (oldStartDatetime) {
                            newStatus = "reject";
                        } else {
                            let tmpStatus = [];
                            conn.query(`SELECT * FROM ${_tableMain} WHERE room_id = ${roomId} AND id <> ${recordId}`, function (err, rs1) {
                                rs1.forEach(function(v1) {
                                    if (!tmpStatus.includes(v1.status)) {
                                        tmpStatus.push(v1.status);
                                    }
                                })
                                if (!tmpStatus.length) return;
                                if (tmpStatus.length == 1) {
                                    newStatus = "all_"+tmpStatus[0];
                                } else if (tmpStatus.length > 1) {
                                    if (tmpStatus.includes("reject")) {
                                        newStatus = "has_reject";
                                    } else if (tmpStatus.includes("busy")) {
                                        newStatus = "has_busy";
                                    } else if (tmpStatus.includes("no_response")) {
                                        newStatus = "has_no_response";
                                    } else {
                                        newStatus = "reject";
                                    }
                                }
                                let query = `UPDATE ${_tableMain} SET status = "${newStatus}" WHERE id= ${recordId}`;
                                conn.query(query, function (err, resultU) {
                                    if (err) reject(err);
                                    resolve(resultU);
                                });
                                return;
                            })
                        }
                    }
    
                    if (newStatus) {
                        let datetime = new Date();
                        let totalTime = Math.floor((datetime-startDatetime)/1000);
                        let query = `UPDATE ${_tableMain} SET end_datetime = NOW(), total_time ="${parseInt(totalTime)}", status = "${newStatus}" WHERE id=${recordId}`;
                        conn.query(query, function (err, resultU) {
                            if (err) reject(err);
                            resolve(resultU);
                        });
                    }
                })
            })
        }
    }
    
    static async getRoomContentByParticipantAndStatus (participant, status="accept") {
        return new Promise( function (resolve, reject) {
            let query = `SELECT * FROM ${_tableMain} WHERE participant= "${participant}"  AND status= "${status}" ORDER BY id DESC`;
            conn.query(query, function (err, result) {
                if (err) reject(err);
                resolve(result);
            })
        })
    }
    
    static async updateStatusByStatusAndRoomId (oldStatus, newStatus, roomId) {
        return new Promise( function (resolve, reject) {
            let query = `UPDATE ${_tableMain} SET status = "${newStatus}"  WHERE status= "${oldStatus}" AND room_id =${roomId}`;
            conn.query(query, function (err, result) {
                if (err) reject(err);
                resolve(result);
            })
        })
    }
    
    static async getTotalPageByParticipant (participant) {
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
    
    static async getReasonByRoom (room=[]) {
        return new Promise((resolve, reject)=> {
            conn.query(`SELECT room_id,participant,reject_reason_id,reject_reason_message FROM ${_tableMain} WHERE room_id IN (?) AND reject_reason_id > 0`, [room], (error, elements)=>{
                if(error){
                    return reject(error);
                }
                return resolve(elements);;
            });
        })
    }
    
    static async updateFavoriteByRecordId (recordId, favorite = "NULL") {
        if (favorite != "NULL") {
            favorite = `"${favorite}"`;
        } 
        return new Promise((resolve, reject)=> {
            let xxx = conn.query(`UPDATE ${_tableMain} SET favorite = ${favorite} WHERE id = ${recordId}`, (error, elements)=>{
                //console.log(xxx.sql)
                if(error){
                    return reject(error);
                }
                return resolve(elements);;
            });
        })
    }
    
    static async countParticipantFavoriteByRoomName (participant, roomName) {
        return new Promise((resolve, reject)=> {
            conn.query(`SELECT COUNT(*) as total FROM ${_tableMain} WHERE participant = "${participant}" AND favorite="${roomName}"`, (error, elements)=>{
                if(error){
                    return reject(error);
                }
                return resolve(elements[0]);;
            });
        })
    }

    static async updateReasonRejectByRecordId(recordId, reasonId, reasonMessage="") {
        return new Promise((resolve, reject)=> {
            let sql = `UPDATE ${_tableMain} SET reject_reason_id = ${reasonId}, reject_reason_message = "${reasonMessage}"  WHERE id = ${recordId}`;
            conn.query(sql, (error, elements)=>{
                if(error){
                    return reject(error);
                }
                return resolve(elements);;
            });
        })
    }
}


module.exports = RoomContent;
