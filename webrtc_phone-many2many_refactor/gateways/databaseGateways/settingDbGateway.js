const ModelParticipantSetting = require("../../models/participantSetting.js");

exports.getSettingByName = async (participant) => {
	return await ModelParticipantSetting.getSettingByName(participant);
}

exports.insertSetting = async (newSetting) => {
	return await ModelParticipantSetting.insertSetting(newSetting);
}

exports.updateSettingByRecordId  = async (recordId, newSetting) => {
	return await ModelParticipantSetting.updateSettingByRecordId(recordId, newSetting);
}
