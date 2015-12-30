var express = require('express');
var fs = require('fs');
var path = require('path');
var lodash = require('lodash');
var querystring = require('querystring');
var application = require('./application.js');
var operations = require('./operations.js');
var cookieParser = require('cookie-parser');
var main = application.main;
var updates = operations.updates;
var enquiries = operations.enquiries;
var instructions = operations.instructions;
// var getWinner = application.findWinner;

var app=express();
var headers = {
	".html" : "text/html",
	".svg"	: "image/svg+xml",
	".css"	: "text/css"
};

var method_not_allowed = function(req, res){
	res.statusCode = 405;
	console.log(res.statusCode);
	res.end('Method is not allowed');
};

// var fileNotFound = function(req, res){
// 	res.statusCode = 404;
// 	res.end('Not Found');
// 	console.log(res.statusCode);
// };

var doRedirect = function(req, res, next){
	var data = '';
	req.on('data',function(chunk){
		data+=chunk;
	});
	req.on('end',function(){
		var userId = querystring.parse(data)['name'];
		if(application.enquiry({question:'players'},req.game).length <= 3)
			createPlayer(userId, req, res);
		else 
			res.end('Please wait, a game is already started');
	});
};

var createPlayer = function(userId,req,res){
	application.register(userId,req.game);
	res.cookie('userId', userId);
	res.redirect('/waitingPage.html');
	res.end();
};

var isPlayerRegistered = function(req, res, next){
	var player = req.cookies.userId;
	if(!player || !application.enquiry({question:'isValidPlayer',player:player},req.game)){
		res.redirect('/index.html'); 
		res.end();
	}
	else
		next();
};

var doInstruction = function(req, res, next){
	var obj = querystring.parse(req.url.slice(13));
	var player = req.cookies.userId;
	obj.player = player;
	var result = application.handleInstruction(obj,req.game);
	res.end(result);
};

var handleUpdate = function(req, res, next){
	var obj = querystring.parse(req.url.slice(8));
	var player = req.cookies.userId;
	obj.player = player;
	var result = application.handleUpdates(obj,req.game);
	res.end(result);
};

var handleEnquiry = function(req, res, next){
	var obj = querystring.parse(req.url.slice(9));
	var player = req.cookies.userId;
	obj.player = player;
	var response = application.enquiry(obj,req.game);
	if(!response)
		next();
	else	
		res.end(response);
};

var isValidPlayer = function(req, res, next){
	var player = req.cookies.userId;
	return application.enquiry({question:'isValidPlayer',player:player},req.game) && next() || method_not_allowed(req, res, next)
};

app.use(cookieParser());

app.get('^/main.html$', isPlayerRegistered);

app.use(express.static('./HTML'));

// app.use(/^\/update/, isValidPlayer);

app.get(/^\/update/, isValidPlayer, handleUpdate);

app.get(/^\/enquiry/, isValidPlayer, handleEnquiry);

app.get(/^\/instruction/, isValidPlayer, function(req, res, next){
	doInstruction(req, res, next);
});

app.post('^/login$',function(req, res, next){
	doRedirect(req, res, next);
});

module.exports = app;
