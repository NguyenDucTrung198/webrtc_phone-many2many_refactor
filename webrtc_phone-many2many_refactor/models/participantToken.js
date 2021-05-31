const conn = require("../config/db.js");
const config = require('./../config/appConfig');

const _tableMain = 'participant_notification_token';

async function deleteToken (token) {
    return new Promise( function (resolve, reject) {
        let query = `UPDATE ${_tableMain} SET in_use = 0 WHERE token ="${token}"`;
        conn.query(query, function (err, result) {
            if (err) reject(err);
            resolve(result);
        })
    })
}

async function getTokenByParticipant (participant) {
    return new Promise( function (resolve, reject) {
        let query = `SELECT * FROM  ${_tableMain} WHERE participant ="${participant}" AND in_use = 1`;
        conn.query(query, function (err, result) {
            if (err) reject(err);
            resolve(result);
        })
    })
}

async function getRecordByToken (token, platform, type) {
    return new Promise( function (resolve, reject) {
        let query = `SELECT * FROM ${_tableMain} WHERE platform=? AND token=? AND type=?`;
        conn.query(query, [platform, token, type],function (err, result) {
            if (err) reject(err);
            resolve(result[0]);
        })
    })
}

function updateInuseById (participant, recordId) {
    return new Promise( function (resolve, reject) {
        let query = `UPDATE ${_tableMain} SET participant = ?, in_use = 1 WHERE id = ?`;
        conn.query(query, [participant, recordId],function (err, result) {
            if (err) reject(err);
            resolve(result);
        })
    })
}

function insertToken (dataToken) {
    return new Promise( function (resolve, reject) {
        let query = `INSERT INTO ${_tableMain} SET ?`;
        conn.query(query, dataToken,function (err, result) {
            if (err) reject(err);
            resolve(result);
        })
    })
}

async function saveToken (participant, platform, token, type) {
    return new Promise( async function (resolve, reject) {
        let dataToken = await getRecordByToken(token, platform, type);
        if (dataToken) {
            await updateInuseById(participant, dataToken.id);
            resolve(dataToken);
            return;
        }
        let dataInst = {
            "participant": participant,
            "type": type,
            "token": token,
            "platform": platform
        }
        await insertToken(dataInst);
        resolve(dataInst);
        return;
    })
    
}


module.exports.deleteToken = deleteToken;
module.exports.getTokenByParticipant = getTokenByParticipant;
module.exports.getRecordByToken = getRecordByToken;
module.exports.saveToken = saveToken;
module.exports.updateInuseById = updateInuseById;