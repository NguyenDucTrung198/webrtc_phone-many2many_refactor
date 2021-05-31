var eventBus = require('../helpers/event.js').eventBus;

const callController = require("../controllers/callController");
eventBus.on("initStartSocket", () => {
    callController.initStartSocket();
})

eventBus.on("register", (socket, message) => {
    callController.register(socket, message);
})
eventBus.on("call", (socket, message) => {
    callController.call(socket, message);
})
eventBus.on("incomingCallResponse", (socket, message) => {
    callController.incomingCallResponse(socket, message);
})
eventBus.on("receiveVideoFrom", (socket, message) => {
    callController.receiveVideoFrom(socket, message);
})
eventBus.on("leaveRoom", (socket, message) => {
    callController.leaveRoom(socket, message);
})
eventBus.on("onIceCandidate", (socket, message) => {
    callController.addIceCandidate(socket, message);
})
eventBus.on("startCalling", (socket, message) => {
    callController.startCalling(socket, message);
})
eventBus.on("reJoinRoom", (socket, message) => {
    callController.reJoinRoom(socket, message);
})
eventBus.on("hasLogin", (socket, message) => {
    callController.hasLogin(socket, message);
})