// Pidgeon Post: Chat controller
module.exports = function(socket, database, active){

	// Get latest chats from a specific chat.
	socket.on('chats:fetch', function(){

		if (active.clients[socket.id] == 0){ socket.emit('return:chats:fetch', { status: false, error: 6 }); return false; }

		var user_id = active.clients[socket.id];

		database.query("SELECT `user_from`, `user_to`, `message`, `datetime` FROM `chats` WHERE (`user_from` = ? OR `user_to` = ?) GROUP BY `user_from`, `user_to` ORDER BY `datetime` DESC LIMIT 10", [user_id, user_id], function(err, results){
			if (!err){
				socket.emit('return:chats:fetch', { status: true, users: results });
			} else {
				socket.emit('return:chats:fetch', { status: false, error: 7 });
			}
		});

	});

	// Get specifc chat messages.
	socket.on('chat:fetch', function(data){

		if (active.clients[socket.id] == 0){ socket.emit('return:chat:fetch', { status: false, error: 6 }); return false; }

		var user_id = active.clients[socket.id];

		database.query("SELECT * FROM `chats` WHERE (`user_from` = ? or `user_to` = ?) or (`user_from` = ? or `user_to` = ?) ORDER BY `datetime` DESC LIMIT %?%, %?%", [user_id, data.user, data.user, user_id, data.start, data.stop], function(err, results){
			if (!err){
				socket.emit('return:chat:fetch', { status: true, users: results });
			} else {
				socket.emit('return:chat:fetch', { status: false, error: 7 });
			}
		});

	});

	// Send a message.
	socket.on('chat:send', function(data){

		if (active.clients[socket.id] == 0){ socket.emit('return:chat:send', { status: false, error: 6 }); return false; }

		var user_id = active.clients[socket.id];

		database.query("INSERT INTO `chats` (`user_from`, `user_to`, `message`, `datetime`) VALUES (?, ?, ?, NOW())", [user_id, data.to, data.message], function(err ,results){
			if (!err){
				socket.emit('return:chat:send', { status: true });
				console.log('New message from user ' + user_id + ' to user ' + data.to + ' with message: ' + data.message);
				if (active.users[data.to]){
					var socket_to = active.users[data.to];
					io.clients[socket_to].emit('new:message', { user_from: user_id, message: data.message });
				}
			} else {
				console.log(err);
				socket.emit('return:chat:send', { status: false, error: 7 });
			}
		});

	})

};