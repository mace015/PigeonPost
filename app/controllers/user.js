// Pidgeon Post: User controller
var config = require('./../config');
var passwordHash = require('password-hash');
var jwt = require('jsonwebtoken');

module.exports = function(socket, database, active){

	//User register
	socket.on('user:register', function(data){

		if (!data.email || !data.password){
			return socket.emit('return:user:register', { status: false, error: 2 });
		}

		var users = function(email){
			return database.query("SELECT `id`,`email`,`password` FROM `users` WHERE `email` = ?", [email], (err, results) => {
				if (err) return false;
				return results;
			});
		}(data.email);

		if (users.length > 0){
			return socket.emit('return:user:register', { status: false, error: 1 });
		}

		var user = function(email, password){
			return database.query("INSERT INTO `users` (`email`, `password`) VALUES (?, ?)", [email, password]);
		}(data.email, passwordHash.generate(data.password));

		console.info('New user: ' + data.email);
		return socket.emit('return:user:register', { status: true });

	});

	// User login
	socket.on('user:login', function(data){

		database.query("SELECT `id`,`email`,`password` FROM `users` WHERE `email` = ?", [data.email], (err, results) => {

			if (err) { socket.emit('return:user:login', { status: false, error: 7 }); return false; };

			user = results[0];

			if (!user){
				return socket.emit('return:user:login', { status: false, error: 3 });
			}

			if (!passwordHash.verify(data.password, user.password)){
				return socket.emit('return:user:login', { status: false, error: 3 });
			}

			delete user.password;
			var token = jwt.sign(user, config.secretKey);
			active.clients[socket.id] = user.id;
			activeKey = active.users.getKey(socket.id);
			if (activeKey !== null){
				delete active.users[activeKey];
			}
			active.users[user.id] = socket.id;
			console.log("Socket " + socket.id + " logged in as " + user.email);
			return socket.emit('return:user:login', { status: true, token: token });

		});

	});

	// User verify jwt
	socket.on('user:verify', function(data){

		if (!data.token){
			return socket.emit('return:user:verify', { status: false, error: 5 });
		}

		jwt.verify(data.token, config.secretKey, function(err, decoded){
			if (err){
				return socket.emit('return:user:verify', { status: false, error: 4 });
			}

			active.clients[socket.id] = decoded._id;
			activeKey = active.users.getKey(socket.id);
			if (activeKey !== null){
				delete active.users[activeKey];
			}
			active.users[decoded._id] = socket.id;
			console.log("Socket " + socket.id + " logged in as " + decoded.email);
			return socket.emit('return:user:verify', { status: true });

		});

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