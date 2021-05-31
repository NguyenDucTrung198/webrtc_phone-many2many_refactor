var webRtcPeer;
var registerName = null;

const NOT_REGISTERED = 0;
const REGISTERING = 1;
const REGISTERED = 2;
var registerState = null

const NO_CALL = 0;
const PROCESSING_CALL = 1;
const IN_CALL = 2;
var callState = null
var numberOffline = 0;

var videoInput;
var videoOutput;
window.onload = function() {
    videoInput = document.getElementById('videoInput');
	videoOutput = document.getElementById('videoOutput');
}

var secondsToHms;
var timeOutCall;

var participants = {};

var __caller;

var constraints = {
    // video : {
    // 	width: 40,
    // 	height: 40,
    // 	frameRate : 15
    // },
    audio:true, 
    video: false
};

const _LANG_BUSY = "発信先は通話中のため応答することができません。<br/>しばらくしてからもう一度かけ直してください。";
const _LANG_NOT_CONNECT = "発信先に繋がることができません。";
const _LANG_ERROR_NETWORK = "ネットワークに接続できません。<br/>しばらくしてからもう一度かけ直してください。";
const _LANG_SETTING_ = "発信元と発信先を設定してください。";
const _LANG_TITLE_POPUPCALLIN = "着信中";
const _LANG_TITLE_POPUPCALLOUT = "発信中";
const _LANG_TITLE_CONVERSATION = "通話中";
const _LANG_CALLOUT = "発信";
const _LANG_CALLIN = "着信";
const _LANG_MISSED = "不在";
const _LANG_REJECT = "通話拒否";
const _LANG_NOT_REGISTED_OR_OFFLINE = "発信先は存在しないまたはオフラインになっているので、発信できません。";
const _LANG_REJECT_MEETING = "ミーティング中です。";
const _LANG_REJECT_CALLING = "電話中です。";
const _LANG_REJECT_I_CALL_AGAIN = "折り返し電話します。";
const _LANG_REJECT_CALL_ME_AGAIN = "後で電話ください。";
const _LANG_TITLE = "Sateraito - Phone call";
const _LANG_INCOMMING_CALL = "Incomming call";

/************* PROTOTYPE ***************/
Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj))
}
Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key))
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};


/************* AUDIO ***************/

function AudioCommon () {
    this.playAudioRinging = () => {
        let playAudioRingingPromise = "";//audioRinging.play();
        let audioId = commonSettings.getAudio();
        console.log(sessionStorage.getItem("audio"), sessionStorage.getItem("name"));
        if (audioId == 1) {
            playAudioRingingPromise = telephoneRingtone1.play();
        } else if (audioId == 2) {
            playAudioRingingPromise = telephoneRingtone2.play();
        } else if (audioId == 3) {
            playAudioRingingPromise = telephoneRingtone3.play();
        } else if (audioId == 4) {
            playAudioRingingPromise = telephoneRingtone4.play();
        } else if (audioId == 5) {
            playAudioRingingPromise = telephoneRingtone5.play();
        }

        if (playAudioRingingPromise !== undefined) {
            playAudioRingingPromise.then(_ => {
              // Automatic playback started!
              // Show playing UI.
            })
            .catch(error => {
                console.log("Error: audioRinging"+ error);
              // Auto-play was prevented
              // Show paused UI.
            });
        }
    },
    this.playAudioBusy = () => {
        let playAudioBusyPromise = audioBusy.play();
        if (playAudioBusyPromise !== undefined) {
            playAudioBusyPromise.then(_ => {
              // Automatic playback started!
              // Show playing UI.
            })
            .catch(error => {
                console.log("Error: audioBusy"+ error);
              // Auto-play was prevented
              // Show paused UI.
            });
        }
    },
    this.playAudioCalling = () => {
        let playAudioCallingPromise = audioCalling.play();
        if (playAudioCallingPromise !== undefined) {
            playAudioCallingPromise.then(_ => {
              // Automatic playback started!
              // Show playing UI.
            })
            .catch(error => {
                console.log("Error: audioCalling"+ error);
              // Auto-play was prevented
              // Show paused UI.
            });
        }
    },
    this.playAudioHangup = () => {
        let playAudioHangupPromise = audioHangup.play();
        if (playAudioHangupPromise !== undefined) {
            playAudioHangupPromise.then(_ => {
              // Automatic playback started!
              // Show playing UI.
            })
            .catch(error => {
                console.log("Error: audioHangup"+ error);
              // Auto-play was prevented
              // Show paused UI.
            });
        }
    },
    this.pauseAudio = (type="all") => {
        audioRinging.pause();
        telephoneRingtone1.pause();
        telephoneRingtone2.pause();
        telephoneRingtone3.pause();
        telephoneRingtone4.pause();
        telephoneRingtone5.pause();
        //audioBusy.pause();
        audioCalling.pause();
        if (type == "busy") {
            audioBusy.pause();
        }
    }
}

audioCommon = new AudioCommon();
 
/**************** END ********************/

