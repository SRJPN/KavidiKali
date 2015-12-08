var lodash = require('lodash');
var entities = {};
exports.entities = entities;
var path = require('./generatePath.js');
//===========================================================================
var Board = function(grid,safePlaces){
	this.grid = grid;
	this.safePlaces = safePlaces;
};

entities.createBoard = function(size) {
	var grid=createGrid(size);
	var safePlaces=entities.createSafePlaces(size);
	safePlaces.forEach(function(pos){
		grid[pos.r][pos.c]=[];
	});
	return new Board(grid,safePlaces);
}

entities.Position=function(r,c) {
	this.r=r;
	this.c=c;
}

Board.prototype={
	isSafe : function(position){
		return (lodash.findIndex(this.safePlaces,position)>=0);
	},
	isThereAnyCoin : function(position){
		return (!this.isSafe(position) && !!this.grid[position]);
	},
	addCoin : function(coin){
		if(this.isSafe(coin.currentPosition)){
			var position = coin.currentPosition;
			this.grid[position].push(coin);
		}
		else
			this.grid[coin.currentPosition] = coin;
	},
	getCoins : function(position){
		return this.grid[position];
	},
	eraseCoin : function(movesFrom,activeCoin){
		if(this.isSafe(movesFrom))
			lodash.remove(this.grid[movesFrom],function(coin){
				return coin.id == activeCoin.id; 
			});
		else
			this.grid[movesFrom]=undefined;
	},
	getAllValidMovesOfCoin : function(coin,diceValues,path,specialValue){
		if(coin.currentPosition==coin.parkingPosition){
			return lodash.intersection(diceValues,specialValue).length && [coin.startPosition] || undefined;
		}
		else{
			var validMoves = diceValues.map(function(diceValue){
				return getTheValidMove.call(this,coin,diceValue,path);
			}.bind(this));
			return lodash.pull(validMoves,false);
		}
	},
	anyMoreMoves: function(player){
		var movesPerCoin = Object.keys(player.coins).map(function(coin){
			return this.getAllValidMovesOfCoin(player.coins[coin],player.diceValues,player.path,[6]);
		}.bind(this));
		var totalMoves = lodash.flatten(movesPerCoin);
		return !!lodash.pull(totalMoves,undefined)[0];
	}
};

var getTheValidMove = function(coin,movesBy,path){
	var coinIndex = path.indexOf(coin.currentPosition);
	var nextIndex = coinIndex+movesBy
	if(this.isThereAnyCoin(path[nextIndex]))
		return coin.id.slice(0,-1) != this.getCoins(path[nextIndex]).id.slice(0,-1);
	return path[nextIndex];
};

var createGrid = function(size){
	return lodash.chunk(Array(size*size),size);
};

entities.Coin = function(id,startPosition,parkingPosition,colour){
	this.id = id;
	this.currentPosition = parkingPosition;
	this.reachedHome = false;
	this.startPosition = startPosition;
	this.parkingPosition=parkingPosition;
	this.colour=colour;
};

entities.Coin.prototype = {
	move : function(movesTo,board){
		var oldPosition = this.currentPosition;
		this.currentPosition = movesTo;
	},
	die : function(){
		this.currentPosition = this.parkingPosition;
	},

	hasReachedHome : function(){
		this.reachedHome = true;
	}
};

entities.Player = function(id,startPosition,colour,parkingPosition){
	this.id = id;
	this.matured = false;
	this.coins = createCoins(id,4,startPosition,parkingPosition,colour);
	this.diceValues = new Array;
	this.chances = 0;
	this.startPosition = startPosition;
};

var createCoins =  function(id,numberOfCoins,startPosition,parkingPosition,colour){
	var coins = new Object;
	for(var count=1; count<=numberOfCoins; count++){
		coins[id+count] = new entities.Coin(id+count,startPosition,parkingPosition,colour);
	};
	return coins;
};

entities.Player.prototype = {
	rollDice : function(dice){
		var diceValue = dice.roll();
		this.diceValues.push(diceValue);
		this.chances--;
		return diceValue;
	},
	moveCoin : function(coinID,movesTo,board){
		var coin = this.coins[coinID];
		var movesFrom = coin.currentPosition;
		coin.move(movesTo,board);
		board.isThereAnyCoin(movesTo) && this.kill(board.getCoins(movesTo));
		board.addCoin(coin);
		board.eraseCoin(movesFrom,coin);
	},
	kill : function(coin){
		coin.die();
		this.chances++;
		this.matured = true;
	},
	get path(){
		if(this.matured){
			var positions=path.generateFullPath(this.startPosition);
			positions.map(function(pos){return tiles[pos]});
		}
		var playerPath = path.generateHalfPath(this.startPosition);
		return playerPath.concat(playerPath);
	}
};

entities.Dice = function(values){
	this.values = values;
};

entities.Dice.prototype = {
	roll : function(){
		return lodash.sample(this.values);
	}
}

entities.GameMaster = function(specialValues,size,diceValues){
	this.players = {};
	this.specialValues = specialValues;
	this.board = this.createBoard(size);
	this.dice = this.createDice(diceValues);
	this.getCurrentPlayer = getCurrentPlayer(this);
};

entities.GameMaster.prototype = {
	analyzeDiceValue : function(diceValue){
		return (this.specialValues.indexOf(diceValue)>=0);
	},
	createPlayer : function(playerId){
		var playersCount = Object.keys(this.players).length;
		var colorSequence=["red","green","blue","yellow"];
		var parkingPositions=["2,-1","5,2","2,5","-1,2"]; 
		this.players[playerId] = new entities.Player(playerId,
													this.board.safePlaces[playersCount],
													colorSequence[playersCount],
													parkingPositions[playersCount]);
	},
	setChances : function(diceValue,playerId){
		if(this.analyzeDiceValue(diceValue))
			this.players[playerId].chances++;  
	},
	createBoard : function(size){
		var safePlaces = entities.createSafePlaces(size);
		return new entities.Board(safePlaces,size);
	},
	createDice : function(values){
		return new entities.Dice(values);
	},
	isPlayerMatured : function(player){
		return player.matured;
	},
	stateOfGame: function() {
		var state={};
		var players=this.players;
		for (player in players) {
			var coins=players[player].coins
			for (coin in coins) {
				state[coin]=coins[coin];
			}
		}
		return state;
	}
};

var getCurrentPlayer = function(master){
	var counter = 0;
	return (function(){
		var players = Object.keys(this.players);
		var currPlayer = this.players[players[counter]]
		if(!currPlayer.chances){
			counter = (counter+1)%players.length;
			this.players[players[counter]].chances++;
	 	};	
		return this.players[players[counter]];
	}).bind(master);
};

entities.createSafePlaces = function(size){
	var safePlaces = [];
	safePlaces.push(new entities.Position(Math.floor(size/2),0));
	safePlaces.push(new entities.Position(size-1,Math.floor(size/2)));
	safePlaces.push(new entities.Position(Math.floor(size/2),size-1));
	safePlaces.push(new entities.Position(0,Math.floor(size/2)));
	safePlaces.push(new entities.Position(Math.floor(size/2),Math.floor(size/2)));
	return safePlaces;
};

