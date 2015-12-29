var fs = require('fs');
var path = require('path');
var lodash = require('lodash');
var querystring = require('querystring');
var application = require('./application.js');
var operations = require('./operations.js');
// var game = require('./../javascript/sourceCode/game.js').game;

var main = application.main;
var updates = operations.updates;
var enquiries = operations.enquiries;
var instructions = operations.instructions;
var getWinner = application.findWinner;
// var req.game = new game([6],5,[1,2,3,4,5,6]);

var headers = {
	".html" : "text/html",
	".svg"	: "image/svg+xml",
	".css"	: "text/css"
};

var serveIndex = function(req, res, next){
	req.url = '/index.html';
	next();
};

var method_not_allowed = function(req, res){
	res.statusCode = 405;
	console.log(res.statusCode);
	res.end('Method is not allowed');
};

var serveStaticFile = function(req, res, next){
	var filePath = './HTML' + req.url;
	fs.readFile(filePath, function(err, data){
		if(data){
			res.writeHead(200,{'content-type' : headers[path.extname(filePath)]});
			console.log(res.statusCode);
			res.end(data);
		}
		else
			next();
	});
};

var fileNotFound = function(req, res){
	res.statusCode = 404;
	res.end('Not Found');
	console.log(res.statusCode);
};

var doRedirect = function(req, res, next){
	var data = '';
	req.on('data',function(chunk){
		data+=chunk;
	});
	req.on('end',function(){
		var userId = querystring.parse(data)['name'];
		if(application.enquiry({question:'players'},req.game).length <= 3)
			createPlayer(userId,req,res);
		else 
			res.end('Please wait, a game is already started');
	});
};

var createPlayer = function(userId,req,res){
	if(!application.enquiry({question:'isValidPlayer',player:userId},req.game))
		application.register(userId,req.game);
	res.writeHead('302',{'Location':'/waitingPage.html',
		'content-type':'text/html',
		'Set-Cookie':'userId='+userId,

	});
	res.end();
};

var createInformation = function(req, res, next){

	var filePath = './HTML' + req.url;
	var userId = querystring.parse(req.headers.cookie).userId;
	if(!userId || !application.enquiry({question:'isValidPlayer',player:userId},req.game)){
		res.writeHead('302',{'Location':'/index.html',
			'content-type':'text/html'
		});
		res.end();
	}
	else{
		var color = application.findColor(userId,req.game);
		fs.readFile(filePath, function(err, data){
			if(data){
				var replaceWith = userId + '\nYour coin color : '+color;
				var html = replaceRespectiveValue(data.toString(),'__userID__',replaceWith);
				res.responseCode = 200;
				res.end(html);
				console.log(res.responseCode);
			}
			else
				next();
		});	
	}
};

var replaceRespectiveValue = function(originalData,replaceFrom,replaceTo){
	return originalData.replace(replaceFrom,replaceTo);
};

var createWaitingPage = function(req, res, next){
	var filePath = './HTML' + req.url;
	fs.readFile(filePath, function(err, data){
		if(data){
			res.statusCode = 200;
			res.writeHead(200,{'content-type' : headers[path.extname(filePath)]});
			var userId = querystring.parse(req.headers.cookie).userId;
			var html = replaceRespectiveValue(data.toString(),'__userId__',userId);
			html = replaceRespectiveValue(html.toString(),'__numberOfPlayer__',application.enquiry({question:'players'},req.game).length);
			res.end(html);
		}
		else
			next();
	});
};

var doInstruction = function(req, res, next){
	var obj = querystring.parse(req.url.slice(13));
	var player = querystring.parse(req.headers.cookie).userId;
	if(application.enquiry({question:'isValidPlayer',player:player},req.game)){
		obj.player = player;
		var result = application.handleInstruction(obj,req.game);
		res.end(result)
	}
	else
		next();
};

var handleUpdate = function(req, res, next){
	var obj = querystring.parse(req.url.slice(8));
	var player = querystring.parse(req.headers.cookie).userId;
	if(application.enquiry({question:'isValidPlayer',player:player},req.game)){
		obj.player = player;
		var result = application.handleUpdates(obj,req.game);
		res.end(result);
	}
	else
		next();
};

var handleEnquiry = function(req,res,next){
	var obj = querystring.parse(req.url.slice(9));
	var player = querystring.parse(req.headers.cookie).userId;
	if(application.enquiry({question:'isValidPlayer',player:player},req.game)){
		obj.player = player;
		var response = application.enquiry(obj,req.game);
		if(!response)
			next();
		else	
			res.end(response);
	}
	else
		next();
};

var createGameOverPage = function(req,res,next){
	var html = '<h3>Sorry Game Over  __userId__ won the game</h3>';
	html = replaceRespectiveValue(html,'__userId__',getWinner(req.game));
	res.end(html);
}

exports.post_handlers = [
	{path: '^/login$', handler: doRedirect},//finish testing
	{path: '^/instruction', handler: doInstruction},//no need to test
	{path: '', handler: method_not_allowed}//finish testing
];

exports.get_handlers = [
	{path:'^/waitingPage.html$',handler:createWaitingPage},//finish testing
	{path: '^/main.html$',handler:createInformation},
	{path: '^/$', handler: serveIndex},//finish testing
	{path: '', handler: serveStaticFile},//finish testing
	{path: '^/update', handler: handleUpdate},
	{path: '^/enquiry',handler: handleEnquiry},//finish testing
	{path: '^/gameOver$', handler: createGameOverPage},//finish testing
	{path: '', handler: fileNotFound}//finish testing
];

