var connection = require('../database/index');
var findById = function (id, cb){
	connection.query('SELECT * FROM users where id = ?',[id], function (err, results) {
		if (err){
       		return cb(err);
       	}
		if(results){
			if(results.length >0){
				results = JSON.stringify(results);
				results = JSON.parse(results);				
				cb(undefined, results);
			}
	    }
	});
}

var getAllUsers = function (cb){
	connection.query('SELECT * FROM users', function (err, results) {
		if (err){
       		return cb(err);
       	}
		if(results){
			if(results.length >0){
				results = JSON.stringify(results);
				results = JSON.parse(results);				
				cb(undefined, results);
			}else{
				results = null;			
				cb(undefined, results);
			}
	    }
	});
}

var checkunreadmessages = function (username, cb){
	connection.query('SELECT msg_from, count(msg_from) AS CountMessage FROM chat_history where msg_to=? AND msg_seen=? group by msg_from',[username,0], function (err, results) {
		if (err){
       		return cb(err);
       	}
		if(results){
			if(results.length >0){
				results = JSON.stringify(results);
				results = JSON.parse(results);				
				cb(undefined, results);
			}
			else{
		    	results = null;
		    	console.log(results);
		    	cb(undefined, results);
		    }
	    }
	});
}

var logout = function (email, cb){
	connection.query('update users SET online = ? where email = ?',[0,email], function (error, results, fields) {
		if (error) {
			return cb(err);
		}
		if(results){
			if(results.length >0){
				cb(undefined, results);
			}
		}
	});
}
module.exports = { 
	//create, 
	logout, 
	findById,
	getAllUsers,
	checkunreadmessages
	//isAuthenticated 
};