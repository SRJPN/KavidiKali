var coin = require('./coin.js');
var ld = require('lodash');
var EventEmitter=require('events').EventEmitter;

var Player = function(id, path, coins,extendedPath){
	this.id = id;
	this.matured = false;
	this.chances = 0;
	this.diceValues=[];
	this.coins = coins;
	this.path = path;
	this.extendedPath = extendedPath;
	this.emitter = new EventEmitter();
	this.notification_text;

};

Player.prototype = {
	get notification(){
		return this.notification_text;
	},
	rollDice : function(dice){
		var diceValue = dice.roll();
		this.diceValues.push(diceValue);
		this.notification_text = this.id+" got "+diceValue+""+this.diceValues.length;
		this.emitter.emit("new_notification");
		this.chances--;
		return diceValue;
	},
	whenCoinKills:function(){
		this.matured = true;
		this.chances++;
		this.notification_text = (this.id+"'s one coin kill opponents coin "+this.id+' get an extra chance to roll dice');
		this.emitter.emit("new_notification");
		if(this.path.length==16)
			this.path = this.path.concat(this.extendedPath);
	},
	moveCoin : function(coinID,movesTo){
		var coin = this.coins[coinID];
		if(coin){
			if(coin.currentPosition==-1){
				if(this.path[0].id == movesTo && this.diceValues.indexOf(6)>=0){
					this.path[0].place(coin);
					this.diceValues = removeValue(this.diceValues, 6);
				};
			}
			else{
				var currTileIndex = ld.findIndex(this.path,{id:coin.currentPosition});
				var nextTileIndex = ld.findIndex(this.path,{id:movesTo});
				var dice = nextTileIndex - currTileIndex;
				if(dice<0)
					dice = (16+dice);
				if(this.diceValues.indexOf(dice)>=0){
					this.path[nextTileIndex].place(coin);
					this.diceValues = removeValue(this.diceValues, dice);
					this.path[currTileIndex].removeCoin(coin);
				};
			};
			if(this.isWin){
				this.emitter.emit("Game_over");
				return true;
			}
		}
	},
	get isWin(){
		var coins = this.coins;
		return Object.keys(this.coins).every(function(coin){
			return coins[coin].reachedDestination;
		});
	},
	addListener: function(listener){
		this.emitter.addListener("Game_over",listener.whenGameOver.bind(listener));
		this.emitter.addListener("new_notification",listener.createNote.bind(listener));
	},
	get coinColor(){
		return this.coins[this.id+'1'].colour;
	}
};


var removeValue = function(list,value){
	var index = list.indexOf(value);
	return list.filter(function(value,ind){
		return ind!=index;
	});
};

module.exports = Player;