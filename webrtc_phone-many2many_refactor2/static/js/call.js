var common = new Common();
$(document).ready(function() {
    
    $("#peer").on("keyup", function() {
        let peer = ($("#peer").val()).toLowerCase();
        $("#peer").val(peer);
        sessionStorage.setItem("peer", peer);
    })

    $("#title-call").on("keyup", function() {
        let titleCall = $("#title-call").val();
        sessionStorage.setItem("titleCall", titleCall);
    })

    let peer = participantCommon.getCurrentPeer();
    $("#peer").val(peer);

    let titleCall = participantCommon.getCurrentTitle();
    $("#title-call").val(titleCall);
    
})