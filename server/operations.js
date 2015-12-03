var lodash = require('lodash');

var rollDice = function(player,gameMaster){
	var diceValue = gameMaster.players[player].rollDice(gameMaster.dice);
	gameMaster.setChances(diceValue,player);
	return 'diceValue'+diceValue;
};

exports.actions = {
	rollDice: rollDice
};

//========================================================================================================

var getAllDiceValues = function(gameMaster, player){
	return 'diceValues='+gameMaster.players[player].diceValues;
};

exports.updates = {
	diceValues : getAllDiceValues,
};

//========================================================================================================

exports.enquiries = [
	{enquiry:'isValidPlayer', action : function(gameMaster,player){ return lodash.has(gameMaster.players,player)}},
	{enquiry:'currentPlayer', action : function(gameMaster){ return gameMaster.getCurrentPlayer();}}
];
