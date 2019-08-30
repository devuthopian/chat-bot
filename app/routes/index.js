var express = require('express');
var app = require('express')();
var path = require('path');
var fs = require('fs');
var connection = require('../database/index');
var sess;

	
var User = require('../models/user');

exports.check = function(req,res){

	console.log(req.session);

	//Session set when user Request our app via URL
	if (req.session.email) {
		res.redirect('/chatbox');
		next();
	}
	else
	{
	  	res.render('login', {
	  		success: req.flash('results'),
			errors: req.flash('error'), 
			showRegisterForm: req.flash('showRegisterForm')
	  	});
	}
}

exports.chats = function(req, res, next) {
	if (!req.session.email) {
		res.redirect('/');
	}else{
		/*sess = req.session;
		var userDate = new Date(Date.now());

		var calc_session_hours_minutes = parseInt(sess.cookie.expires.getHours()) + parseInt(sess.cookie.expires.getMinutes());

		var calc_hours_minutes = parseInt(userDate.getHours()) + parseInt(userDate.getMinutes());

		console.log('session expires on ' + calc_session_hours_minutes + ' and right now is'+ calc_hours_minutes);

	    if(calc_hours_minutes <= calc_session_hours_minutes)
	    {
	    	delete req.session.username;
			delete req.session.email;

			res.render('login', {
				success: 'Session Expired',
				errors: '', 
				showRegisterForm: ''
			});
	    }*/
	}

	sess = req.session;
	var hour = 360000;
	sess.cookie.expires = new Date(Date.now() + hour);
	sess.cookie.maxAge = hour;
	var userId = req.params.id;
	
	User.getAllUsers(function(err, results){
		if(err){
			console.log(err);
		}
		if(results){
			User.checkunreadmessages(sess.username, function(err, chatsresult){
				if(err){
					console.log(err);
				}
				if(chatsresult){
					res.render('chats', {
				  		success: '',
						name: sess.username,
						image: sess.image,
						user_type: sess.user_type,
						requestuser: results,
						chatsresult: chatsresult,
						errors: '',
						showRegisterForm: ''
					});
				}else{
					res.render('chats', {
				  		success: '',
						name: sess.username,
						image: sess.image,
						user_type: sess.user_type,
						requestuser: results,
						chatsresult: null,
						errors: '',
						showRegisterForm: ''
					});
				}
			});
		}
	});
}

exports.logout = function(req,res) {
	var email = req.session.email;
	connection.query('update users SET online = ? where email = ?',[0,email], function (err, results, fields) {
		if(err){
			console.log(err);
		}else{
			delete req.session.username;
			delete req.session.email;

			res.render('login', {
				success: 'Goodbye',
				errors: '', 
				showRegisterForm: ''
			});
		}
	});
}

// Register via username and password
exports.register = function(req, res, next) {
	//app.use(express.static(path.join(__dirname)));
  	res.render('register', {
		success: '',
		errors: '', 
		showRegisterForm: ''
	});
}

exports.SaveUser = function(req,res){

	if (!req.files)
 	return res.status(400).send('No files were uploaded.');

	var file = req.files.uploaded_image;
	var img_name = file.name;

	if(file.mimetype == "image/jpeg" ||file.mimetype == "image/png"||file.mimetype == "image/gif" ){
                                 
		file.mv('public/chats/images/upload_images/'+file.name, function(err) {
		         
			if (err)
			return res.status(500).send(err);

			//console.log("req",req);
			var today = new Date();
			var users={
				"email":req.body.txtEmail,
				"username":req.body.txtUsername,
				"password":req.body.txtPassword,
				"user_type":'user',
				"image":img_name,
				"online": 0,
				"updated_at":today,
				"created_at":today
			}


		    connection.query('INSERT INTO users SET ?',users, function (error, results, fields) {
			    if (error) {
			        console.log("error ocurred",error);
			    }else{
			        //console.log('The solution is: ', results);
			        res.render('login', {
						success: req.flash('results'),
						errors: req.flash('error'), 
						showRegisterForm: req.flash('showRegisterForm')
					});
			    }
			});
		}); 
	}else {
		message = "This format is not allowed , please upload file with '.png','.gif','.jpg'";
		res.render('login',{message: message});
	}
}

exports.login = function(req,res){

	sess = req.session;
	var hour = 360000;
	sess.cookie.expires = new Date(Date.now() + hour);
	sess.cookie.maxAge = hour;

    var today = new Date();
    var email = req.body.txtEmail;
    var password = req.body.txtPassword;
    var online = 1;
	connection.query('SELECT * FROM users WHERE email = ?',[email], function (error, results, fields) {
		if (error) {
			console.log("error ocurred",error);
			res.render('login', {				
				errors: req.flash('error')
			});
		}
		else{
			if(results.length >0){
				results = JSON.stringify(results);
				results = JSON.parse(results);
				var username = results[0].username;
				var email = results[0].email;
				var image = results[0].image;
				var user_type = results[0].user_type;

				if(results[0].password == password){
					sess.email = email; // equivalent to $_SESSION['email'] in PHP.
    				sess.username = username; // equivalent to $_SESSION['username'] in PHP.
    				sess.image = image; // equivalent to $_SESSION['image'] in PHP.
    				sess.user_type = user_type;
					connection.query('update users SET online = ? where email = ?',[online,email], function (error, results, fields) {
		    			if (error) {}
		    		});
    				sess.online = online;
		    		res.redirect('/chatbox');
				}
			  	else{
					res.send({
						"code":204,
						"success":"Email and password does not match"
					});
			  	}
			}
			else{
				res.render('login', {
					success: '',
					errors: "Email does not exits", 
					showRegisterForm: 'showRegisterForm'
				});
			}
		}
	});
}
