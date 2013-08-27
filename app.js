
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io.enable("browser client minification");
io.enable("browser client etag");
io.enable("browser client gzip");
io.set("log level",1);
io.set("transports", ["xhr-polling"]);
io.set("polling duration", 10);

io.on("connection", function(client) {
	console.log("novo cliente conectado");

	client.on("disconnect", function() {
		console.log("desconectando");
		client.get("usuario", function(error,usuario){
			var logado = (usuario !== undefined && usuario !== null);
			if(logado) {
				console.log("desconectando o usuario " + usuario.email);
				client.broadcast.emit("logout", usuario.email);
			}
		});
	});

	client.on("login", function(usuario, callback) {
		console.log(usuario);
		if(isEmail(usuario.email)) {
			client.set("usuario", usuario);
			client.join(usuario.sala);
			client.broadcast.emit("entrou", usuario.email);
			callback({
				sucesso:true,
				mensagem : "Logado como " + usuario.email + " na categoria " + usuario.categoria
			})
		} else {
			callback({
				sucesso:false,
				mensagem : "E-mail invalido"
			})
		}
	});

	client.on("mensagem", function(mensagem) {
		console.log("recebi uma nova mensagem: ");
		client.get("usuario", function(error,usuario) {
			mensagem = mensagem.replace(/(<([^>]+)>)/ig,"");
			var msg = {
				"usuario" : usuario,
				"mensagem" : mensagem
			};
			console.log(msg);
			io.sockets.in(usuario.sala).emit("nova-mensagem", msg);
		});
		
	});

	function isEmail(email){
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test(email);
	}

});


