const mysql = require("mysql");
const config = require('./appConfig');

var connection = mysql.createPool({
	host: config.db.host,
	user: config.db.username,
	password: config.db.password,
	database: config.db.database
});

module.exports = connection;