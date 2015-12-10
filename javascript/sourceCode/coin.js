var Coin = function(id,colour){
	this.id = id;
	this.currentPosition = -1 ;
	this.reachedDestination = false;
	this.colour=colour;
};

Coin.prototype = {
	equals:function(other) {
		return this.colour==other.colour;
	},
	move:function(movesTo) {
		this.currentPosition = movesTo;
	},
};

exports.coin=Coin;
