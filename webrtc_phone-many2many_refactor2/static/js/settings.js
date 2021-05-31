$(document).ready(function() {
    var common = new Common();
    var name = participantCommon.getCurrentName();

    if (name) {
        $("#name").val(name);
    }

    $("#name").on("keydown", function() {
        let name_input = ($("#name").val()).toLowerCase();
        $("#name").val(name_input);
    })
    
    $("#save-settings").on("click", function() {
        let name = $.trim($("#name").val());
        $("#nameInValid").hide();
        if (!name) {
            $("#nameInValid").show();
            return false;
        }

        sessionStorage.setItem("name", name);
        common.disConnectSocket();
        common.connectSocket();
        
        $(".alert-success").fadeTo(1000, 500).slideUp(500, function(){
            $(".alert-success").slideUp(500);
        });

        saveSettings();
    })

    var saveSettings = function() {
        let name = participantCommon.getCurrentName();
        let audioId = $('input[name="audio_ringing"]:checked').val();
        let callSameDomain = $("#call_same_domain").is(":checked");
        let receiveNotSameDomain = $("#receive_not_same_domain").is(":checked");
        let rejectNotLogin = $("#reject_not_login").is(":checked");
        $.ajax({
            "url": "/saveSettings",
            "type": "POST",
            "contentType": "application/json; charset=utf-8",
            "data": JSON.stringify({
                "name": name,
                "audio": audioId,
                "callSameDomain": callSameDomain,
                "receiveNotSameDomain": receiveNotSameDomain,
                "rejectNotLogin": rejectNotLogin
            })
        }).done(function(data) {
            commonSettings.setAudio(audioId);
        })
        window.parent.postMessage({
            action: 'updateSettings',
            key: (window.sessionStorage.getItem("name"))
        }, "*");
    }
})