/**************** SETTING ********************/
function CommonSettings  () {
    let that = this;
    this.setAudio = function (audioId) {
        sessionStorage.setItem("audio", audioId);
    }
    this.getAudio = function () {
        let audioId = sessionStorage.getItem("audio");
        if (!audioId) audioId = 1;
        return audioId;
    }
    this.getSettings = function (callback=function(){}) {
        let name = participantCommon.getCurrentName();
        if (!name) return;
        $.ajax({
            "url": "/getSettings",
            "type": "GET",
            "contentType": "application/json; charset=utf-8",
            "data": {
                "name": name
            }
        }).done(function(data) {
            if (!data || !data.data) return;
            let audioId = data.data.audio || 1;
            let callSameDomain = data.data.call_same_domain;
            let receiveNotSameDomain = data.data.receive_not_same_domain;
            let rejectNotLogin = data.data.reject_not_login;
            $(`input[name="audio_ringing"][value='${audioId}']`).prop("checked",true);
            if (callSameDomain) $("#call_same_domain").attr("checked", true);
            if (receiveNotSameDomain) $("#receive_not_same_domain").attr("checked", true);
            if (rejectNotLogin) $("#reject_not_login").attr("checked", true);
            that.setAudio(audioId);
            callback();
        })
    }
}

commonSettings = new CommonSettings();
/**************** END ********************/

function CountTime() {
    var totalSeconds = 0;
    var intervalTime = "";

    function pad(val) {
        var valString = val + "";
        if (valString.length < 2) {
            return "0" + valString;
        } else {
            return valString;
        }
    }
    function setTime() {
        ++totalSeconds;
        $(".minutes").text(pad(parseInt(totalSeconds / 60)));
        $(".seconds").text(pad(totalSeconds % 60));
    }

    this.StopTime = function() {
        $(".group-spinner,.answer-call").show();
        $(".count-time").hide();
        $(".minutes,.seconds").text("00");
        totalSeconds = 0;
        clearInterval(intervalTime);
    }

    this.startTime = function() {
        if (!$(".count-time").is(":visible")) {
            this.StopTime();
            $(".count-time").show();
            $('.answer-call,.group-spinner').hide();
            intervalTime = setInterval(setTime, 1000);
            clearInterval(timeOutCall);
        }
    }

    
}

var countTimeObj = new CountTime();

function startCalling(message={}) {
    $("#CallOutModal .name-peer").html();
    //$("#audioCalling")[0].pause();
    audioCommon.pauseAudio();
    countTimeObj.startTime();
    if (callState != IN_CALL && message.roomName) {
        let roomName = message.roomName;
        if (typeof $("[roomName='"+roomName+"']").attr("data-room") != "undefined") {
            let data = JSON.parse($("[roomName='"+roomName+"']").attr("data-room"));
            data.id = "startCalling";
            sendMessage(data);
            setCallState(IN_CALL);
            $("#CallOutModal .modal-title,#CallModalCenter .modal-title").html(_LANG_TITLE_CONVERSATION);
        }
    }
}

function setNameCalling(name, type="") {
    let strName = "";
    let current_peer = [];
    if (type == "first") {
        sessionStorage.setObj("current_peer", name);
        strName = name.join(",");
        if (!strName) {
            strName = participantCommon.getCurrentPeer();
        }
    } else if (type == "append") {
        current_peer = sessionStorage.getObj("current_peer");
        if (!current_peer.includes(name)) {
            current_peer.push(name);
            strName = current_peer.join();
            sessionStorage.setObj("current_peer", current_peer);
        }
    } else if (type == "left") {
        current_peer = sessionStorage.getObj("current_peer");
        current_peer.remove(name);
        strName = current_peer.join();
        sessionStorage.setObj("current_peer", current_peer);
        if (current_peer.length == 0) {
            stop(false, true);
        }
    }
    $("#CallOutModal .name-peer,#CallModalCenter .name-peer").html(strName);
}

function websocketS(callback= function(){}) {
    var socket = {}
    this.socket = io('https://' + location.host);;
    this.socket.on("connect", function(evt) {
        let name = participantCommon.getCurrentName();
        if (name) {
            common = new Common();
            common.register(name);
        }
        authInited.then(function(){
            auth2 = gapi.auth2.getAuthInstance();
            if (auth2.isSignedIn.get()) {
                var profile = auth2.currentUser.get().getBasicProfile();
                let email = profile.getEmail();
                let message = {
                    id : 'hasLogin',
                    data : {
                        "email": email
                    }
                }
                sendMessage(message);
            }
		});
        console.log("Connected success!");
        callback();
    })
    this.socket.on("disconnect",function(evt) {
        console.log("closed socket");
        stop(true); 
        hideModalCall();
        waitingForJoinRoom.removeAllRoom();
    });
    this.socket.on("error", function(evt) {
        console.log("error" + evt);
    })
    this.socket.on("message", function(message) {
        //var parsedMessage = JSON.parse(message.data);
        parsedMessage = message;
        console.info('Received message: ' + JSON.stringify(message));
    
        switch (parsedMessage.id) {
        case 'registerResponse':
            resgisterResponse(parsedMessage);
            break;
        case 'callResponse':
            callResponse(parsedMessage);
            break;
        case 'incomingCall':
            incomingCall(parsedMessage);
            break;
        case 'newParticipantArrived':
            onNewParticipant(parsedMessage);
            break;
        case 'participantLeft':
            onParticipantLeft(parsedMessage);
            break;
        // case 'startCommunication':
        //     startCommunication(parsedMessage);
        //     break;
        // case 'stopCommunication':
        //     console.info("Communication ended by remote peer");
        //     stop(true, true);
        //     break;
        case 'receiveVideoAnswer':
            receiveVideoResponse(parsedMessage);
            break;
        case 'existRoom':
            startCalling(parsedMessage);
            break;
        case 'hostRejected':
            hostRejected(parsedMessage);
            break;
        case 'offline':
            numberOffline++;
            offline(parsedMessage);
            break;
        case 'iceCandidate':
            // webRtcPeer.addIceCandidate(parsedMessage.candidate)
            // break;
            participants[parsedMessage.name].rtcPeer.addIceCandidate(parsedMessage.candidate, function(error) {
                if (error) {
                  console.error("Error adding candidate: " + error);
                  return;
                }
            });
            break;
        case 'existingParticipants':
            onExistingParticipants(parsedMessage);
            break;
        case 'callEnd':
            callEnd(parsedMessage);
            break;
        case 'dataForCaller':
            dataForCaller(parsedMessage);
            break;
        case 'reasonRejectIncome':
            reasonRejectIncome(parsedMessage);
            break;
        case 'otherDeviceResponse':
            otherDeviceResponse(parsedMessage);
            break;
        case 'callSettingReject':
            callSettingReject(parsedMessage);
            break;
        default:
            console.error('Unrecognized message', parsedMessage);
        }
    })
}

