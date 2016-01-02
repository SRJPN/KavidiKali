var request = require('superTest');
var requestHandler = require('../routing.js');
var Game = require('../../javascript/sourceCode/game.js').game;
var sinon = require('sinon');
var game={};
var controller = requestHandler(game);

describe("get handlers",function(){
	describe("/",function(){
		it("serves index file if '/' is given",function(done){
			request(controller).get('/')
				.expect(200)
				.expect(/Welcome To KavidiKali/,done)
		});
	});
	describe("/index.html",function(){
		it("serves index file index.html is requested",function(done){
			request(controller).get('/index.html')
				.expect(200)
				.expect(/Welcome To KavidiKali/)
				.expect('content-Type',/text\/html/,done);
		});
	});	
	describe("/waitingPage.html",function(){
		it("serves waitingPage.html file when requested",function(done){
			game={players:{}};
			controller = requestHandler(game);

			request(controller)
				.get('/waitingPage.html')
				.expect(200)
				.expect(/You are Successfully logged in/)
				.expect('content-Type',/text\/html/,done);
		});
	});
	describe("Empty URL",function(){
		it("serves index file if '' is requested",function(done){
			request(controller).get('')
				.expect(200)
				.expect(/Welcome To KavidiKali/,done);
		});
	});
	describe("wrong url",function(){
		it("response with status code 405 when file is not present",function(done){
			request(controller).get('/pikachu')
				.expect(405)
				.expect("Method is not allowed",done);
		});
	});
	describe("unallowed method",function(){
		it("gives method not allowed when the method is other than GET or POST",function(done){
			request(controller)
				.put('/anything')
				.expect(405)
				.expect("Method is not allowed",done);
		});
	});
	describe("main.html",function(){
		it("redirects to index page when joined player is less than 4 and the player is unregistered",function(done){
			request(controller).get('/main.html')
				.expect(302)
				.expect('Location','/index.html',done);
		});
		describe("enquiry ",function(){
			describe("currentPlayer",function(){
				beforeEach(function(){
					game={};
					game.players={rocky:{},jacky:{},joy:{},rony:{}};
					game.currentPlayer = 'rony'
					controller = requestHandler(game);
				});

				it("gives the name of current player when it get request from registered player",function(done){
					request(controller)
						.get('/enquiry?question=currentPlayer')
						.set('cookie',['userId=rony'])
						.expect(200)
						.expect('rony',done);
				});
				it("gives the status code 405 when it get request from unregistered player",function(done){
					request(controller)
						.get('/enquiry?question=currentPlayer')
						.set('cookie',['userId=roy'])
						.expect(405)
						.expect('Method is not allowed',done);
				});
			});
		});
	});
	describe("GameOver",function(){
		it("informs player that game is over",function(done){
			game={
				players:{rocky:{},
						 rony:{}
						},
				winner:'rocky'
			};
			controller = requestHandler(game);

			request(controller)
				.get('/enquiry?question=whoIsTheWinner')
				.set('cookie',['userId=rony'])
				.expect('rocky')
				.expect(200,done);
		});
	});
	describe("/update",function(){
		it("updates dice values when it gets request from valid player",function(done){
			game={};
			var rocky = {diceValues:[5]};
			game.players={rocky:rocky,jacky:{},joy:{},johnny:{}};
			game.setChances=function(){};
			game.nextPlayer=function(){};
			game.currentPlayer = 'rocky';
			game.dice = {};
			controller = requestHandler(game);
			request(controller)
				.get('/update?toUpdate=diceValues')
				.set('cookie',['userId=rocky'])
				.expect('diceValues=5')
				.expect(200,done)
		});
		it("doesn't updates dice values when it gets request from invalid player",function(done){
			game={};
			var rocky = {rollDice:function(dice){return 5;},chances:0,
						 diceValues:[5]};
			game.players={rocky:rocky,jacky:{},joy:{},johnny:{}};
			game.setChances=function(){};
			game.nextPlayer=function(){};
			game.currentPlayer = 'rocky';
			game.dice = {};
			game.dice.roll = sinon.stub().returns(5);
			controller = requestHandler(game);
			request(controller)
				.get('/update?toUpdate=diceValues')
				.expect('Method is not allowed')
				.expect(405,done)
		});
		it("updates the number of player when it gets request from valid player",function(done){
			game={};
			game.players={jacky:{},joy:{},johnny:{}};
			controller = requestHandler(game);
			request(controller)
				.get('/update?toUpdate=waitingPage')
				.set('cookie',['userId=jacky'])
				.expect('3')
				.expect(200,done)

		});
		it("gives 405 when it gets request from an invalid player",function(done){
			game={};
			game.players={jacky:{},joy:{},johnny:{}};
			controller = requestHandler(game);
			request(controller)
				.get('/update?toUpdate=waitingPage')
				.set('cookie',['userId=jack'])
				.expect('Method is not allowed')
				.expect(405,done)
		});
		it("gives current state of the game when it gets request from valid player",function(done){
			game={};
			game.players={jacky:{},joy:{},johnny:{},rocky:{}};
			game.stateOfGame = function(){
				return {id:'jacky',coins:{jacky1:{currentPosition:'2,0'}}}
			}
			controller = requestHandler(game);
			request(controller)
				.get('/update?toUpdate=board')
				.set('cookie',['userId=jacky'])
				.expect('{"id":"jacky","coins":{"jacky1":{"currentPosition":"2,0"}}}')
				.expect(200,done)

		});
		it("gives 405 when it gets update board request from invalid player",function(done){
			game={};
			game.players={jacky:{},joy:{},johnny:{},rocky:{}};
			game.stateOfGame = function(){
				return {id:'jacky',coins:{jacky1:{currentPosition:'2,0'}}}
			}
			controller = requestHandler(game);
			request(controller)
				.get('/update?toUpdate=board')
				.set('cookie',['userId=jack'])
				.expect('Method is not allowed')
				.expect(405,done)

		});
	});
});

