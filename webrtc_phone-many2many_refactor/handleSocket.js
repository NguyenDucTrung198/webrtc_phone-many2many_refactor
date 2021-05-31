//import socketIO from 'socket.io';
var socketIO = require('socket.io')
var myEmitter = require('./helpers/event.js').eventBus;

module.exports = server => {
	let io = socketIO(server).path('/groupcall');
	io.on('connection', socket => {
		// error handle
		socket.on('error', error => {
			console.error(`Connection %s error : %s`, socket.id, error);
		});

		socket.on('disconnect', data => {
			console.log(`Connection : %s disconnect`, data);
		});

		socket.on('message', message => {
			console.log(`Connection: %s receive message %s`, message.id , JSON.stringify(message));
			switch (message.id) {
				case 'register':
					myEmitter.emit("register", socket, message);
					break;
				case 'call':
					myEmitter.emit("call", socket, message);
					break;
				case 'incomingCallResponse':
					myEmitter.emit("incomingCallResponse", socket, message);
					break;
				case 'receiveVideoFrom':
					myEmitter.emit("receiveVideoFrom", socket, message);
					break;
				case 'leaveRoom':
					myEmitter.emit("leaveRoom", socket, message);
					break;
				case 'onIceCandidate':
					myEmitter.emit("onIceCandidate", socket, message);
					break;
				case 'startCalling':
					myEmitter.emit("startCalling", socket, message);
					break;
				case 'reJoinRoom':
					myEmitter.emit("reJoinRoom", socket, message);
					break;
				case 'hasLogin':
					myEmitter.emit("hasLogin", socket, message);
					break;
				default:
					socket.emit({id: 'error', msg: `Invalid message ${message}`});
			}
		})
	})
};