var websocketT = new websocketS();

function cancelModal() {
    let chk = $("#CallModalCenter").is(":visible");
    if (chk) {
        $("#CallModalCenter .decline-call").click();
    }
}

window.onbeforeunload = function() {
    sessionStorage.setItem("set_peer", "");
    sessionStorage.setObj("peer_decied", []);
    cancelModal();
	websocketT.socket.disconnect();
}

var sendMessage = function (message) {
    var jsonMessage = JSON.stringify(message);
    console.log('Sending message: ' + jsonMessage);
    wss = websocketT.socket
    wss.emit('message', message);
}

var resgisterResponse = function(message) {
    if (message.response == 'accepted') {
        this.setRegisterState(REGISTERED);
    } else {
        this.setRegisterState(NOT_REGISTERED);
        var errorMessage = message.message ? message.message
                : 'Unknown reason for register rejection.';
        console.log(errorMessage);
        console.log('Error registering user. See console for further information.');
    }
}

setCallState = function(nextState) {
    switch (nextState) {
    case NO_CALL:
        break;
    case PROCESSING_CALL:
        break;
    case IN_CALL:
        break;
    default:
        return;
    }
    callState = nextState;
}

setRegisterState = function(nextState) {
    switch (nextState) {
    case NOT_REGISTERED:
        break;

    case REGISTERING:
        break;

    case REGISTERED:
        setCallState(NO_CALL);
        break;

    default:
        return;
    }
    registerState = nextState;
}

onIceCandidate = function(candidate) {
    console.log('Local candidate' + JSON.stringify(candidate));

    var message = {
        id : 'onIceCandidate',
        candidate : candidate
    }
    sendMessage(message);
}

function showDisConnectMessage(message="") {
    $(".modal-call .group-spinner").hide();
    $('.modal-call .error').show();
    $(".modal-call .text-error").html(message);
}

function callResponse(message) {
    $("#audioCalling")[0].pause();
	if (message.response != 'accepted') {
        setPeerDecied(message.peer);
	} else {
        countTimeObj.startTime();
		setCallState(IN_CALL);
		webRtcPeer.processAnswer(message.sdpAnswer);
	}
}

var timeOutModalInfo = "";
var modalInfo = function (message) {
    clearTimeout(timeOutModalInfo);
    $('.modal-confirm-message').html(message);
    $('#CallModalInfo').modal("show");
    timeOutModalInfo = setTimeout(function(){ $('#CallModalInfo').modal("hide"); }, 10000);
} 

var modalConfirm = function(message ,callback) {
    let roomName = message.room;
    if ('roomName' in message) {
        roomName = message.roomName;
    }
    $('.name-peer').text(message.from);
    $('#CallModalCenter').modal("show");
    $('#CallModalCenter').attr("room-name", roomName);
    participantCommon.showCurrentTitle(false, message.titleCall);
    audioCommon.playAudioRinging();
    $('#CallModalCenter .decline-call').off();
    $('#CallModalCenter .decline-call').on('click', function() {
        //$("#audioRinging")[0].pause();
        clearInterval(timeOutCall);
        audioCommon.pauseAudio();
        callback(false);
        $(".room-current-item[roomName='"+roomName+"']").show();
        console.log("decline");
    })
    $('#CallModalCenter .answer-call').off();
    $('#CallModalCenter .answer-call').on('click', function() {
        audioCommon.pauseAudio();
        //$("#audioRinging")[0].pause();
        callback(true);
        console.log("answer");
        $('#CallModalCenter .mute-call').show();
    })
    
    $('#CallModalCenter .mute-call').hide();
    $('#CallModalCenter .unmute-call').hide();

    $('#CallModalCenter .mute-call').off();
    $('#CallModalCenter .mute-call').on('click', function() {
        let name = participantCommon.getCurrentName();
        participants[name].rtcPeer.peerConnection.getLocalStreams()[0].getAudioTracks()[0].enabled = false;
        $('#CallModalCenter .mute-call').hide();
        $('#CallModalCenter .unmute-call').show();
        // participants[participantCommon.getCurrentName()].rtcPeer.audioEnabled = false;
    })

    $('#CallModalCenter .unmute-call').off();
    $('#CallModalCenter .unmute-call').on('click', function() {
        let name = participantCommon.getCurrentName();
        participants[name].rtcPeer.peerConnection.getLocalStreams()[0].getAudioTracks()[0].enabled = true;
        $('#CallModalCenter .mute-call').show();
        $('#CallModalCenter .unmute-call').hide();
    })
    
    timeOutCall = setTimeout(function(){ 
        if ($('#CallModalCenter').is(":visible")) {
            //$('#CallModalCenter .decline-call').click();
            clearInterval(timeOutCall);
            audioCommon.pauseAudio();
            callback(false, "no_response");
            $(".room-current-item[roomName='"+roomName+"']").show();
        }
        $(".room-current-item[roomName='"+roomName+"']").show();
    }, common._SECOND_TIMEOUT_CALL);
}

