//Note almost all the socket emit initilize to server.js in the root folder

var socket = io(); // initialize socket
var from1 = $('#user').val();
var message1 = $('#message-to-send').val();
socket.emit('whoisonline', from1, message1); //emit socket whoisonline

//when message is sumbit by send button
function submitfunction(){
    var from = $('#user').val();
    var message = $('#message-to-send').val();    
    $('#num_'+from).text(''); // remove notification on submit, if any 
    $('#notif_'+from).removeAttr('class'); //remove class for notification
    var country = $('#country').val();
    console.log(country);
    if(message != '') {
        socket.emit('chatMessage', from, message, country, 'sessionname', 'user_type'); // emit chatmessage on submit
        socket.emit('unreadmsg', from, message); //emit unreadmsg for notification on submit
    }
    $('#message-to-send').val('').focus();
    return false;
}

//onkeyup it's trigger this function to notify when typing
function notifyTyping() { 
    var user = $('#user').val();
    var to = $('.response').attr('data-name');
    socket.emit('notifyUser', user, to); //emit notifyuser
}

//getclear function is used to get the messages on chathistory
function getclear(username){
    var me = $('#user').val();
    /**** Chat Message ****/
    var color = (username != me) ? '<li><div class="message my-message">' : '<li class="clearfix"><div class="message other-message float-right">';
    var from = (username != me) ? 'Me' : username;

    var jsDate = new Date();
    var month = jsDate.toLocaleString("en-us", { month: "long" });
    var day = jsDate.getDate();
    var year = jsDate.getUTCFullYear();

    var time = jsDate.getHours();
    time = (time >= 12) ? "PM" : "AM";

    newdate = month + ' ' + day + ' '+ time;

    var chat = [color, from, newdate];

    return chat;
}

//chatmessage to show the recent chat when entered send button
socket.on('chatMessage', function(from, msg, sessionname, user_type){

    var returnvalue = getclear(from); //calling function here
    color = returnvalue[0];
    from = returnvalue[1];
    newdate = returnvalue[2];

    var name = $('#login-user-name').val();

    var chatname = $('.response').attr('data-name');

    var country = $('.country_'+name).val();

    
    if(name == sessionname){
        $('.WelcomeImage').remove();
         msg = msg.replace(/\n/g, "<br />");
        if(msg.indexOf('credit card') >= 0 && user_type == 'user') {
            $("#messages").append(color + '' + from + '</b>: <span class="chkmsg"><i>The Message is Private</i></span> <sup>' +newdate+'</div></li>');
        }else{
            //msg = msg.replace('/n', '<br />');
            $("#messages").append(color + '' + from + '</b>: <span class="chkmsg">' + msg+ '</span> <sup>' +newdate+'</sup></div></li>');
        }
        $('.chat-history').scrollTop($('.chat-history')[0].scrollHeight);
    }
});

//unread message to show the count(number) of messages
socket.on('unreadmsg', function(to, username, msg, user_type){

    var returnvalue = getclear(username); //calling function here
    color = returnvalue[0];
    from = returnvalue[1];
    newdate = returnvalue[2];

    var countmsg;
    var current_user = $('#login-user-name').val();
    if(to == current_user){
        $('.WelcomeImage').remove();
        countmsg = $('#num_'+username).text();
        if(countmsg == ''){
            countmsg = 0;
        }
        $('#notif_'+username).attr('class', 'notif');
        message = parseInt(countmsg) + 1;
        if($('.response').attr('data-name') == username){
             msg = msg.replace(/\n/g, "<br />");
            if(msg.indexOf('credit card') >= 0 && user_type == 'admin') {
                $("#messages").append(color + '' + from + '</b>: <span class="chkmsg"><i>The Message is Private</i></span> <sup>' +newdate+'</div></li>');
            }else{
               // msg = msg.replace('/n', '<br />');
                $("#messages").append(color + '' + from + '</b>: <span class="chkmsg">' + msg+ '</span> <sup>' +newdate+'</sup></div></li>');
            }
        }
        $('#num_'+username).text(message);
        $('.chat-history').scrollTop($('.chat-history')[0].scrollHeight);
    }
});


socket.on('notifyUser', function(user, to){
    var me = $('#user').val();
    if(user == me) {
        //var name = $('#login-user-name').val();
        //if(to == name){
            $('#notifyUser').text(user + ' is typing ...');
        //}
    }
    setTimeout(function(){ $('#notifyUser').text(''); }, 10000);;
});

//who-is-online, to get the online users
socket.on('whoisonline', function(user, online){
    $(".status").each(function() {
        if($( this ).attr('data-name') == user){
            if(online == 1){
                $(this).html('<i class="fa fa-circle online"></i> online');
            }
            else{
                $(this).html('<i class="fa fa-circle"></i> offline');
            }
        }
    });
    $(".select").each(function() {
        if($( this ).attr('data-username') == user){
            if(online == 1){
                $(this).attr('data-online', 1);
            }
            else{
                $(this).attr('data-online', 0);
            }
        }
    });
});

