const sql = require("../config/db.js");
const config = require('./../config/appConfig');

const _tableMain = 'room_main';

module.exports.inserRoomMain = async (roomName, caller, callee, titleCall="") => {
    return new Promise(function(resolve, reject) {
        let query = `INSERT INTO ${_tableMain}(room_name, caller, callee, title_call) VALUES ?`;
        let values = [
            [roomName, caller, callee, titleCall]
        ];
        sql.query(query, [values], function (err, result) {
            if (err) reject(err);
            resolve(result);
        })
    })
}

module.exports.updateStatusRoomMainById = async (recordId, status) => {
    return new Promise(function(resolve, reject) {
        let query = `UPDATE ${_tableMain}  SET status = "${status}" WHERE id=${recordId}`;
        sql.query(query, function (err, result) {
            if (err) reject(err);
            resolve(result);
        })
    })
}