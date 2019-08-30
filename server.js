var express = require('express');
//var session = require('express-session');
var app = express();
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var translate = require('translate');
var flash = require('req-flash');
var connection = require('./app/database');
var fileUpload = require('express-fileupload');

translate.engine = 'yandex';
translate.key = 'trnsl.1.1.20180605T124139Z.ddddb9036352b782.778bf8f027ba3810469e7e8426f6866e11cb004b';

//var ioServer = require('./app/socket')(app);

var routes = require('./app/routes'); //set route for home page, and others(following MVC structure as Laravel)

var http = require('http').createServer(app); //to call on which server
var io = require('socket.io')(http);
var ios = require('socket.io-express-session');
var User = require('./app/models/user');

var session = require('./app/session');

var sharedsession = require("express-socket.io-session");

var logger = require('./app/logger');

// View engine setup
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());
app.use(express.static('public'));
//app.use(express.static('public'));

app.set('trust proxy', 1); // trust first proxy
app.use(session);
io.use(ios(session));

// Register events on socket connection
io.on('connection', function(socket){
	var sess = socket.handshake.session;
	var username = sess.username;
	var online = sess.online;
	var admin = sess.user_type;

    socket.on('chatMessage', function(from = username, msg, country){
    	var current_date = new Date(Date.now());
		var set_target = sess.cookie.expires.getTime();
		var set_now = current_date.getTime();

    	if(set_target <= set_now){
			sess.username = null;
			sess.email = null;
			sess.destroy();

			app.get(function(req, res, next){
				return res.redirect('/');
				res.render('login', {
			  		success: 'session timeout',
					errors: req.flash('error'), 
					showRegisterForm: req.flash('showRegisterForm')
			  	});
			});
		}else{

			var hour = 360000;
			sess.cookie.expires = new Date(Date.now() + hour);
			sess.cookie.maxAge = hour;

			console.log('session expires on ' + set_target + ' and right now is'+ set_now);
		}
		
		var messagetext;
    	var today = new Date();
    	translate(msg, country).then(text => {
			msg = text;
			console.log(msg);  // Hola mundo
		
			var chat_history={
		        "msg_to":from,
		        "msg_from":username,
		        "message":msg,
		        "country": country,
		        "msg_seen": 0,
		        "updated_at":today,
		        "created_at":today
		    }

			connection.query('INSERT INTO chat_history SET ?',chat_history, function (error, results, fields) {
			    if (error) {
			        console.log("error ocurred",error);
			    }
			});

			connection.query('update chat_history SET msg_seen = ? where msg_from= ? AND msg_to= ?',[1,from,username], function (error, results, fields) {
			    if (error) {
			        console.log("error ocurred",error);
			    }
			});

	        io.emit('chatMessage', username, msg, sess.username, sess.user_type);
        });
    });

    socket.on('savelanguage', function(langclass, name){

    	connection.query('UPDATE users SET country = ? where username = ?',[langclass,name], function (error, results, fields) {
		    if (error) {
		        console.log("error ocurred",error);
		    }
		});
    	io.emit('savelanguage', langclass, name);
    });

    socket.on('unreadmsg', function(from = username, msg){
    	io.emit('unreadmsg', from, username, msg, sess.user_type);
    });

    socket.on('loadmoremsg', function(from, to, mymessage, position){
		results = null;

		var current_date = new Date(Date.now());
		var set_target = sess.cookie.expires.getTime();
		var set_now = current_date.getTime();

    	if(set_target <= set_now){
			sess.username = null;
			sess.email = null;
			sess.destroy();
			app.get(function(req, res, next){
				res.render('login', {
			  		success: 'session timeout',
					errors: req.flash('error'), 
					showRegisterForm: req.flash('showRegisterForm')
			  	});
			});
		}else{

			var hour = 360000;
			sess.cookie.expires = new Date(Date.now() + hour);
			sess.cookie.maxAge = hour;

			console.log('session expires on ' + set_target + ' and right now is'+ set_now);
		}

		if(from == sess.username)
		{
	    	connection.query('SELECT * FROM chat_history where msg_from=? AND msg_to=? OR msg_from = ? AND msg_to=? ORDER BY ID DESC LIMIT 10 OFFSET ?',[from,to,to,from,mymessage], function (error, results) {
			    if (error) {
			        console.log("error ocurred",error);
			    }else{
			        //console.log('The solution is: ', results);
			        if(results.length >0){
			        	var loadmoremsg = 1;
						results = JSON.stringify(results);
						results = JSON.parse(results);
						for (var i = 0; i < results.length; i++) {
							var msg_from = results[i].msg_from;
							var msg_to = results[i].msg_to;
							var msg = results[i].message;
							var msg_created_at = results[i].created_at;
							//console.log(msg);
			        		io.emit('checkmessage', msg_from, msg_to, msg, msg_created_at, sess.username, loadmoremsg,sess.user_type, position);
						}
		        	}else{
		        		io.emit('checkmessage', '', '', '', '', sess.username, loadmoremsg);
		        	}
			    }
			});
		}        
    });

    socket.on('checkmessage', function(from, to, msg){
    	results = null;

    	var current_date = new Date(Date.now());
		var set_target = sess.cookie.expires.getTime();
		var set_now = current_date.getTime();

    	if(set_target <= set_now){
			sess.username = null;
			sess.email = null;
			sess.destroy();
			app.get(function(req, res, next){
				res.render('login', {
			  		success: 'session timeout',
					errors: req.flash('error'), 
					showRegisterForm: req.flash('showRegisterForm')
			  	});
			});
		}else{

			var hour = 360000;
			sess.cookie.expires = new Date(Date.now() + hour);
			sess.cookie.maxAge = hour;

			console.log('session expires on ' + set_target + ' and right now is'+ set_now);
		}

	    //connection.query('SET time_zone = ?', '+05:30');
	    connection.query('update chat_history SET msg_seen = ? where msg_from= ? AND msg_to= ?',[1,to,from], function (error, results, fields) {
		    if (error) {
		        console.log("error ocurred",error);
		    }
		});

		if(from == sess.username)
		{
	    	connection.query('SELECT * FROM (SELECT * FROM chat_history where msg_from=? AND msg_to=? OR msg_from = ? AND msg_to=? ORDER BY ID DESC LIMIT 10) sub ORDER BY id ASC',[from,to,to,from], function (error, results) {
			    if (error) {
			        console.log("error ocurred",error);
			    }else{
			        //console.log('The solution is: ', results);
			        if(results.length >0){
			        	var loadmoremsg = 0;
						results = JSON.stringify(results);
						results = JSON.parse(results);
						for (var i = 0; i < results.length; i++) {						
							var msg_from = results[i].msg_from;
							var msg_to = results[i].msg_to;
							var msg = results[i].message;
							var msg_created_at = results[i].created_at;
			        		io.emit('checkmessage', msg_from, msg_to, msg, msg_created_at, sess.username, loadmoremsg, sess.user_type);
						}
		        	}
			    }
			});
		}
    });

    socket.on('notifyUser', function(user = username,to){
        io.emit('notifyUser', username, to);
    });

    socket.on('whoisonline', function(user = username, msg = online){
        io.emit('whoisonline', username, online);
    });

    socket.on('disconnect', function(user = username, msg = 0){
        io.emit('whoisonline', username, 0);
	});
});


app.use(flash());

app.get('/', routes.check);
app.get('/register', routes.register);
app.post('/register', routes.SaveUser);
app.post('/login', routes.login);
app.get('/chatbox', routes.chats);
app.get('/logout', routes.logout);

// Middleware to catch 404 errors
app.get(function(req, res, next) {
	res.status(404).sendFile(process.cwd() + '/app/views/404.htm');
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});

app.listen(8081 || 4000, function(){
    console.log('Your node js server is running');
});