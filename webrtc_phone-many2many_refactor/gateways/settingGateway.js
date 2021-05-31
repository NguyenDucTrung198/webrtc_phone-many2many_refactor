const i18n = require('i18n')
const Logger = require('../helpers/logger');
const RequestHandler = require('../helpers/requestHandler');
const logger = new Logger();
const requestHandler = new RequestHandler(logger);

const SettingDbGateway = require("../gateways/databaseGateways/settingDbGateway.js");

exports.saveSettingsResponse = async (participant, audio, callSameDomain, receiveNotSameDomain, rejectNotLogin) => {
    let infoSetting = await SettingDbGateway.getSettingByName(participant);
    const setting = {
        participant: participant,
        audio: audio,
        call_same_domain: callSameDomain ? 1:0,
        receive_not_same_domain: receiveNotSameDomain?1:0,
        reject_not_login: rejectNotLogin?1:0
    };
    if (infoSetting) {
        let res = await SettingDbGateway.updateSettingByRecordId(infoSetting.id, setting);
        return requestHandler.sendSuccess(res);
    } else {
        let res = await SettingDbGateway.insertSetting(setting);
        return requestHandler.sendSuccess(res);
    }
}

exports.getSettingsResponse = async (participant) => {
    try {
        let infoSetting = await SettingDbGateway.getSettingByName(participant);
        return requestHandler.sendSuccess(infoSetting);
    } catch( err) {
        return requestHandler.sendError("error getSettingsResponse");
    }
}