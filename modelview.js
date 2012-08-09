TTT = {
	Views: {},
	Models: {},
	players: ['human', 'computer'],
	letters: ['X', 'O'],
	numRows: 3,
	numCols: 3,
	HUMAN: 0,
	COMPUTER: 1,
	NONE: -1
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
		this._grid = this.model.get('grid');

		this.model.bind("change:grid", this.render);
		this.model.bind("change:currPlayer", this.setupPlayer);
		this.model.bind("change:gameOver", this.endTheGame);

		this.setupPlayer();
		this.render();
	},

	render : function(arg1, arg2, arg3)
	{
		var row, col;
		for (row = 0; row < TTT.numRows; row++) {
			for (col = 0; col < TTT.numCols; col++)
			{
				var player = this._grid[row][col],
					$box = $('#grid .box.row'+row+'.col'+col);
				if (player === TTT.NONE) {
					$box.removeClass('selected').text('');
				}
				else {
					$box.addClass('selected').text(TTT.letters[player]);
				}

			}
		}
	},

	onClickBox : function(evt)
	{
		var $box = $(evt.currentTarget);
		
		var rowNum = $box.data('row'),
			colNum = $box.data('col');

		if ( this._grid[rowNum][colNum] === TTT.NONE ) {
			this._grid[rowNum][colNum] = TTT.HUMAN;

			this.model.set({
				currPlayer: TTT.COMPUTER,
				numTurns: 1 + this.model.get('numTurns')
			});
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
		if (this.model.get('currPlayer') === TTT.HUMAN && !$box.hasClass('selected'))
			$box.addClass('selected').text(this._letter);
	},

	onMouseLeave : function(evt) {
		if (this.model.get('currPlayer') === TTT.HUMAN)
			this.render();
	},

	endTheGame : function() {
		this.render();
		var winnerNum = this.model.get('winner');
		if (winnerNum !== TTT.NONE) {
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
		currPlayer: 1,
		grid: [ [-1, -1, -1], [-1, -1, -1], [-1, -1, -1] ],
		numTurns: 0,
		humanName: 'You',
		computerName: '',
		gameOver: false,
		winner: TTT.NONE
	},

	initialize : function() {
		_.bindAll(this);
		computerNames = [ 'C3PO', 'Bender', 'Karel', 'R2D2', 'A Cylon', 'GLaDOS' ];
		this.set('computerName', computerNames[Math.floor((Math.random()*computerNames.length))]);

		this._grid = this.get('grid');

		this.bind('change:currPlayer', this.doTurn);
		this.bind('change:numTurns', this.checkGameOver);
		this.doTurn();
	},

	doTurn : function()
	{
		if ( this.gameIsOver() ) {
			this.set('gameOver', true);
		}
		else if (this.get('currPlayer') === TTT.COMPUTER)
			this.doComputerTurn();
	},

	doComputerTurn : function()
	{
		// pick random unselected box
		var rowNum, colNum;

		while (true) {
			rowNum = Math.floor((Math.random()*TTT.numRows)),
			colNum = Math.floor((Math.random()*TTT.numCols));

			if ( this._grid[rowNum][colNum] === TTT.NONE )
				break;
		}
		this._grid[rowNum][colNum] = TTT.COMPUTER;
		this.set('numTurns', 1 + this.get('numTurns'));
		this.set('currPlayer', TTT.HUMAN);
	},

	gameIsOver : function()
	{
		// check if either player won
		for (var i = 0; i < TTT.players.length; i++) {
			if ( this.hasWon(i) ) {
				this.set({ winner: i });
				return true;
			}
		}

		if ( this.get('numTurns') >= TTT.numRows*TTT.numCols )
			return true;
	},
	
	hasWon : function(playerNum)
	{
		var playerMoves = this.get(TTT.players[playerNum]+'Moves'),
			byRows = [ [], [], [] ],
			byCols = [ [], [], [] ],
			byDiagonals = [ [], [] ];		// [0,0  1,1  2,2]   [0,2  1,1  2,0]

		// categorize player's moves by rows, columns and diagonals

		var row, col;
		for (row = 0; row < TTT.numRows; row++) {
			for (col = 0; col < TTT.numCols; col++)
			{
				var player = this._grid[row][col];
				if (player === playerNum) {
					byRows[row].push(true);
					byCols[col].push(true);

					if (row === col || Math.abs(row - col) === 2) {
						// add to diagonals
						if (row === col || row === 1) {
							byDiagonals[0].push(true);
						}
						if (Math.abs(row - col) === 2 || row === 1) {
							byDiagonals[1].push(true);
						}
					}
				}
			}
		}

		return this.isFilled([byRows, byCols, byDiagonals]);
	},

	// checks whether any of the rows, columns or diagonals on the grid are filled
	isFilled : function(arrays) {
		var result = false;
		$.each(arrays, function(i, arr) {
			$.each(arr, function(j, movesInThatDimension) {
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
