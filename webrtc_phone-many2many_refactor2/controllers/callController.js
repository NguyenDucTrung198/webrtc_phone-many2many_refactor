const CallGateway = require("../gateways/callGateway");
//const { response } = require("express");

exports.index = async (req, res) => {
	res.render('call', {});
};

exports.register = async (socket, message) => {
    await CallGateway.registerResponse(socket, message);
}

exports.call = async (socket, message) => {
    await CallGateway.call(socket, message);
}

exports.incomingCallResponse = async (socket, message) => {
    await CallGateway.incomingCallResponse(socket, message);
}

exports.receiveVideoFrom = async (socket, message) => {
    await CallGateway.receiveVideoFrom(socket, message.sender, message.sdpOffer);
}

exports.leaveRoom = async (socket) => {
    await CallGateway.leaveRoomResponse(socket);
}

exports.addIceCandidate = async (socket, message) => {
    await CallGateway.addIceCandidate(socket, message);
}

exports.startCalling = async (socket, message) => {
    await CallGateway.startCalling(socket, message);
}

exports.reJoinRoom = async (socket, message) => {
    await CallGateway.reJoinRoom(socket, message);
}

exports.checkCalling = async (req, res) => {
    let participant = req.body.participant;
    let {status, dataResponse} = await CallGateway.checkCalling(participant);
    res.status(status).send(dataResponse);
}

exports.hasLogin = async (socket, message) => {
    await CallGateway.hasLogin(socket, message);
}

exports.saveReasonReject = async (req, res) => {
    let recordId = parseInt(req.body.recordId);
    let reasonId = parseInt(req.body.reasonId);
    let reasonMessage = "";
    if (req.body.reasonMessage) {
        reasonMessage = (req.body.reasonMessage).trim();
    }
    let from = req.body.from;
    let name = req.body.name;
    let {status, dataResponse} = await CallGateway.saveReasonReject(recordId, reasonId, reasonMessage, from, name);
    res.status(status).send(dataResponse);
}

exports.saveToken = async (req, res) => {
    let participant = req.body.participant;
    let platform = req.body.platform;
    let token = req.body.token;
    let type = req.body.type || "notification";
    let {status, dataResponse} = await CallGateway.saveToken(participant, token, platform, type);
    res.status(status).send(dataResponse);
}

exports.initStartSocket = async () => {
    await CallGateway.initStartSocket();
}