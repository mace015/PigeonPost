// Pidgeon Post: User controller
var config = require('./../config');
var passwordHash = require('password-hash');
var jwt = require('jsonwebtoken');

module.exports = function(socket, database, active){
	
	// Find users
	/*socket.on('user:search', function(data){
		if (active.clients[socket.id] == 0){ socket.emit('return:user:search', { status: false, error: "No permission!" }); return false; }
		
		database.query("SELECT `id`,`email` FROM `users` WHERE `email` LIKE '%?%' LIMIT 20", array(data.email), function(err, results){
			if (!err){
				socket.emit('return:user:search', { status: true, users: results });
			} else {
				socket.emit('return:user:search', { status: false });
			}
		});
	});

	// Add friend
	socket.on('user:addFriend', function(data){
		if (active.clients[socket.id] == 0){ socket.emit('return:user:search', { status: false, error: "No permission!" }); return false; }

		database.query("SELECT 1 FROM `friends` WHERE (`user_a` = ? AND `user_b` = ?) OR (`user_b` = ? AND `user_a` = ?) LIMIT 1", array(active.clients[socket.id], data.friend, active.clients[socket.id], data.friend), function(err, results){
			if (results.length == 0){
				database.query("INSERT INTO `friends` (`user_a`, `user_b`) (?, ?)", array(active.clients[socket.id], data.friend));
				socket.emit('return:user:addFriend', { status: true });
			} else {
				socket.emit('return:user:addFriend', { status: false });
			}
		});
	});*/

	//User register
	socket.on('user:register', function(data){
		if (data.email && data.password){
			database.query("SELECT `id` FROM `users` WHERE `email` = ?", [data.email], function(err, results){
				if (!err && results.length == 0){
					var email = data.email;
					var password = passwordHash.generate(data.password);

					database.query("INSERT INTO `users` (`email`, `password`) VALUES (?, ?)", [email, password]);
					console.log('New user: ' + email);
					socket.emit('return:user:register', { status: true });
				} else {
					socket.emit('return:user:register', { status: false, error: 1 });
				}
			});
		} else {
			socket.emit('return:user:register', { status: false, error: 2 });
		}
	});

	// User login
	socket.on('user:login', function(data){
		database.query("SELECT `id`,`email`,`password` FROM `users` WHERE `email` = ? LIMIT 1", [data.email], function(err, results){
			if (!err && results.length == 1){
				var user = results[0];
				if (passwordHash.verify(data.password, user.password)){
					delete user.password;
					var token = jwt.sign(user, config.secretKey);
					active.clients[socket.id] = user.id;
					activeKey = active.users.getKey(socket.id);
					if (activeKey !== null){
						delete active.users[activeKey];
					}
					active.users[user.id] = socket.id;
					console.log("Socket " + socket.id + " logged in as " + user.email);
					socket.emit('return:user:login', { status: true, token: token });
				} else {
					socket.emit('return:user:login', { status: false, error: 3 });
				}
			} else {
				socket.emit('return:user:login', { status: false, error: 3 });
			}
		});
	});

	// User verify jwt
	socket.on('user:verify', function(data){
		if (data.token){
			jwt.verify(data.token, config.secretKey, function(err, decoded){
				if (err){
					socket.emit('return:user:verify', { status: false, error: 4 });
				} else {
					active.clients[socket.id] = decoded._id;
					activeKey = active.users.getKey(socket.id);
					if (activeKey !== null){
						delete active.users[activeKey];
					}
					active.users[decoded._id] = socket.id;
					console.log("Socket " + socket.id + " logged in as " + decoded.email);
					socket.emit('return:user:verify', { status: true });
				}
			});
		} else {
			socket.emit('return:user:verify', { status: false, error: 5 });
		}
	})

	// User logout
	socket.on('user:logout', function(){
		if (active.clients[socket.id] != 0){
			delete active.users[ active.clients[socket.id] ];
			active.clients[socket.id] = 0;
		}
		socket.emit('return:user:logout', { status: true });
	});	
	
};