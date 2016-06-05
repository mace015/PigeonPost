/* Pigeon Post API */
var port = 8080;

var config = require('./app/config');
var mysql = require('mysql');
var io = require('socket.io')();

var userController = require('./app/controllers/user');
var chatController = require('./app/controllers/chat');

var active = {
	clients: new Object(),
	users: new Object()
};

var database = mysql.createConnection({
	host: config.host,
	port: config.port,
	user: config.user,
	password: config.password,
	database: config.database
});

database.connect(function(err){
	if (err){
		console.log('Database connection error:' + err.stack);
		return;
	}

	console.log("Database connection established!");
});

Object.prototype.getKey = function(value){
	for(var key in this){
		if(this[key] == value){
			return key;
		}
	}
	return null;
};

io.on('connection', function(socket){

	console.log('New socket connection: ' + socket.id);
	active.clients[socket.id] = 0;

	userController(socket, database, active);
	chatController(socket, database, active);

	// User disconnects
	socket.on('disconnect', function(){
		if (active.clients[socket.id] != 0){
			delete active.users[ active.clients[socket.id] ];
		}
		delete active.clients[socket.id];
	});

	socket.emit('return:connection', 'Connected to Pigeon Post API on port ' + port);

});

io.listen(port);
console.log("Pigeon Post API started on port: " + port);