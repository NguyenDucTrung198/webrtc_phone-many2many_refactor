$(document).ready(function() {
    var common = new Common();
    var waitingForJoinRoom = new WaitingForJoinRoom();
    let callname = participantCommon.getCurrentName();
    if (!callname) return
    var page = 1;

    var getLangRejectReason = function (reasonId, reasonMessage) {
        let reject_reason = "";
        if (reasonId == 1) {
            reject_reason = _LANG_REJECT_MEETING;
        } else if (reasonId == 2) {
            reject_reason = _LANG_REJECT_CALLING;
        } else if (reasonId == 3) {
            reject_reason = _LANG_REJECT_I_CALL_AGAIN;
        } else if (reasonId == 4) {
            reject_reason = _LANG_REJECT_CALL_ME_AGAIN;
        } else if (reasonId == 5) {
            reject_reason = reasonMessage;
        }
        return reject_reason;
    }

    var getLogs = function () {
        $.ajax({
            "url": "/getCallLogs",
            "type": "POST",
            "contentType": "application/json; charset=utf-8",
            "data": JSON.stringify({
                "callname": callname,
                "page": page
            })
        }).done(function(data){
            if (parseInt(data.total) > parseInt(page)) {
                $(".load-more-content").show();
            } else {
                $(".load-more-content").hide();
            }
            let  items_html = "";
            $.each(data.data.list, function(k, item) {
                if (item.participant == participantCommon.getCurrentName() && (item.status == "reject_not_login" || item.status == "reject_not_login")) {
                    return;
                }
                //let type = "";
                let img_type_call = "";
                let peer_name = roomNameCommon.removeName(participantCommon.getCurrentName(), item.room_name);//item.callee;
                let caller_name = item.caller;
                let type_call_html = "";
                //let total_favorite = parseInt(item.favorite);
                let class_favorite = "";
                if (item.favorite) class_favorite = "has_favorited";
                let no_respone_html = `<span class="badge badge-secondary type-call-badge">${_LANG_MISSED}</span>`;
                let busy_html = `<span class="badge badge-warning type-call-badge">${_LANG_TITLE_CONVERSATION}</span>`;
                let reject_html = `<span class="badge badge-danger type-call-badge">${_LANG_REJECT}</span>`;
                let reject_reason = ``;
                if (item.reject_reason_id) {
                    reject_reason = `<small class="form-text text-danger">${getLangRejectReason(item.reject_reason_id, item.reject_reason_message)}</small>`;
                }
                if (item.caller == callname) {
                    //type = "callout";
                    img_type_call = "img/callout.png"
                    caller_name = item.callee;
                    peer_name = "";
                    if (item.status == "all_no_response" || item.status == "has_no_response" || item.status == "no_response") {
                        type_call_html = no_respone_html;
                    } else if (item.status == "all_busy" || item.status == "has_busy") {
                        type_call_html = busy_html;
                    } else if (item.status == "all_reject" || item.status == "has_reject") {
                        type_call_html = reject_html;
                        let reject_reason_message = "";
                        $.each(data.data.record_room[item.room_id], function (i,v ) {
                            if (reject_reason_message) {
                                reject_reason_message += "<br/>";
                            }
                            reject_reason_message += v.participant+": "+getLangRejectReason(v.reject_reason_id, v.reject_reason_message);
                        })
                        if (reject_reason_message) {
                            reject_reason = `<small class="form-text text-danger">${reject_reason_message}</small>`;
                        }
                    } else {
                        type_call_html = `<span class="badge badge-info type-call-badge">${_LANG_CALLOUT}</span>`;
                    }
                } else {
                    img_type_call = "img/callignore.png"
                    if (item.status == "no_response") {
                        //type = "missed";
                        type_call_html = no_respone_html;
                    } else if (item.status == "busy") {
                        type_call_html = busy_html;
                    } else if (item.status == "reject") {
                        type_call_html = reject_html;
                    } else {
                        //type = "callin";
                        img_type_call = "img/callin.png"
                        type_call_html = `<span class="badge badge-success type-call-badge">${_LANG_CALLIN}</span>`;
                    }
                }
                let created_date = new Date(item.created_date);
                let created_date_str = created_date.getFullYear() +"/"+ formatNumber(created_date.getMonth()+1) +"/"+ formatNumber(created_date.getDate()) + " " + formatNumber(created_date.getHours()) + ":" + formatNumber(created_date.getMinutes());
                items_html += `<div class="log-item-content clearfix" log-roomname="${item.room_name}" log-id="${item.id}">
                                <div class="item-img-type-call">
                                    <img src="${img_type_call}"/>
                                    <div class="total-time">${secondsToHms(item.total_time)}</div>
                                </div>
                                <div class="item-name-caller">
                                    `+type_call_html+`
                                    <h5 class="caller-name">${caller_name}</h5>
                                    ${reject_reason}
                                    <div class="call-peer">${peer_name}</div>
                                </div>
                                <div class="item-time-call">
                                    <div class="date-time-start">${created_date_str}</div>
                                </div>
                                <div class="item-favorite">
                                    <div class="item-favorite-content"><span class="icon-favorite material-icons ${class_favorite}">star</span></div>
                                </div>
                            </div>`;
            })
            $('.list-content').append(items_html);

            $(".log-item-content").on("click", function() {
                let roomName = $(this).attr("log-roomname");
                let caller_str = participantCommon.getCurrentName();
                caller_str = caller_str.trim();
                common.PingUrl(function(dataPing) {
                    if (dataPing) {
                        if (!roomName) {
                            modalInfo("error");
                            return false;
                        }
                        let callee_str = roomNameCommon.removeName(caller_str, roomName);
                        common.call(callee_str);
                        sessionStorage.setItem("set_peer",callee_str);
                        waitingForJoinRoom.leftRoom(roomName);
                    }
                })
            })

            $('.item-favorite').on("click", function(event) {
                event.stopPropagation();
                let that = this;
                let roomName = $(this).parent().attr("log-roomname");
                let recordId = $(this).parent().attr("log-id");
                let name = participantCommon.getCurrentName();
                if (!roomName) return;
                let is_favorited = $(this).parent().find(".icon-favorite").hasClass("has_favorited");
                
                $.ajax({
                    "url": "/saveFavorite",
                    "type": "POST",
                    "contentType": "application/json; charset=utf-8",
                    "data": JSON.stringify({
                        "roomName": roomName,
                        "name": name,
                        "remove": is_favorited,
                        "recordId": recordId
                    })
                }).done(function(data){
                    if (is_favorited) {
                        $(that).find(".icon-favorite").removeClass("has_favorited");
                    } else {
                        $(that).find(".icon-favorite").addClass("has_favorited");
                    }
                })
            })
        });
    }

    getLogs();
    
    $(".container .load-more-content").on("click", function() {
        page++;
        getLogs();
    })
})