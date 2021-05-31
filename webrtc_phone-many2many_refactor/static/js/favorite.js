$(document).ready(function() {
    var page = 1;
    getFavorites = function (reset=false) {
        let name = participantCommon.getCurrentName();
        let id = $("#contactFormId").val();
        $.ajax({
            "url": "/getListFavorites",
            "type": "POST",
            "contentType": "application/json; charset=utf-8",
            "data": JSON.stringify({
                "id": id,
                "name": name,
                "page": page
            })
        }).done(function(data) {
            if (reset) {
                page = 1;
                $('.list-content').html("");
            }
            if (parseInt(data.data.total) > parseInt(page)) {
                $(".load-more-content").show();
            } else {
                $(".load-more-content").hide();
            }
            
            let  items_html = "";
            $.each(data.data.list, function(k, item) {
                let room_txt = roomNameCommon.removeName(participantCommon.getCurrentName(), item.room_name);
                let class_fv = "";
                if (item.priority) {
                    class_fv = "has_favorited";
                }
                items_html += `<div class="fv-item-content clearfix" fv-roomname="${item.room_name}" id="${item.id}">
                                <div class="item-fv">
                                    <h6 class="fv-name">${room_txt}</h6>
                                </div>
                                <div class="item-fv-controls">
                                    <span class="material-icons icon-favorite ${class_fv}">star</span>
                                    <span class="material-icons icon-delete">delete_forever</span>
                                </div>
                            </div>`;
            })
            
            $('.list-content').append(items_html);
            $(".fv-item-content").on("click", function() {
                let roomName = $(this).attr("fv-roomname");
                let caller_str = participantCommon.getCurrentName();
                common.PingUrl(function(dataPing) {
                    if (dataPing) {
                        if (!roomName) {
                            modalInfo("error");
                            return false;
                        }
                        let callee_str = roomNameCommon.removeName(caller_str, roomName);
                        sessionStorage.setItem("set_peer",callee_str);
                        common.call(callee_str);
                        waitingForJoinRoom.leftRoom(roomName);
                    }
                })
            })

            $('.fv-item-content .icon-favorite').on("click", function(event) {
                event.stopPropagation();
                let that = this;
                let id = $(this).parent().parent().attr("id");
                let is_favorited = $(this).hasClass("has_favorited");
                if (!id) return;
                $.ajax({
                    "url": "/updateFavorite",
                    "type": "POST",
                    "contentType": "application/json; charset=utf-8",
                    "data": JSON.stringify({
                        "id": id,
                        "remove": is_favorited
                    })
                }).done(function(data){
                    if (is_favorited) {
                        $(that).removeClass("has_favorited");
                    } else {
                        $(that).addClass("has_favorited");
                    }
                    getFavorites(true);
                })
            })

            $('.fv-item-content .icon-delete').on("click", function(event) {
                event.stopPropagation();
                let that = this;
                let id = $(this).parent().parent().attr("id");
                let roomName = $(this).parent().parent().attr("fv-roomname");
                let name = participantCommon.getCurrentName();
                //let is_favorited = $(this).hasClass("has_favorited");
                if (!id) return;
                $.ajax({
                    "url": "/deleteFavorite",
                    "type": "POST",
                    "contentType": "application/json; charset=utf-8",
                    "data": JSON.stringify({
                        "id": id,
                        "roomName": roomName,
                        "name": name
                    })
                }).done(function(data){
                    $(that).parent().parent().remove();
                })
            })
        });
    }

    getFavorites();

    $(".container .load-more-content").on("click", function() {
        page++;
        getFavorites();
    })
})