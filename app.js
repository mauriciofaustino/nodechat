
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
//io.enable("browser client gzip");
io.set("log level",1);
io.set("transports", ["xhr-polling"]);
io.set("polling duration", 10);

io.on("connection", function(client) {
	console.log("novo cliente conectado");
	
	client.on("novo-produto", function(produto) {
		console.log("recebi um novo produto");
		client.get("usuario", function(error,usuario) {
			produto.email=usuario.email;
			console.log(produto);
			//client.broadcast.emit("novo-produto-disponivel", produto);
			io.sockets.in(usuario.categoria).emit("novo-produto-disponivel", produto);
		});
		
	});
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
		if(usuario.senha.length >= 6) {
			client.set("usuario", usuario);
			client.join(usuario.categoria);
			callback({
				sucesso:true,
				mensagem : "Logado como " + usuario.email + " na categoria " + usuario.categoria
			})
		} else {
			callback({
				sucesso:false,
				mensagem : "senha muito curta"
			})
		}
	});

});


