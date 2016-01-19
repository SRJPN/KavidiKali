var request = require('superTest');
var assert = require('assert');
var requestHandler = require('../routing.js');
var Game = require('../../javascript/sourceCode/game.js');
var sinon = require('sinon');
var game={players:{},id:'123456789'};
var games={};
games={};
games['123546789']=game;
var controller = requestHandler(games);
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
			game={players:{},id:'123456789'};
			games={};
			games['123546789']=game;
			controller = requestHandler(games);

			request(controller)
				.get('/waitingPage.html')
				.expect(200)
				.expect(/you are successfully logged in/)
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
		it("redirects to index page when joined player is less than 4 and the player is invalid one",function(done){
			var game = {
				players:{rocky:{},
						 rony:{}
						},
				id:123546789
			};
			games={};
			games['123546789']=game;
			controller = requestHandler(games);

			request(controller).get('/main.html')
				.set('cookie',['userId=rincy;gameId=123546789'])
				.expect(302)
				.expect('Location','/index.html',done);
		});
		it("serves main.html if all the players are joined and the requester is a valid player",function(done){
			var game = {
				players:{rocky:{},
						 rony:{},
						 rincy:{},
						 rinto:{}
						},
				id:123546789
			};
			games={};
			games['123546789']=game;
			controller = requestHandler(games);

			request(controller).get('/main.html')
				.set('cookie',['userId=rincy;gameId=123546789'])
				.expect(200)
				.expect(/KavidiKali Game/,done);
		});
		describe("enquiry ",function(){
			describe("currentPlayer",function(){
				beforeEach(function(){
					game={players:{},id:123546789};
					game.players={rocky:{},jacky:{},joy:{},rony:{}};
					game.currentPlayer = 'rony'
					games={};
					games['123546789']=game;
					controller = requestHandler(games);
				});

				it("gives the name of current player when it get request from registered player",function(done){
					request(controller)
						.get('/enquiry?question=currentPlayer')
						.set('cookie',['userId=rony;gameId=123546789'])
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
			describe("isGameOver",function(){
				it("informs player that game is over",function(done){
					game={
						players:{rocky:{isWin:true},
								 rony:{}
								},
						winner:'rocky',
						id:123546789
					};
					game.resetGame = function(){}
					games={};
					games['123546789']=game;
					controller = requestHandler(games);
					request(controller)
						.get('/enquiry?question=isGameOver')
						.set('cookie',['userId=rony;gameId=123546789'])
						.expect('true')
						.expect(200,done);
				});
			});
			describe("myNameAndColor",function(){
				it("gives the name and coin colour of the requester",function(done){
					game={
						players:{rocky:{coinColor:'red'},
								 rony:{}
								},
						id:123546789
					};
					games={};
					games['123546789']=game;
					controller = requestHandler(games);

					request(controller)
						.get('/enquiry?question=myNameAndColor')
						.set('cookie',['userId=rocky;gameId=123546789'])
						.expect('rocky\nYour coin color : red')
						.expect(200,done);
				});
			});
			describe("whatIsMyDetails",function(){
				it("gives the name of the requester",function(done){
					game={
						players:{rocky:{}},
						id:123546789
					};
					games={};
					games['123546789']=game;
					controller = requestHandler(games);

					request(controller)
						.get('/enquiry?question=whatIsMyDetails')
						.set('cookie',['userId=rocky;gameId=123546789'])
						.expect('{"name":"rocky","gameId":123546789}')
						.expect(200,done);
				});
			});
		});
	});
	describe("whoIsTheWinner",function(){
		it("gives back the name of winner in the game",function(done){
			game={
				players:{rocky:{},
						 rony:{}
						},
				winner:'rocky',
				id:123546789
			};
			games={};
			games['123546789']=game;
			controller = requestHandler(games);
			var expectedCookie = ['userId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
								'gameId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'].join();
			request(controller)
				.get('/enquiry?question=whoIsTheWinner')
				.set('cookie',['userId=rony;gameId=123546789'])
				.expect('rocky')
				.expect('set-cookie',expectedCookie)
				.expect(200,done);
		});
	});
	describe("/update",function(){
		it("updates dice values when it gets request from valid player",function(done){
			game={players:{},id:123546789};
			var rocky = {diceValues:[5]};
			game.players={rocky:rocky,jacky:{},joy:{},johnny:{}};
			game.setChances=function(){};
			game.nextPlayer=function(){};
			game.currentPlayer = 'rocky';
			game.dice = {};
			games={};
			games['123546789']=game;
			controller = requestHandler(games);
			request(controller)
				.get('/update?toUpdate=diceValues')
				.set('cookie',['userId=rocky;gameId=123546789'])
				.expect('diceValues=5')
				.expect(200,done)
		});
		it("doesn't updates dice values when it gets request from invalid player",function(done){
			game={players:{},id:123546789};
			var rocky = {rollDice:function(dice){return 5;},chances:0,
						 diceValues:[5]};
			game.players={rocky:rocky,jacky:{},joy:{},johnny:{}};
			game.setChances=function(){};
			game.nextPlayer=function(){};
			game.currentPlayer = 'rocky';
			game.dice = {};
			game.dice.roll = sinon.stub().returns(5);
			games={};
			games['123546789']=game;
			controller = requestHandler(games);
			request(controller)
				.get('/update?toUpdate=diceValues')
				.set('cookie',['userId=rocy;gameId=123546789'])
				.expect('Method is not allowed')
				.expect(405,done)
		});
		it("updates the number of player when it gets request from valid player",function(done){
			game={players:{},id:123546789};
			game.players={jacky:{},joy:{},johnny:{}};
			games={};
			games['123546789']=game;
			controller = requestHandler(games);
			request(controller)
				.get('/update?toUpdate=waitingPage')
				.set('cookie',['userId=jacky;gameId=123546789'])
				.expect('3')
				.expect(200,done)

		});
		it("gives out falsey value but statusCode 200 if all the players have joined the game",function(done){
			game={players:{},id:123546789};
			game.players={jacky:{},joy:{},johnny:{},jisna:{}};
			games={};
			games['123546789']=game;
			controller = requestHandler(games);
			request(controller)
				.get('/update?toUpdate=waitingPage')
				.set('cookie',['userId=jacky;gameId=123546789'])
				.expect('')
				.expect(200,done)

		});
		it("gives 405 when it gets request from an invalid player",function(done){
			game={players:{},id:123546789};
			game.players={jacky:{},joy:{},johnny:{}};
			games={};
			games['123546789']=game;
			controller = requestHandler(games);
			request(controller)
				.get('/update?toUpdate=waitingPage')
				.set('cookie',['userId=jack;gameId=123546789'])
				.expect('Method is not allowed')
				.expect(405,done)
		});
		it("gives current state of the game when it gets request from valid player",function(done){
			game={players:{},id:123546789};
			game.players={jacky:{},joy:{},johnny:{},rocky:{}};
			game.stateOfGame = function(){
				return {id:'jacky',coins:{jacky1:{currentPosition:'2,0'}}}
			}
			games={};
			games['123546789']=game;
			controller = requestHandler(games);
			request(controller)
				.get('/update?toUpdate=board')
				.set('cookie',['userId=jacky;gameId=123546789'])
				.expect('{"id":"jacky","coins":{"jacky1":{"currentPosition":"2,0"}}}')
				.expect(200,done)

		});
		it("gives 405 when it gets update board request from invalid player",function(done){
			game={players:{},id:123546789};
			game.players={jacky:{},joy:{},johnny:{},rocky:{}};
			game.stateOfGame = function(){
				return {id:'jacky',coins:{jacky1:{currentPosition:'2,0'}}}
			}
			games={};
			games['123546789']=game;
			controller = requestHandler(games);
			request(controller)
				.get('/update?toUpdate=board')
				.set('cookie',['userId=jack;gameId=123546789'])
				.expect('Method is not allowed')
				.expect(405,done)
		});
		it("returns the current notification when it get request from registered player",function(done){
			game={players:{},id:123546789};
			game.players={jacky:{},joy:{},johnny:{},rocky:{}};
			game.notification_text="joy got 2"
			game.getNotification=function(){return this.notification_text}
			games={};
			games['123546789']=game;
			controller = requestHandler(games);
			request(controller)
				.get('/update?toUpdate=notification')
				.set('cookie',['userId=jacky;gameId=123546789'])
				.expect(200)
				.expect('joy got 2',done)
		});
	});
	describe("enquiry?question=playerTurn",function(){
		game={players:{},id:123546789};
		game.players={jacky:{},joy:{},johnny:{},rocky:{}};
		games={};
		games['123546789']=game;
		controller = requestHandler(games);
		it("returns the players turn number as 4 when get request from 1st player",function(done){
			request(controller)
				.get('/enquiry?question=playerTurn')
				.set('cookie',['userId=jacky;gameId=123546789'])
				.expect('4')
				.expect(200,done)
		});
		it("returns the players turn number as 3 when get request from 2nd player",function(done){
			request(controller)
				.get('/enquiry?question=playerTurn')
				.set('cookie',['userId=joy;gameId=123546789'])
				.expect('3')
				.expect(200,done)
		});
		it("returns the players turn number as 2 when get request from 3rd player",function(done){
			request(controller)
				.get('/enquiry?question=playerTurn')
				.set('cookie',['userId=johnny;gameId=123546789'])
				.expect('2')
				.expect(200,done)
		});
		it("returns the players turn number as 1 when get request from 4th player",function(done){
			request(controller)
				.get('/enquiry?question=playerTurn')
				.set('cookie',['userId=rocky;gameId=123546789'])
				.expect('1')
				.expect(200,done)
		});
		it("gives 405 when it get request from unregistered player",function(done){
			request(controller)
				.get('/enquiry?question=playerTurn')
				.set('cookie',['userId=jack;gameId=123546789'])
				.expect('Method is not allowed')
				.expect(405,done)
		});
	});

});

