/*
 * (C) Copyright 2014 Kurento (http://kurento.org/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

var socket = io('https://' + location.host);
var participants = {};
var name;

function init_js() {
	$('.mute').hide();
	$(".unmute").show();
	$('.disableMedia').hide();
	$(".enableMedia").show();
}

window.onbeforeunload = function() {
	socket.disconnect();
};

socket.on('connect', () => {
	console.log('ws connect success');
});

socket.on('message', parsedMessage => {
	console.info('Received message: ' + parsedMessage.id);

	switch (parsedMessage.id) {
	case 'existingParticipants':
		onExistingParticipants(parsedMessage);
		break;
	case 'newParticipantArrived':
		onNewParticipant(parsedMessage);
		break;
	case 'participantLeft':
		onParticipantLeft(parsedMessage);
		break;
	case 'receiveVideoAnswer':
		receiveVideoResponse(parsedMessage);
		break;
	case 'iceCandidate':
		participants[parsedMessage.name].rtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
	        if (error) {
		      console.error("Error adding candidate: " + error);
		      return;
	        }
	    });
	    break;
	default:
		console.error('Unrecognized message', parsedMessage);
	}
});

/*
function register() {
	name = document.getElementById('name').value;
	var roomName = document.getElementById('roomName').value;

	document.getElementById('room-header').innerText = 'ROOM ' + roomName;
	document.getElementById('join').style.display = 'none';
	document.getElementById('room').style.display = 'block';
	//init_js();
	sessionStorage.setItem("name",name.replace(/\s/g, ''));
	var message = {
		id : 'joinRoom',
		name : name,
		roomName : roomName,
	}
	sendMessage(message);
}
*/

function onNewParticipant(request) {
	receiveVideo(request.name);
}

function receiveVideoResponse(result) {
	participants[result.name].rtcPeer.processAnswer (result.sdpAnswer, function (error) {
		if (error) return console.error (error);
		//$("#"+sessionStorage.getItem("name")).find('.icon-close').show();
	});
}

function callResponse(message) {
	if (message.response != 'accepted') {
		console.info('Call not accepted by peer. Closing call');
		stop();
	} else {
		webRtcPeer.processAnswer(message.sdpAnswer, function (error) {
			if (error) return console.error (error);
		});
	}
}

function onExistingParticipants(msg) {
	var constraints = {
		audio : false,
		video : {
			// mandatory : {
			// 	maxWidth : 75,
			// 	maxFrameRate : 15,
			// 	minFrameRate : 15
			// }
			width: 40,
			height: 40,
			frameRate : 15
		}
	};
	console.log(name + " registered in room " + room);
	var participant = new Participant(name);
	participants[name] = participant;
	var video = participant.getVideoElement();

	var options = {
	      localVideo: video,
	      mediaConstraints: constraints,
	      onicecandidate: participant.onIceCandidate.bind(participant)
	}
	participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options,
		function (error) {
		  if(error) {
			  return console.error(error);
		  }
		  this.generateOffer(participant.offerToReceiveVideo.bind(participant));
	});

	msg.data.forEach(receiveVideo);
}

function leaveRoom() {
	sendMessage({
		'id': 'leaveRoom'
	});

	for (var key in participants) {
		participants[key].dispose();
	}

	document.getElementById('join').style.display = 'block';
	document.getElementById('room').style.display = 'none';

	//socket.disconnect();
	// location.reload();
}

function receiveVideo(sender) {
	var participant = new Participant(sender);
	participants[sender] = participant;
	var video = participant.getVideoElement();

	var options = {
      remoteVideo: video,
      onicecandidate: participant.onIceCandidate.bind(participant)
    }

	participant.rtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
		function (error) {
			if(error) {
				return console.error(error);
			}
			this.generateOffer(participant.offerToReceiveVideo.bind(participant));
		}
	);
}

function onParticipantLeft(request) {
	console.log('Participant ' + request.name + ' left');
	var participant = participants[request.name];
	participant.dispose();
	delete participants[request.name];
}

function sendMessage(message) {
	var jsonMessage = JSON.stringify(message);
	console.log('Senging message: ' + jsonMessage);
	socket.emit('message', message);
}

function muteMic() {
	for (var key in participants) {
		participants[key].rtcPeer.audioEnabled = false;
	}
	$('.mute').show();
	$(".unmute").hide();
}

function unmuteMic() {
	for (var key in participants) {
		participants[key].rtcPeer.audioEnabled = true;
	}
	$('.mute').hide();
	$(".unmute").show();
}

function disableMedia() {
	console.log("disableMedia");
	for (var key in participants) {
		participants[key].rtcPeer.videoEnabled = false;
	}
	$('.disableMedia').show();
	$(".enableMedia").hide();
}

function enableMedia() {
	console.log("enableMedia");
	for (var key in participants) {
		participants[key].rtcPeer.videoEnabled = true;
	}
	$('.disableMedia').hide();
	$(".enableMedia").show();
}

