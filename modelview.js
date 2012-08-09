TTT = {
	Views: {},
	Models: {},
	players: ['human', 'computer'],
	letters: ['X', 'O'],
	numRows: 3, numCols: 3
};

TTT.Views.GridView = Backbone.View.extend(
{
	events: {
		"click .box" : "onClickBox",
		"mouseenter .box" : "onMouseEnter",
		"mouseleave .box" : "onMouseLeave"
	},

	initialize: function() {
		_.bindAll(this);
		
		this._status = $('#status');

		
		this.model.bind("change:humanMoves", this.render).bind("change:computerMoves", this.render);
		this.model.bind("change:currPlayer", this.setupPlayer);
		this.model.bind("change:gameOver", this.endTheGame);
		this.setupPlayer();
		this.render();
	},

	render : function()
	{
		// clear all selections

		$('#grid .box').each(function(i, box) {
			$(box).removeClass('selected').text('');
		});

		// determine which boxes are actually selected

		for (var i = 0; i < TTT.players.length; i++) {
			var player = TTT.players[i],
				movesList = this.model.get(player+'Moves');
			$.each(movesList, function(j, coord) {
				var rowNum = coord[0], colNum = coord[1];
				$('.box.row'+rowNum+'.col'+colNum).addClass('selected').text(TTT.letters[i]);
			});			
		}
	},

	onClickBox : function(evt)
	{
		// add to curr player's moves
		var rowNum, colNum;
		var classnames = $(evt.currentTarget).attr('class').split(' ');
		$.each(classnames, function(i, classname) {
			
			if (classname.indexOf('row') !== -1) {
				var matches = classname.match(/\d+$/);
				if (matches)  rowNum = matches[0]*1;
			}
			else if (classname.indexOf('col') !== -1) {
				var matches = classname.match(/\d+$/);
				if (matches)  colNum = matches[0]*1;
			}
		});

		this.model.get('humanMoves').push([rowNum, colNum]);

		this.render();

		this.model.set('currPlayer', 1);
	},

	setupPlayer : function() {
		var currPlayer = this.model.get('currPlayer');
		this._letter = TTT.letters[currPlayer];
		var statusMsg = currPlayer ? 'Computer\'s' : 'Your';
		this._status.text(statusMsg + ' turn.');
	},

	onMouseEnter : function(evt) {
		if (this.model.get('currPlayer') === 0)
			$(evt.currentTarget).addClass('selected').text(this._letter);
	},

	onMouseLeave : function(evt) {
		if (this.model.get('currPlayer') === 0)
			this.render();
	},

	endTheGame : function() {

	}
});

TTT.Models.Game = Backbone.Model.extend(
{
	defaults: {
		currPlayer: 0,
		humanMoves: [],
		computerMoves: [],
		humanName: 'You',
		computerName: '',
		gameOver: false
	},

	initialize : function() {
		_.bindAll(this);
		computerNames = [ 'C3PO', 'Bender', 'Karel', 'R2D2', 'A Cylon', 'GLaDOS' ];
		this.set('computerName', computerNames[Math.floor((Math.random()*computerNames.length))]);

		this.bind('change:currPlayer', this.doTurn);
	},

	doTurn : function() {
		// check if previous player won
		if (this.hasWon()) {
			this.set('gameOver', true);
		}

		if (this.currPlayer) {
			// pick random box

			// 
		}
	},

	// 
	hasWon : function() {
		var gameOver = false,
			i = 0, j = 0;

		/*for (i; i < TTT.numRows; i++) {
			this.checkRowComplete(i);
		}
		for (j; j < TTT.numCols; j++) {
			this.checkColumnComplete(j);
		}
		this.checkDiagonalsComplete();*/
	}

});

/*
TTT.Models.Computer = MyBackbone.Models.Player.extend(
{
	
	initialize : function() {
		_.bindAll(this);
		computerNames = [ 'C3PO', 'Bender', 'Karel', 'R2D2', 'A Cylon', 'GLaDOS' ];
		this.name = possibleNames[Math.floor((Math.random()*possibleNames.length)+1)];

	},

	doTurn : function() {

	}
});
*/