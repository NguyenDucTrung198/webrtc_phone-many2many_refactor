const SettingGateway = require("../gateways/settingGateway");
//const { response } = require("express");

// Create and Save a new Customer
exports.index = async (req, res) => {
	res.render('setting', {});
};

exports.saveSettings = async (req, res) => {
    let name = req.body.name;
    let audio = parseInt(req.body.audio);
    let callSameDomain = req.body.callSameDomain ? 1:0;
    let receiveNotSameDomain = req.body.receiveNotSameDomain ? 1:0;
    let rejectNotLogin = req.body.rejectNotLogin ? 1:0;
    let {status, dataResponse} = await SettingGateway.saveSettingsResponse(name, audio, callSameDomain, receiveNotSameDomain, rejectNotLogin);
	res.status(status).send(dataResponse);
}

exports.getSettings = async (req, res) => {
    let name = req.query.name;
    let {status, dataResponse} = await SettingGateway.getSettingsResponse(name);
    console.log(dataResponse)
	res.status(status).send(dataResponse);
}