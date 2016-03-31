var update;

window.onload = function(){
	$('#continue').click(hideUserInfo);
};

var hideUserInfo = function(){
    if(!$('#name').val())
        return;
	$('.userInfo').addClass('hidden');
	$('.selectGame').removeClass('hidden');
    $('#createGame').click(function(){
        newGames();
    })
    $('#joinGame').click(function(){
        updateAvailableGames();
	    update = setInterval(updateAvailableGames, 1000);
    })
};

var createGame = function(withBot){
	var playerName = $('#name').val();
	var numberOfPlayers = $(this).val()[0];
	var obj = {};
	obj.name = playerName;
	obj.option = 'newGame';
	obj.numberOfPlayers = numberOfPlayers;
	obj.playWithBot = withBot;
	var form = createForm(obj, 'POST', 'login');
	clearInterval(update);
	form.submit();
};

var createForm = function(obj, method, action){
	var keys = Object.keys(obj);
	var form = document.createElement('form');
	var node = document.createElement("input");
	for (var i = 0; i < keys.length; i++) {
		node.name = keys[i];
		node.value = obj[keys[i]];
		form.appendChild(node.cloneNode());
	};
	form.method = method;
	form.action = action;
	form.style.display = "none";
	return form;
};

var joinGame = function(id){
	var playerName = $('#name').val();
	var obj = {};
	obj.name = playerName;
	obj.option = 'joinGame';
	obj.gameId = id;
	var form = createForm(obj, 'POST', 'login');
	form.submit();
};