describe("POST handlers",function(){
	describe("index page",function(){
		it("redirects player to the waiting page after login from url /",function(done){
			game={players:{}};
			game.createPlayer=function(){
				game.players.rony = {coinColor:'red'};
			};

			controller = requestHandler(game);
			request(controller)
				.post('/login')
				.send("name=rony")
				.expect('set-cookie','userId=rony; Path=/')
				.expect(302)
				.expect('Location','/waitingPage.html',done)
		});
		it("redirects player to the waiting page after login from url /indexPage.html",function(done){
			game={players:{}};
			game.createPlayer=function(){
				game.players.rony = {coinColor:'red'};
			};
			controller = requestHandler(game);

			request(controller)
				.post('/login')
				.send("name=rony")
				.expect('set-cookie','userId=rony; Path=/')
				.expect(302)
				.expect('Location','/waitingPage.html',done)
		});
		it("gives a waiting message when more than 4th player want to join the game",function(done){
			game={};
			game.players={rocky:{},jacky:{},joy:{},johnny:{}};
			game.createPlayer=function(){};
			controller = requestHandler(game);
			request(controller)
				.post('/login').send('name=john')
				.expect(200)
				.expect("Please wait, a game is already started",done);
		});
	});
	describe("doInstruction",function(){
		it("performs action roll dice get from registered player",function(done){
			game={};
			var rocky = {rollDice:function(dice){return 5;},chances:1};
			game.players={rocky:rocky,jacky:{},joy:{},johnny:{}};
			game.setChances=function(){};
			game.nextPlayer=function(){};
			game.currentPlayer = 'rocky';
			game.dice = {};
			game.dice.roll = sinon.stub().returns(5);
			controller = requestHandler(game);
			request(controller)
				.get('/instruction?action=rollDice')
				.set('cookie',['userId=rocky'])
				.expect('diceValue5')
				.expect(200,done);
		});
		it("doesn't performs action roll dice get from unregistered player",function(done){
			game={};
			var rocky = {rollDice:function(dice){return 5;},chances:1};
			game.players={rocky:rocky,jacky:{},joy:{},johnny:{}};
			game.setChances=function(){};
			game.nextPlayer=function(){};
			game.currentPlayer = 'rocky';
			game.dice = {};
			game.dice.roll = sinon.stub().returns(5);
			controller = requestHandler(game);
			request(controller)
				.get('/instruction?action=rollDice')
				.set('cookie',['userId=piku'])
				.expect('Method is not allowed')
				.expect(405,done);
		});
	});
});