var modalResonReject = function(message ,callback) {
    if (!message) return false;
    $('#modalReasonReject').modal("hide");
    let targetModal = $("#modalReasonReject");
    targetModal.find(".other-reason-required").hide();
    $('#modalReasonReject').modal("show");
    let reasonReject = parseInt($("input[name='reasonreject']:checked").val());
    $("input[name='reasonreject']").change(function() {
        reasonReject = parseInt($("input[name='reasonreject']:checked").val());
        if (reasonReject == 5) {
            $('#modalReasonReject .div-other-reason').show();
        } else {
            $('#modalReasonReject .div-other-reason').hide();
        }
    });

    $('#modalReasonReject').on('hidden.bs.modal', function (e) {
        targetModal.find(".other-reason").val("");
        $("input[name=reasonreject][value=1]").prop("checked",true);
    })

    $("#modalReasonReject .button-save").off();
    $("#modalReasonReject .button-save").on("click", function () {
        let otherReason = (targetModal.find(".other-reason").val()).trim();
        if (reasonReject == 5) {
            if (!otherReason) {
                targetModal.find(".other-reason-required").show();
                return false;
            } else {
                targetModal.find(".other-reason-required").hide();
            }
        }

        $.ajax({
            "url": "/saveReasonReject",
            "type": "POST",
            "contentType": "application/json; charset=utf-8",
            "data": JSON.stringify({
                "recordId": message.record_id,
                "from": message.from,
                "roomName": message.room,
                "reasonId": reasonReject,
                "reasonMessage": otherReason,
                "name": participantCommon.getCurrentName()
            })
        }).done(function(data) {
            
        })
    })

    

}

var hideModalCall = function () {
    $('#CallModalCenter').modal("hide");
    $("#CallOutModal").modal("hide");
    $('.modal-call .error').hide();
    // $('#CallModalCenter,#CallOutModal').on('shown.bs.modal', function (e) {
    //     $('#CallModalCenter').modal("hide");
    //     $("#CallOutModal").modal("hide");
    // })
    //$('#CallModalCenter,#CallOutModal').off('shown.bs.modal');
    $('#CallModalCenter,#CallOutModal').on('hidden.bs.modal', function (e) {
        countTimeObj.StopTime();
        audioCommon.playAudioHangup();
        $("#CallOutModal .modal-title").html(_LANG_TITLE_POPUPCALLOUT);
        $("#CallModalCenter .modal-title").html(_LANG_TITLE_POPUPCALLIN);

        $('#CallOutModal .mute-call').show();
        $('#CallOutModal .unmute-call').hide();
    })

    //stop audio
    //stopAudio();
    audioCommon.pauseAudio();
    //
    clearInterval(timeOutCall);
    sessionStorage.setObj("peer_decied", []);
    sessionStorage.setItem("set_peer", "");
    numberOffline = 0;
}

function onParticipantLeft(request) {
	console.log('Participant ' + request.name + ' left');
	var participant = participants[request.name];
	participant.dispose();
    delete participants[request.name];
    setNameCalling(request.name, "left");
}

function stop(message, closePopup=true) {
    setCallState(NO_CALL);
    if (!message) {
        sendMessage({
            'id': 'leaveRoom'
        });
    }

	for (var key in participants) {
		participants[key].dispose();
    }
    
    if (closePopup) {
        hideModalCall();
    }
}

