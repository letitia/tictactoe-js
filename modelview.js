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
				var rowNum = coord[0],
					colNum = coord[1];
				$('.box.row'+rowNum+'.col'+colNum).addClass('selected').text(TTT.letters[i]);
			});
		}
	},

	onClickBox : function(evt)
	{
		var $box = $(evt.currentTarget);
		
		var rowNum = $box.data('row'),
			colNum = $box.data('col');

		var humanNotTaken = true,
			computerNotTaken = true;

		$.each(this.model.get('humanMoves'), function(i, move) {
			if (move[0] === rowNum && move[1] === colNum)
				humanNotTaken = false;
		});

		$.each(this.model.get('computerMoves'), function(i, move) {
			if (move[0] === rowNum && move[1] === colNum)
				computerNotTaken = false;
		});

		if (humanNotTaken && computerNotTaken) {
			this.model.get('humanMoves').push([rowNum, colNum]);

			this.render();

			this.model.set('currPlayer', 1);
		}
	},

	setupPlayer : function() {
		if (!this.model.get('gameOver')) {
			var currPlayer = this.model.get('currPlayer');
			this._letter = TTT.letters[currPlayer];
			var statusMsg = currPlayer ? 'Computer\'s' : 'Your';
			this._status.text(statusMsg + ' turn.');
		}
	},

	onMouseEnter : function(evt) {
		var $box = $(evt.currentTarget);
		if (this.model.get('currPlayer') === 0 && !$box.hasClass('selected'))
			$box.addClass('selected').text(this._letter);
	},

	onMouseLeave : function(evt) {
		if (this.model.get('currPlayer') === 0)
			this.render();
	},

	endTheGame : function() {
		console.log('ending the game');
		var winnerNum = this.model.get('winner');
		if (winnerNum !== -1) {
			var winner = TTT.players[winnerNum];
			this._status.text('Game over. ' + this.model.get(winner + 'Name') + ' wins!');
		}
		else
			this._status.text('It was a tie.  GG');
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
		gameOver: false,
		winner: -1
	},

	initialize : function() {
		_.bindAll(this);
		computerNames = [ 'C3PO', 'Bender', 'Karel', 'R2D2', 'A Cylon', 'GLaDOS' ];
		this.set('computerName', computerNames[Math.floor((Math.random()*computerNames.length))]);

		this.bind('change:currPlayer', this.doTurn);
	},

	doTurn : function()
	{
		console.log('Changing player.  currPlayer is '+ this.get('currPlayer'));
		if (!this.get('gameOver'))
		{
			var currPlayer = this.get('currPlayer');
			// check if previous player won
			var otherPlayerNum = currPlayer ^ 1;
			if (this.hasWon(otherPlayerNum))
				this.set({ gameOver: true, winner: otherPlayerNum });
			else {
				var numMoves = this.get('humanMoves').length + this.get('computerMoves').length;
				if ( numMoves === TTT.numRows*TTT.numCols )
					this.set({ gameOver: true });
				else {
					if (currPlayer)
						this.doComputerTurn();
				}
			}
		}
	},

	doComputerTurn : function()
	{
		console.log('doing comp turn');
		// pick random unselected box
		var rowNum, colNum;

		while (true) {
			rowNum = Math.floor((Math.random()*TTT.numRows)),
			colNum = Math.floor((Math.random()*TTT.numCols));

			var humanNotTaken = true,
				computerNotTaken = true;

			$.each(this.get('humanMoves'), function(i, move) {
				if (move[0] === rowNum && move[1] === colNum)
					humanNotTaken = false;
			});

			$.each(this.get('computerMoves'), function(i, move) {
				if (move[0] === rowNum && move[1] === colNum)
					computerNotTaken = false;
			});
			if ( humanNotTaken && computerNotTaken )
				break;
		}
		this.get('computerMoves').push([rowNum, colNum]);
		this.set('currPlayer', 0);
	},

	
	hasWon : function(playerNum)
	{
		var playerMoves = this.get(TTT.players[playerNum]+'Moves'),
			byRows = [ [], [], [] ],
			byCols = [ [], [], [] ],
			byDiagonals = [ [], [] ];		// [0,0  1,1  2,2]   [0,2  1,1  2,0]

		// categorize player's moves by rows, columns and diagonals
		$.each(playerMoves, function(i, coords) {
			
			var rowNum = coords[0],
				colNum = coords[1];
			
			byRows[rowNum].push(coords);
			byCols[colNum].push(coords);

			if (rowNum === colNum || Math.abs(rowNum - colNum) === 2) {
				// add to diagonals
				if (rowNum === colNum || rowNum === 1) {
					byDiagonals[0].push(coords);
				}
				if (Math.abs(rowNum - colNum) === 2 || rowNum === 1) {
					byDiagonals[1].push(coords);
				}
			}
		});

		return this.isFilled([byRows, byCols, byDiagonals]);
	},

	// checks whether any of the rows, columns or diagonals on the grid are filled
	isFilled : function(arr) {
		var result = false;
		$.each(arr, function(i, byArray) {
			$.each(byArray, function(j, movesInThatDimension) {
				if (movesInThatDimension.length === TTT.numCols) {
					result = true;
					return;
				}
			});
			if (result) return;
		});
		
		return result;
	}

});