$(document).ready(function(){

    var setCountry = $('#country');
    $.each(country, function(val, text) {
        setCountry.append(
            $('<option></option>').val(text).html(val)
        );
    });

    $( setCountry ).change(function() {
        var str = $(this).attr('class');
        var name = $(this).attr('name');
        var classlanguage = str.substr(0,str.indexOf(' '));
        var langclass = $('.'+classlanguage).val();

        socket.emit('savelanguage', langclass, name);
    });

    var map = {13: false, 16: false};
    $('#message-to-send').keydown(function(e) {
        if (e.keyCode in map) {
            map[e.keyCode] = true;
           /* if(map[13]){
                var currentVal = $('textarea').val();
                $('textarea').val(currentVal + '<br />');
            }*/

            /*var textareaval = $('textarea').val();
            textareaval = textareaval.replace(/\b<br \/>\b/g, '<del><br /></del>');
            $('textarea').val(textareaval);*/

            if (map[13] && map[16]) {
                $('#sendbutton').click();
                return false;
            }
        }
    }).keyup(function(e) {
        if (e.keyCode in map) {
            map[e.keyCode] = false;
        }
    });

        //scroll function to get the old messages in chat history
    $('.chat-history').scroll(function () {
        setTimeout(
            function() 
            {
                var scrollposition = $('.chat-history').scrollTop();
                if($('.chat-history').scrollTop() == 0){
                    console.log($('.chat-history').scrollTop());
                    $('.response').html('<img src="chats/images/loader.gif" class="loaderload">');
                    var from = $('#login-user-name').val();
                    var name = $('.response').attr('data-name');  
                    var mymessage = $('.message').length;
                    var scrollvalue = $('.message').first().attr('id', 'addValue');
                    setTimeout(
                    function() 
                    {   //emit loadmoremsg with return the position to 400
                        socket.emit('loadmoremsg', from, name, mymessage, 400); 
                    }, 450);
                }else{
                    $('.response').html('');
                }
        }, 20);
    });
       

    if($('.chat-with').text() == ''){
        $('#message-to-send').prop('disabled', true);
    }
    var name = $('.select').attr('data-username');
    var online = $('.select').attr('data-online');
    $('.chat-with').html(name);
    if(online == 1){
        $('.chat-num-messages').html('online');
    }else{
        $('.chat-num-messages').html('offline');
    }
    $('#user').val();
    $('.select').click(function(e){
        var name = $(this).attr('data-username');
        var imageurl = $(this).children().attr('src');
        $('.response').attr('data-name', name);

        //$('#icon_'+name).hide();
        $('#num_'+name).text('');
        $('#notif_'+name).removeAttr('class');

        $('#message-to-send').prop('disabled', false);
        var from = $('#login-user-name').val();
        $('.WelcomeImage').remove();
        $( ".message_"+from ).empty();

        socket.emit('checkmessage', from, name, 'message1', 'time');   

        var online = $(this).attr('data-online');
        $('.chat-with').html(name);
        $('.main_img').attr('src', imageurl);

        if(online == 1){
            $('.chat-num-messages').html('online');
        }else{
            $('.chat-num-messages').html('offline');
        }
        $('#user').val(name);

    });

    //checkmessage will return the messages form database
    socket.on('checkmessage', function(from, to , msg, msg_created_at, sessionname, loadmoremsg, sessionusertype, position){
        if(msg != ''){
            msg = msg.replace(/\n/g, "<br />");
            var me = $('#user').val();
            var color = (from != me) ? '<li><div class="message my-message">' : '<li class="clearfix"><div class="message other-message float-right">';
            var from = (from != me) ? 'Me' : from;

            //var created_at = msg_created_at.slice(0, msg_created_at.indexOf("T"));
            var dateParts = msg_created_at.split("-");
            var jsDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2].substr(0,2), dateParts[2].substr(3, 2), dateParts[2].substr(6, 2), dateParts[2].substr(9, 2));          

            var month = jsDate.toLocaleString("en-us", { month: "long" });
            var day = jsDate.getDate();
            var year = jsDate.getUTCFullYear();

            var time = jsDate.getHours() - jsDate.getTimezoneOffset() / 60;
            time = (time >= 12) ? "PM" : "AM";
            // var time = jsDate.getHours() + ':' + jsDate.getMinutes();

            newdate = month + ' ' + day + ' ' + time;

            var name = $('#login-user-name').val();
            //console.log('.message_'+name);
            if(name == sessionname){
                $('.WelcomeImage').remove();
                if(loadmoremsg == 1){
                    $('.response').html('');

                    $('.message_'+name).prepend(color + '' + from + '</b>: <span class="chkmsg">' + msg + '</span> <sup>' +newdate+'</sup></div></li>');

                    $('.chkmsg').each(function(index, el) {
                        if($(this).is(':contains("credit card")') && sessionusertype == 'user'){
                            $(this).html('<i>The Message is Private</i>');
                        }
                    });

                }else{
                    $('.message_'+name).append(color + '' + from + '</b>: <span class="chkmsg">' + msg + '</span> <sup>' +newdate+'</sup></div></li>');

                    $('.chkmsg').each(function(index, el) {

                        if($(this).is(':contains("credit card")') && sessionusertype == 'user'){
                            $(this).html('<i>The Message is Private</i>');
                        }
                    });

                }

                if(loadmoremsg == 1){
                    //setTimeout(
                    //function() 
                    //{ 
                        if($("#addValue").length != 0) {
                            var x = $("#addValue").position();
                            $('.chat-history').animate({
                                scrollTop: $("#addValue").position().top
                            }, 60);
                        }
                    //}, 480);                 

                }else{
                    $('.chat-history').scrollTop($('.chat-history')[0].scrollHeight);
                }
            }
        }else{
            var name = $('#login-user-name').val();
            if(name == sessionname){
                $('.response').html('');
                if($('.notification').first().text() != 'No more messages'){
                    $('.message_'+name).prepend('<li><div class="message notification">No more messages</div></li>');
                }
            }
        }
    });
});