const conn = require("../config/db.js");
//const config = require('./../config/appConfig');

const _tableMain = 'participant_setting';

class ParticipantSetting {
	constructor(setting) {
		this.participant = setting.participant;
		this.audio = setting.audio || 1;
		this.call_same_domain = setting.call_same_domain || 0;
		this.receive_not_same_domain = setting.receive_not_same_domain || 0;
		this.reject_not_login = setting.reject_not_login || 0;
	}
	static async getAll(participant = []) {
		return new Promise(function (resolve, reject) {
			let query = `SELECT * FROM ${_tableMain} WHERE participant IN (?)`;
			conn.query(query, [participant], function (err, result) {
				if (err)
					reject(err);
				resolve(result);
			});
		});
	}
	static async getSettingByName(participant) {
		return new Promise((resolve, reject) => {
			conn.query(`SELECT * FROM ${_tableMain} WHERE participant = "${participant}"`, (error, elements) => {
				if (error) {
					return reject(error);
				}
				return resolve(elements[0]);
			});
		});
	}
	static async insertSetting(newSetting) {
		return new Promise((resolve, reject) => {
			conn.query(`INSERT INTO ${_tableMain} SET ?`, newSetting, (err, res) => {
				if (err) {
					return reject(err);
				}
				return resolve({ id: res.insertId, ...newSetting });
			});
		});
	}
	static async updateSettingByRecordId(recordId, newSetting) {
		return new Promise((resolve, reject) => {
			conn.query(`UPDATE ${_tableMain} SET ? WHERE id = ?`,
				[newSetting, recordId],
				(err, res) => {
					if (err) {
						return reject(err);
					}
					if (res.affectedRows == 0) {
						return resolve({ message: "not found" });
					}
					return resolve({ id: recordId, ...newSetting });
				}
			);
		});
	}
}

module.exports = ParticipantSetting;
