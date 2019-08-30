var session 	= require('express-session');
//var db 		    = require('../database');
var config 		= require('../config');

/**
 * Initialize Session
 *
 */
var init = function () {
	if(process.env.NODE_ENV === 'production') {
		return session({
			secret: 'keyboard cat',
			resave: true,
			saveUninitialized: true,
			cookie: { maxAge: 360000, expires: new Date(Date.now() + 360000) },
			cookieName: 'session'			
		});
	} else {
		return session({
			secret: 'keyboard cat',
			resave: true,
			saveUninitialized: true,
			cookie: { maxAge: 360000, expires: new Date(Date.now() + 360000) },
			cookieName: 'session'
		});
	}
}

module.exports = init();