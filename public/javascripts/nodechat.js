$(function() {
	var socket = io.connect(document.URL);
	
	socket.on("connecting", function() {
		console.log("Conectando...");
	});

	socket.on("connect", function() {
		console.log("Conectado");
	});

	socket.on("disconnect", function() {
		console.log("Desconectado");
	});

	socket.on("error", function() {
		console.log("deu erro !");
	});

	socket.on("reconnecting", function() {
		console.log("terntando reconectar");
	});

	socket.on("logout", function(email) {
		console.log("deslogando o usuario " + email);
		var conteudo = "<strong>"+email+" saiu...</strong>";

		var p = $("<p />");
		p.html(conteudo);
		$("#mensagens").append(p);
	});

	$("#login").submit(function(event) {
		var email = $("#email").val();
		var sala = $("#sala").val();
		var usuario = {
			"email" : email,
			"sala" : sala
		};
		socket.emit("login", usuario, function (dados) {
			if(dados.sucesso) {
				$("#login").hide();
				$("#chat").removeClass("hide");
			}
			$("#mensagem-login").html(dados.mensagem);
			$("#mensagem-login").removeClass("hide");
		});

		console.log("Login")
		event.preventDefault();
	});

	$("#send").submit(function(event) {
		var mensagem = $("#mensagem").val();
		console.log("Enviando mensagem: "+mensagem);
		socket.emit("mensagem", mensagem);
		$("#mensagem").val("");
		event.preventDefault();
	});

	socket.on("nova-mensagem", function(msg) {
		console.log("recebido nova mensagem ");
		console.log(msg);

		var conteudo = "<strong>"+msg.usuario.email+"</strong>: "+ msg.mensagem;

		var p = $("<p class='msg' />");
		p.attr("data-email", msg.usuario.email);
		p.html(conteudo);

		$("#mensagens").append(p);
	});

});	