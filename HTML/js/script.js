var selectedCoin;
var currentStateOfGame;
var activeTiles;
var turnTemplate = "Its __UserID__'s turn "

function makeGrid(){
	var table='<table class="grid">'
	for(var rowCount=5;rowCount>=-1;rowCount--){
		var row = '<tr>';
		for(var columnCount=-1;columnCount<6;columnCount++)
			row+='<td id="'+columnCount+','+rowCount+'" class="tile" ></td>';
		row += '</tr>';
		table += row;
	};
	table+='</table>';
	return table;
};

function print(x){
	alert('x is clicked'+x);
};

var rollDice = function(){
	$.post('instruction/action=rollDice',function(data,status){
		console.log(data);
		updateDiceValues();
	});
};

var updateDiceValues = function(){
	$.get('update/toUpdate=diceValues',function(data,status){
		document.querySelector('#diceValues').innerHTML = data;
	});
};

var currentPlayer = function(){
	$.get('enquiry/question=currentPlayer',function(data,status){
		var html = turnTemplate.replace('__UserID__',data);
		document.querySelector('#playerTurn').innerHTML=html;
	});
}

var coinToDOMElement = function(coin) {
	var coinImage=coin.colour+"_coin.svg";
	return '<img src="/svg/'+coinImage+'" class="coins" id="'+coin.id+'">';
}

var coinsThatHaveMoved=function(oldStatus,newStatus) {
	if(!oldStatus)
		return Object.keys(newStatus);
	return Object.keys(oldStatus).filter(function(coinId){
		return oldStatus[coinId].currentPosition!=newStatus[coinId].currentPosition;
	});
}

var placeCoinsInCurrentPosition=function(stateOfGame,coinsToBeUpdated){
	coinsToBeUpdated.forEach(function(coinId) {
		var coin=stateOfGame[coinId];
		placeCoin(coin);
	});
};

var placeCoin = function(coin){
	if(coin.currentPosition == -1)
		document.getElementById(coin.colour+'_yard').innerHTML+=coinToDOMElement(coin);
	else
		document.getElementById(coin.currentPosition).innerHTML+=coinToDOMElement(coin)
};

var removeCoinsFromOldPositions = function(coinsToBeErased){
	coinsToBeErased.forEach(function(coinId) {
		console.log('hahaha============================',coinId)
		$("#"+coinId).remove();
	});
} 

var refreshBoard = function(){
	$.get('update/toUpdate=board',function(data,status){
		var stateOfGame = JSON.parse(data);
		var coinsToBeUpdated = coinsThatHaveMoved(currentStateOfGame,stateOfGame);
		removeCoinsFromOldPositions(coinsToBeUpdated);

		placeCoinsInCurrentPosition(stateOfGame,coinsToBeUpdated);
		currentStateOfGame=stateOfGame;
		var coins = $('.coins');
		for(var i=0; i<coins.length;i++){
			coins[i].onclick = coinClick;
		}; 
	});
};

var coinClick = function(){
	selectedCoin = this.id;
	$.get('enquiry/question=movesWhere&coin='+selectedCoin,function(data){
		activeTiles = JSON.parse(data);
		console.log(activeTiles);
		for(var pos in activeTiles){
			console.log(document.getElementById(activeTiles[pos]))
			document.getElementById(activeTiles[pos]).onclick = tileClick;
		};
	});
};

var tileClick = function(){
	if(selectedCoin){
		$.post('instruction/action=moveCoin&coin='+selectedCoin+'&position='+this.id,function(data){
			selectedCoin = undefined;
			refreshBoard();
			for(var pos in activeTiles){
				document.getElementById(activeTiles[pos]).onclick = null;
			};
			activeTiles=undefined;
		});
	};
};

window.onload = function(){
	document.getElementById("board").innerHTML = makeGrid();
	var safePlaces = ['4,2','2,4','2,2','0,2','2,0'];
	var outerLoop = ['-1,5','0,5','1,5','2,5','3,5','4,5','5,5','-1,4','-1,3','-1,2','-1,1','-1,0','-1,-1',
					'0,-1','1,-1','2,-1','3,-1','4,-1','5,-1','5,0','5,1','5,2','5,3','5,4','5,5'];
	var yards = ['2,-1','5,2','2,5','-1,2'];
	safePlaces.forEach(function(safePlace){
		document.getElementById(safePlace).className = 'safePlace';
	});
	outerLoop.forEach(function(tile){
		document.getElementById(tile).className = 'outerTile'
	});
	var colorSequence=["red","green","blue","yellow"];
	yards.forEach(function(place,index){
		document.getElementById(place).className = 'parking';
		document.getElementById(place).id = colorSequence[index]+'_yard';
	});
	setInterval(function(){
		refreshBoard();
		check();
		currentPlayer();
	},500); 
	document.querySelector('#dice').onclick = rollDice;	
};