function receiveVideo(sender) {
	var participant = new Participant(sender);
	participants[sender] = participant;
	var video = participant.getVideoElement();

	var options = {
        remoteVideo: video,
        mediaConstraints: constraints,
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


function onNewParticipant(request) {
    startCalling(request);
    receiveVideo(request.name);
    setNameCalling(request.name, "append");
}

function WaitingForJoinRoom () {
    let that = this;
    this.setData = (message) => {
        let roomName = message.roomName;
        let tmp_html = `<div class="room-current-item" style="display: none;" roomname="${roomName}">
                            <button type="button" class="btn btn-info">チーム参加<br/>`+message.from+`</button>
                        </div>`;
        let target = $(".room-current-item[roomname='"+roomName+"']")
        if (!target.length) {
            $('.room-current').append(tmp_html);
            target = $(".room-current-item[roomname='"+roomName+"']");
        }
        target.attr("data-room", JSON.stringify(message));
        target.off();
        target.on("click", function() {
            that.joinRoom(roomName);
        })
    }
    this.leftRoom = (roomName) => {
        if (!roomName) return;
        $(".room-current-item[roomname='"+roomName+"']").hide();
    }
    this.removeRoom = (roomName) => {
        if (!roomName) return;
        $(".room-current-item[roomname='"+roomName+"']").remove();
    }
    this.removeAllRoom = () => {
        $(".room-current").html("");
    }
    this.joinRoom = (roomName) => {
        if (!roomName) return;
        let response = JSON.parse($(".room-current-item[roomname='"+roomName+"']").attr("data-room"));
        if (jQuery.isEmptyObject(response)) {
            that.leftRoom(roomName);
            return false;
        }
        response.id = 'reJoinRoom';
        modalConfirm(response, function(confirm, callResponse) {
            if (!confirm) {
                if (callState == IN_CALL) {
                    stop(false);
                } else {
                    response.callResponse = 'reject';
                    if (callResponse) {
                        response.callResponse = callResponse;
                    }
                    response.message = 'user declined';
                    sendMessage(response);
                }
                setCallState(NO_CALL);
                $('#CallModalCenter').modal("hide");
                $(".room-current-item[roomname='"+roomName+"']").show();
            }
        })
        that.leftRoom(roomName);
        return sendMessage(response);
    }
}

var waitingForJoinRoom = new WaitingForJoinRoom();

function dataForCaller(message) {
    waitingForJoinRoom.setData(message);
}

function reasonRejectIncome(message) {
    let from = message.from;
    let reasonId = message.reasonId;
    let reasonMessage = "";
    if (reasonId == 1) {
        reasonMessage = _LANG_REJECT_MEETING;
    } else if (reasonId == 2) {
        reasonMessage = _LANG_REJECT_CALLING;
    } else if (reasonId == 3) {
        reasonMessage = _LANG_REJECT_I_CALL_AGAIN;
    } else if (reasonId == 4) {
        reasonMessage = _LANG_REJECT_CALL_ME_AGAIN;
    } else if (reasonId == 5) {
        reasonMessage = message.reasonMessage;
    }
    $.notify({
        title: "<b>"+from + "</b> - ",
        message: reasonMessage
    }, {z_index: 1051, type: "warning"});
}

function otherDeviceResponse(message) {
    stop(true, true);
}

function callSettingReject(message) {
    $(".participantNotCallOtherDomain").hide();
    $(".participantNotReceiveOtherDomain").hide();
    $(".participantCancelByNotLogin").hide();
    $(".participantCancelByNotLogin").hide();
    $(".dataParticipantCancelByNotLogin").hide();
    let dataParticipantNotCallOtherDomain = message.participantNotCallOtherDomain;
    let dataParticipantNotReceiveOtherDomain = message.participantNotReceiveOtherDomain;
    let dataParticipantCancelByNotLogin = message.participantCancelByNotLogin;
    if (dataParticipantNotCallOtherDomain.length) {
        $(".participantNotCallOtherDomain").show();
    }
    if (dataParticipantNotReceiveOtherDomain.length) {
        $(".participantNotReceiveOtherDomain").show();
        $(".dataParticipantNotReceiveOtherDomain").show();
        $(".dataParticipantNotReceiveOtherDomain").text(dataParticipantNotReceiveOtherDomain.join());
    }
    if (dataParticipantCancelByNotLogin.length) {
        $(".participantCancelByNotLogin").show();
        $(".dataParticipantCancelByNotLogin").show();
        $(".dataParticipantCancelByNotLogin").text(dataParticipantCancelByNotLogin.join());
    }
}

function incomingCall(message) {
    titleCommon.changeTitle(_LANG_INCOMMING_CALL, message.from);
    // If bussy just reject without disturbing user
    var response = {
        id : 'incomingCallResponse',
        from : message.from,
        record_id: message.record_id,
        roomName: message.room
    };
    waitingForJoinRoom.setData(response);
    console.log(callState, message['mb']);
	if (callState != NO_CALL && !message['mb']) {
        response.callResponse = 'busy';
        response.message ='busy';
		return sendMessage(response);
	}

    setCallState(PROCESSING_CALL);
    modalConfirm(message, function(confirm, callResponse) {
        if (confirm) {
            console.log(response);
            response.callResponse = 'accept';
            sendMessage(response);
            countTimeObj.startTime();
        } else {
            if (callState == IN_CALL) {
                stop(false);
            } else {
                response.callResponse = 'reject';
                if (callResponse) {
                    response.callResponse = callResponse;
                }
                response.message = 'user declined';
                sendMessage(response);
                if (response.callResponse == "reject") {
                    modalResonReject(message);
                }
            }
            setCallState(NO_CALL);
            $('#CallModalCenter').modal("hide");
        }
    })
}

function callEnd(message) {
    waitingForJoinRoom.removeRoom(message.roomName);
    return;
}

// function startCommunication(message) {
// 	setCallState(IN_CALL);
// 	webRtcPeer.processAnswer(message.sdpAnswer);
// }

function receiveVideoResponse(result) {
	participants[result.name].rtcPeer.processAnswer (result.sdpAnswer, function (error) {
		if (error) return console.error (error);
	});
}

function onExistingParticipants(msg) {
	//console.log(name + " registered in room " + room);
	var participant = new Participant(__caller);
	participants[__caller] = participant;
	var video = participant.getVideoElement();

	var options = {
        localVideo: video,
        mediaConstraints: constraints,
        onicecandidate: participant.onIceCandidate.bind(participant)
	}
	participant.rtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(options,
		function (error) {
		  if(error) {
			  return console.error(error);
		  }
		  this.generateOffer(participant.offerToReceiveVideo.bind(participant));
	});
    msg.data.forEach(receiveVideo);

    setNameCalling(msg.data);
    setNameCalling(msg.data, "first");
    // if (parseInt(msg.enableVideo) == 0) {
	// 	//msg.data.forEach(receiveVideo);
	// 	msg.data.forEach(function(item, index){
	// 		receiveVideo(item, msg.enableVideo)
	// 	})
	// }
}

function Common() {
    let that = this;
    let ping = new Ping();
    this._SECOND_TIMEOUT_CALL = 30000;
    this.PingUrl = function(callback) {
        url="https://www.google.com/"
        ping.ping(url, function(err, data) {
            // Also display error if err is returned.
            if (err) {
                console.log("error loading resource")
                data = data + " " + err;
                modalInfo(_LANG_ERROR_NETWORK);
                callback (false);
                
                return false;
            }
            callback (true);
        });
    }

    this.connectSocket = function() {
        websocketT = new websocketS();
    }

    this.disConnectSocket = function() {
        websocketT.socket.disconnect();
    }
    this.register = function(name) {
        __caller = name;
        setRegisterState(REGISTERING);

        var message = {
            id : 'register',
            name : name
        };
        sendMessage(message);
    }

    this.getArrayPeer = function(to) {
        let to_str = (to).replace(/、/g, ",");
        return to_str.split(",");
    }

    this.genRoomName = function(from, to) {
        let targetArr = [];
        targetArr.push((from).trim());
        let toArr = this.getArrayPeer(to);
        toArr.forEach(function(v) {
            if (!targetArr.includes(v)) {
                targetArr.push(v.trim());
            }
        })
        targetArr = targetArr.sort();
    
        return targetArr.join();
    }

    this.call = function(peer="", name="") {
        if (!peer) {
            peer = participantCommon.getCurrentPeer();
        }
        if (!name) {
            name = participantCommon.getCurrentName();
        }
        
        if (!peer || !name) {
            modalInfo(_LANG_SETTING_);
            return false;
        }
        
        setCallState(PROCESSING_CALL);

        var message = {
            id : 'call',
            from : name,
            to : peer,
            titleCall: participantCommon.getCurrentTitle()
        };
        sendMessage(message);
        console.log(peer);
        $('#CallOutModal .name-peer').html(peer);
        participantCommon.showCurrentTitle();
        $('#CallOutModal').modal("show");
        audioCommon.playAudioCalling();
        timeOutCall = setTimeout(function(){ 
            if ($('#CallOutModal').is(":visible")) {
                $('#CallOutModal .decline-call').click();
            }
        }, this._SECOND_TIMEOUT_CALL);
    }
}

function UrlCommon () {
    this.searchParam = function(param) {
        let queryString = window.location.search;
        let urlParams = new URLSearchParams(queryString);
        return urlParams.get(param);
    }
}
urlCommon = new UrlCommon();

function RoomNameCommon() {
    this.formatRoomName = function (roomName) {
        roomName = roomName.trim();
        roomName = roomName.replace(/、/g, ",");
        return roomName;
    }

    this.convertToArray = function (roomName) {
        roomName = this.formatRoomName(roomName);
        let roomNameArr = roomName.split(",");
        return roomNameArr;
    }

    this.removeName = function (name, roomName) {
        name = name.trim();
        let roomNameArr = this.convertToArray(roomName);
        roomNameArr.remove(name)
        return roomNameArr.join(",");
    }
}
roomNameCommon = new RoomNameCommon();


function ParticipantCommon() {

    this.getCurrentName = function() {
        let from = urlCommon.searchParam("from");
        let str_name = "";
        if (from) {
            str_name = from;
            sessionStorage.setItem("name", from);
        } else if (sessionStorage.getItem("name")){
            str_name = sessionStorage.getItem("name");
        }
        return str_name.toLowerCase();
    }
    this.getCurrentPeer = function () {
        let str_peer = "";
        // let to = urlCommon.searchParam("to");
        // if (to) {
        //     to = roomNameCommon.formatRoomName(to);
        //     str_peer = to;
        // } else {
        //     str_peer = sessionStorage.getItem("peer");
        // }
        str_peer = sessionStorage.getItem("peer");
        if (sessionStorage.getItem("set_peer")) {
            str_peer = sessionStorage.getItem("set_peer");
        }
        if (!str_peer && sessionStorage.getObj("current_peer")) {
            str_peer = (sessionStorage.getObj("current_peer")).join();
        }
        console.log(str_peer);
        if (str_peer) {
            str_peer = str_peer.toLowerCase();
        }
        return str_peer;
    }
    this.setCurrentPeer = function (peer="") {
        if (peer) {
            peer = peer.toLowerCase();
            sessionStorage.setItem("peer", peer);
        } else {
            peer = urlCommon.searchParam("to");
            if (peer) {
                peer = peer.toLowerCase();
                peer = roomNameCommon.formatRoomName(peer);
                sessionStorage.setItem("peer", peer);
            }
        }
    }
    this.setCurrentTitle = function (titleCall = "") {
        sessionStorage.setItem("titleCall", titleCall);
    }
    this.getCurrentTitle = function () {
        let titleCall = sessionStorage.getItem("titleCall") || "";
        return titleCall;
    }
    this.showCurrentTitle = function (getCurrent=true, title ="") {
        let that = this;
        let titleCall = title;
        $(".titleCall").hide();
        if (getCurrent) {
            titleCall = that.getCurrentTitle();
        }
        if (titleCall) {
            $(".titleCall").show();
            $(".titleCall").text(titleCall);
        }
    }
}

participantCommon = new ParticipantCommon();

var activeNav = function() {
    let pathname = window.location.pathname;
    $('.nav-item').removeClass("active");
    $(".nav-item[href='"+pathname+"']").addClass("active");
}

function hostRejected(message={}) {
    if (callState == PROCESSING_CALL && $("#CallModalCenter").is(":visible") && message.room == $("#CallModalCenter").attr("room-name")) {
        setTimeout(function(){ 
            stop(true, true); 
        }, 1000);
    }
}

function checkBusy() {
    let str_peer = participantCommon.getCurrentPeer();;
    if (sessionStorage.getItem("set_peer")) {
        str_peer = sessionStorage.getItem("set_peer");
    }
    let peer_str = str_peer.replace(/、/g, ",")
    let callPeerArr = peer_str.split(",");
    let peerDecied = sessionStorage.getObj("peer_decied");
    callPeerArr.forEach(function(v,i) {
        callPeerArr[i] = $.trim(v);
    })
    peerDecied.forEach(function(v,i) {
        peerDecied[i] = $.trim(v);
    })
    let diff = callPeerArr.diff(peerDecied);
    if (diff.length == 0) {
        setTimeout(function(){ stop(false, true); }, 1000);
        if (parseInt(numberOffline) == callPeerArr.length) {
            modalInfo(_LANG_NOT_REGISTED_OR_OFFLINE);
        } else {
            modalInfo(_LANG_BUSY);
        }
    }
}

function setPeerDecied(peer) {
    let peer_decied = sessionStorage.getObj("peer_decied")
    if (!peer_decied)   peer_decied = [];
    if (peer_decied.includes(peer)) return;
    peer_decied.push(peer);
    sessionStorage.setObj("peer_decied", peer_decied);
    checkBusy();
}

function offline(message) {
    setPeerDecied(message.peer);
}

/*************** CHANGE TITLE *************/
function TitleCommon () {
    let that = this;
    let isOldTitle = true;
    let titleInterval = null;
    this.setTitle = function(title1, title2) {
        document.title = isOldTitle ? title1 : title2;
        isOldTitle = !isOldTitle;
    }
    this.changeTitle = function(title1, title2) {
        that.setDefautlTitle();
        titleInterval = setInterval(that.setTitle.bind(null,title1, title2), 1500);
    }
    this.setDefautlTitle = function () {
        clearInterval(titleInterval);
        $("title").text(_LANG_TITLE);
    }
}

var titleCommon = new TitleCommon();
$(window).focus(function() {
    titleCommon.setDefautlTitle();
});
$(document).on("click", function () {
    titleCommon.setDefautlTitle();
});
/**************** END ******/

$(document).ready(function() {

    common = new Common();
    activeNav();
    $('.nav-item').on('click', function() {
        activeNav();
    })

    var modalCallOut = function(callback) {
        $("#btn-call").on("click", function() {
            //let peer = participantCommon.getCurrentPeer();
            let peer = $("#peer").val();
            participantCommon.setCurrentPeer(peer);
            window.parent.postMessage({
                action: 'updatePeer',
                key: (peer)
            }, "*");
            common.PingUrl(function(dataPing) {
                if (dataPing) {
                    common.call();
                }
            })
        })
        $('.decline-call').off();
        $('.decline-call').on('click', function() {
            let peer = participantCommon.getCurrentPeer();
            let name = participantCommon.getCurrentName();
            callback(false);
            console.log("decline");
            $(".room-current-item[roomName='"+common.genRoomName(name, peer)+"']").show();
        })

        $('#CallOutModal .mute-call').off();
        $('#CallOutModal .mute-call').on('click', function() {
            let name = participantCommon.getCurrentName();
            participants[name].rtcPeer.peerConnection.getLocalStreams()[0].getAudioTracks()[0].enabled = false;
            $('#CallOutModal .mute-call').hide();
            $('#CallOutModal .unmute-call').show();
        })

        $('#CallOutModal .unmute-call').off();
        $('#CallOutModal .unmute-call').on('click', function() {
            let name = participantCommon.getCurrentName();
            participants[name].rtcPeer.peerConnection.getLocalStreams()[0].getAudioTracks()[0].enabled = true;
            $('#CallOutModal .mute-call').show();
            $('#CallOutModal .unmute-call').hide();
        })
    }

    modalCallOut(function(conf) {
        if (!conf) {
            stop();
        }
    })

    formatNumber = function (num) {
        num = parseInt(num);
        if (num < 10) {
            return "0"+String(num);
        } else {
            return num;
        }
    }

    secondsToHms = function secondsToHms(d) {
        d = Number(d);
        var h = Math.floor(d / 3600);
        var m = Math.floor(d % 3600 / 60);
        var s = Math.floor(d % 3600 % 60);
        let str_time = "";
        if (h>0) {
            str_time += formatNumber(h)+"h";
        }
        if (m) {
            str_time += m+"m";
        }
        str_time += formatNumber(s)+"s"
        return str_time; 
    }

    $('#CallModalInfo').on('show.bs.modal', function (e) {
        audioCommon.playAudioBusy();
    })

    $('#CallModalInfo').on('hide.bs.modal', function (e) {
        audioCommon.pauseAudio("busy");
    })

    if (urlCommon.searchParam("from")) {
        participantCommon.getCurrentName();
    }

    if (urlCommon.searchParam("to")) {
        participantCommon.setCurrentPeer(urlCommon.searchParam("to"));
        if (window.location.pathname != "/call") {
            $(location).attr('href', '/call'+window.location.search);
        }

        //let peer = urlCommon.searchParam("to");
        if (window.location.pathname == "/call" && urlCommon.searchParam("sm") == 1) {
            common.PingUrl(function(dataPing) {
                if (dataPing) {
                    common.call();
                }
            })
        }
    }

    // if (urlCommon.searchParam("platform")) {
    //     let str_platform = (urlCommon.searchParam("platform"));
    //     let platform = "";
    //     if (str_platform.includes("android")) {
    //         platform = "android";
    //     } else if (str_platform.includes("ios")) {
    //         platform = "ios";
    //     }
    //     sessionStorage.setItem("platform", platform);
    // }
    // if (sessionStorage.getItem("platform")) {
    //     let message_device = {
    //         id : 'byDevice',
    //         platform : sessionStorage.getItem("platform")
    //     }
    //     sendMessage(message_device);
    // }
    
    commonSettings.getSettings(function() {
        if (urlCommon.searchParam("checkcalling") && urlCommon.searchParam("from")) {
            let participant = urlCommon.searchParam("from");
            $.ajax({
                "url": "/checkCalling",
                "type": "POST",
                "contentType": "application/json; charset=utf-8",
                "data": JSON.stringify({
                    "participant": participant
                })
            }).done(function(data) {
                if (!Object.keys(data).length) return false;
                let roomName = data.data.room_name;
                let record_id = data.data.id;
                let parsedMessage = {"from": data.data.caller,"record_id": record_id, "room": roomName, "roomName": roomName, "mb":1};
                incomingCall(parsedMessage);
                // if (data.data.status_rm == "calling") {
                //     incomingCall(parsedMessage);
                // } else if (data.data.status_rm == "talking") {
                //     waitingForJoinRoom.setData(parsedMessage);
                //     $(".room-current-item[roomname='"+roomName+"']").show();
                // }
            })
        }
    });
})

// const domains = [
//     "https://localhost:9001",
//     "https://www.domaine2.com"
// ]

window.addEventListener("message", messageHandler, false);
function messageHandler(event) {
    // if (!domains.includes(event.origin))
    //     return;
    let { action, key, value } = event.data
    console.log(action, key, value);
    if (action == 'save'){
        window.localStorage.setItem(key, JSON.stringify(value))
    } else if (action == 'getSessionStorage') {
        event_source.postMessage({
            action: 'getSessionStorage',
            key: JSON.parse(window.sessionStorage.getItem(key))
        }, '*')
    } else if (action == "updateSessionStorage") {
        sessionStorage.setItem(key, value);
    } else if (action == 'updateSettings') {
        if (!key) {
            key = sessionStorage.getItem("name");
        }
        if (key && value && value.token && value.platforms) {
            let platform = "";
            if (value.platforms.includes("android")) {
                platform = "android";
            } else if (value.platforms.includes("ios")) {
                platform = "ios";
            }
            if (!platform) return false;
            // let message_device = {
            //     id : 'byDevice',
            //     platform : platform
            // }
            // sendMessage(message_device);
            $.ajax({
                "url": "/saveToken",
                "type": "POST",
                "contentType": "application/json; charset=utf-8",
                "data": JSON.stringify({
                    "participant": key,
                    "token": value.token,
                    "platform": platform
                })
            }).done(function(data) {
                
            })
        }
    } else if (action == "acceptIncommingCall") {
        console.log("Listener: acceptIncommingCall");
        setTimeout(function(){
            if ($('#CallModalCenter .answer-call').is(":visible")) {
                $('#CallModalCenter .answer-call').click();
            }
        }, 500);
    } else if (action == "rejectIncommingCall") {
        console.log("Listener: rejectIncommingCall");
        setTimeout(function(){
            if ($('#CallModalCenter .decline-call').is(":visible")) {
                $('#CallModalCenter .decline-call').click();
            }
        }, 500);
    } else if (action == "hasLogin") {
        let message = {
            id : 'hasLogin',
            data : {
                "email": key
            }
        }
        sendMessage(message);
    }
}