describe("POST handlers",function(){
	describe("isValidName",function(){
		it("returns true if a name is unique for a game",function(done){
			game={players:{},id:123546789};
			game.players={jacky:{},joy:{},johnny:{}};
			games={};
			games['123546789']=game;
			controller = requestHandler(games);
			request(controller)
				.post('/isValidName')
				.send('name=rocky')
				.expect('true')
				.expect(200,done)
		});
		it("returns false if a name is not unique for a game",function(done){
			game={players:{},id:123546789};
			game.players={jacky:{},joy:{},johnny:{}};
			games={};
			games['123546789']=game;
			controller = requestHandler(games);
			request(controller)
				.post('/isValidName')
				.send('name=jacky')
				.expect('false')
				.expect(200,done)
		});
	});
	describe("index page",function(){
		it("redirects player to the waiting page after login from url /",function(done){
			game={players:{},id:"123846789"};
			game.createPlayer=function(){
				game.players.rony = {coinColor:'red'};
			};

			games={};
			games['123846789']=game;
			controller = requestHandler(games);
			request(controller)
				.post('/login')
				.send("name=rony")
				.expect('set-cookie','userId=rony; Path=/,gameId=123846789; Path=/')
				.expect(302)
				.expect('Location','/waitingPage.html',done)
		});
		it("redirects player to the waiting page after login from url /indexPage.html",function(done){
			game={players:{},id:'123846789'};
			game.createPlayer=function(){
				game.players.rony = {coinColor:'red'};
			};
			games={};
			games['123846789']=game;
			controller = requestHandler(games);

			request(controller)
				.post('/login')
				.send("name=rony")
				.expect('set-cookie','userId=rony; Path=/,gameId=123846789; Path=/')
				.expect(302)
				.expect('Location','/waitingPage.html',done)
		});
		it("doesn't create a new game when a new player want to join game till 4th player",function(done){
			var games={};
			var game={
				players:{rock:{},jack:{},johnny:{}},
				createPlayer:function(){},
				id:'123546789'
			}
			var games={'123546789':game};
			controller = requestHandler(games);
			request(controller)
				.post('/login')
				.send('name=rose')
				.expect('set-cookie',['userId=rose; Path=/'])
				.end(function(req,res){
					var expectCookie = 'gameId=123546789; Path=/'
					assert.equal(expectCookie,res.header['set-cookie'][1]);
					done();
				})
		})
		it('create a new game when a new player want to join game after 4th player',function(done){
			var games={};
			var game={
				players:{rock:{},jack:{},johnny:{},rony:{}},
				id:'123546789'
			}
			var games={'123546789':game};
			controller = requestHandler(games);
			request(controller)
				.post('/login')
				.send('name=rose')
				.end(function(req,res){
					assert.notEqual('gameId=123546789, Path=/',res.header['set-cookie'][1]);
					assert.equal('/waitingPage.html',res.header.location);
					assert.equal(302,res.status)
					done();
				})
		});
		it("redirects the player to indexPage if he/she want to join the game one of the previously joined players name",function(done){
			var games={};
			var game={
				players:{rock:{},jack:{},johnny:{}},
				id:'123546789'
			}
			var games={'123546789':game};
			controller = requestHandler(games);
			request(controller)
				.post('/login')
				.send('name=rock')
				.expect(302)
				.expect('Location','/index.html',done)
		});
		it("allow to join a new player to a specific game when it get a valid gameId",function(done){
			var game={
				players:{rock:{},jack:{},johnny:{}},
				createPlayer:function(){},
				id:'123546789'
			}
			var games={'123546789':game};
			controller = requestHandler(games);
			request(controller)
				.post('/login')
				.send('name=rocky&gameId=123546789')
				.expect(302)
				.expect('Location','/waitingPage.html')
				.expect('set-cookie','userId=rocky; Path=/,gameId=123546789; Path=/',done)
		});
		it("create a new game when it get a valid gameId but that game already have 4 players",function(done){
			var game={
				players:{rock:{},jack:{},johnny:{},joy:{}},
				createPlayer:function(){},
				id:'123546789'
			}
			var games={'123546789':game};
			controller = requestHandler(games);
			request(controller)
				.post('/login')
				.send('name=rocky&gameId=123546789')
				.end(function(req,res){
					assert.notEqual('gameId=123546789; Path=/',res.header['set-cookie'][1]);
					assert.equal('/waitingPage.html',res.header.location);
					assert.equal(302,res.status);
					done();
				})
		});
		it("create a new game when a new player want to join to a specific game with a invalid gameId ",function(done){
			var game={
				players:{rock:{},jack:{},johnny:{},joy:{}},
				createPlayer:function(){},
				id:'123546789'
			}
			var games={'123546789':game};
			controller = requestHandler(games);
			request(controller)
				.post('/login')
				.send('name=rocky&gameId=123546708')
				.end(function(req,res){
					assert.notEqual('gameId=123546708; Path=/',res.header['set-cookie'][1]);
					assert.equal('/waitingPage.html',res.header.location);
					assert.equal(302,res.status);
					done();
				})
		});
	});
	describe("doInstruction",function(){
		it("performs action roll dice get from registered player",function(done){
			game={players:{},id:123546789};
			var rocky = {rollDice:function(dice){return 5;},chances:1};
			game.players={rocky:rocky,jacky:{},joy:{},johnny:{}};
			game.setChances=function(){};
			game.nextPlayer=function(){};
			game.currentPlayer = 'rocky';
			game.dice = {};
			game.dice.roll = sinon.stub().returns(5);
			games={};
			games['123sahbj']=game;
			controller = requestHandler(games);
			request(controller)
				.get('/instruction?action=rollDice')
				.set('cookie',['userId=rocky;gameId=123sahbj'])
				.expect('diceValue5')
				.expect(200,done);
		});
		it("doesn't performs action roll dice get from unregistered player",function(done){
			game={players:{},id:123546789};
			var rocky = {rollDice:function(dice){return 5;},chances:1};
			game.players={rocky:rocky,jacky:{},joy:{},johnny:{}};
			game.setChances=function(){};
			game.nextPlayer=function(){};
			game.currentPlayer = 'rocky';
			game.dice = {};
			game.dice.roll = sinon.stub().returns(5);
			games={};
			games['1235JUk']=game;
			controller = requestHandler(games);
			request(controller)
				.get('/instruction?action=rollDice')
				.set('cookie',['userId=piku;gameId=1235JUk'])
				.expect('Method is not allowed')
				.expect(405,done);
		});
		it("performs action moveCoin if instruction is got from right player and right coin with right position",function(done){
			game={players:{},id:123546789};
			var rocky = {moveCoin:sinon.spy(),chances:1};
			game.players={rocky:rocky,jacky:{},joy:{},johnny:{}};
			game.currentPlayer = 'rocky';
			game.anyMoreMoves = sinon.stub().returns(true);

			game.dice = {};
			game.dice.roll = sinon.stub().returns(5);
			games={};

			games['1235JUk']=game;
			var controller = requestHandler(games);
			request(controller)
				.get('/instruction?action=moveCoin&coin=rocky1&position=76')
				.set('cookie',['userId=rocky;gameId=1235JUk'])
				.expect(200,function(){
					assert(rocky.moveCoin.called);
					assert(rocky.moveCoin.withArgs('rocky1','76').called);
					done();
				});
		});
		it("performs action moveCoin if instruction is got from right player and right coin with right position and nextPlayer is called",function(done){
			game={players:{},id:123546789};
			var rocky = {moveCoin:sinon.spy(),chances:1};
			game.players={rocky:rocky,jacky:{},joy:{},johnny:{}};
			game.currentPlayer = 'rocky';
			game.nextPlayer = sinon.spy();
			game.anyMoreMoves = sinon.stub().returns(false);

			game.dice = {};
			game.dice.roll = sinon.stub().returns(5);
			games={};

			games['1235JUk']=game;
			var controller = requestHandler(games);
			request(controller)
				.get('/instruction?action=moveCoin&coin=rocky1&position=76')
				.set('cookie',['userId=rocky;gameId=1235JUk'])
				.expect(200,function(){
					assert.ok(rocky.moveCoin.called);
					assert.ok(rocky.moveCoin.withArgs('rocky1','76').called);
					assert.ok(game.nextPlayer.called);
					done();
				});
		});
		it("says wrong player if any player requests for instruction other than currentPlayer",function(done){
			game={players:{},id:123546789};
			var rocky = {moveCoin:sinon.spy(),chances:1};
			game.players={rocky:rocky,jacky:{},joy:{},johnny:{}};
			game.currentPlayer = 'rocky';
			game.nextPlayer = sinon.spy();
			game.anyMoreMoves = sinon.stub().returns(false);

			game.dice = {};
			game.dice.roll = sinon.stub().returns(5);
			games={};

			games['1235JUk']=game;
			var controller = requestHandler(games);
			request(controller)
				.get('/instruction?action=moveCoin&coin=rocky1&position=76')
				.set('cookie',['userId=jacky;gameId=1235JUk'])
				.expect('Wrong Player')
				.expect(200,done);
		});
	});
});

