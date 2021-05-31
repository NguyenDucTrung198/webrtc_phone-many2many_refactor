const LogGateway = require("../gateways/logGateway");
//const { response } = require("express");

// Create and Save a new Customer
exports.index = async (req, res) => {
	res.render('logs', {});
};

exports.getCallLogs = async (req, res) => {
    let name = req.body.callname;
    let page = parseInt(req.body.page);
    let {status, dataResponse} = await LogGateway.getCallLogsResponse(name, page);
	res.status(status).send(dataResponse);
}

exports.saveFavorite = async (req, res) => {
    let roomName = req.body.roomName;
    let recordId = req.body.recordId;
    let name = req.body.name;
    let remove = req.body.remove;
    let {status, dataResponse} = await LogGateway.saveFavorite(name, roomName, recordId, remove);
	res.status(status).send(dataResponse);
}
