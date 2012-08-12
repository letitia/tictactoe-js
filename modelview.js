TTT = {
	Views: {}, Models: {},
	players: ['human', 'computer'],
	letters: ['X', 'O'],
	numRows: 3,
	numCols: 3,
	HUMAN: 0,
	COMPUTER: 1,
	NONE: -1,
	TIE: -2
};

TTT.Views.GridView = Backbone.View.extend(
{
	events: {
		"click .box" : "onClickBox",
		"mouseenter .box" : "onMouseEnter",
		"mouseover .box" : "onMouseEnter",
		"mouseleave .box" : "onMouseLeave",
	},

	initialize: function() {
		_.bindAll(this);
		
		this._status = $('#status');

		this.model.bind("change:grid", this.render);
		this.model.bind("change:currPlayer", this.setupPlayer);
		this.model.bind("change:gameOver", this.manageGame);

		this.setupPlayer();
		this.render();
		this.manageGame();
	},

	render : function()
	{
		var row, col,
			grid = this.model.get('grid');
		for (row = 0; row < TTT.numRows; row++) {
			for (col = 0; col < TTT.numCols; col++)
			{
				var player = grid[row][col],
					$box = $('#grid .box.row'+row+'.col'+col);
				if (player === TTT.NONE)
					$box.removeClass('selected').text('');
				else
					$box.addClass('selected').text(TTT.letters[player]);
			}
		}
	},

	onClickBox : function(evt)
	{
		if (!this.model.get('gameOver') && this.model.get('currPlayer') === TTT.HUMAN) {
			var $box = $(evt.currentTarget),
				grid = this.model.get('grid');;
			
			var rowNum = $box.data('row'),
				colNum = $box.data('col');

			if ( grid[rowNum][colNum] === TTT.NONE ) {
				grid[rowNum][colNum] = TTT.HUMAN;
				this.model.unset('grid', { silent: true });
				this.model.set({
					grid: grid,
					currPlayer: TTT.COMPUTER,
					numTurns: 1 + this.model.get('numTurns')
				});
			}
		}
	},

	setupPlayer : function()
	{
		if (!this.model.get('gameOver')) {
			var currPlayer = this.model.get('currPlayer');
			this._letter = TTT.letters[currPlayer];
			var statusMsg = currPlayer ? 'Computer ('+ this.model.get('computerName') +')\'s' : 'Your';
			this._status.text(statusMsg + ' turn.');
		}
	},

	onMouseEnter : function(evt) {
		var $box = $(evt.currentTarget);
		if (!this.model.get('gameOver') && this.model.get('currPlayer') === TTT.HUMAN && !$box.hasClass('selected'))
			$box.addClass('selected').text(this._letter);
	},

	onMouseLeave : function(evt) {
		if (!this.model.get('gameOver') && this.model.get('currPlayer') === TTT.HUMAN)
			this.render();
	},

	manageGame : function() {
		if (this.model.get('gameOver'))
		{
			this.render();
			var winnerNum = this.model.get('winner');
			if ( winnerNum === TTT.TIE )
				this._status.text('It was a tie.  GG');
			else if (winnerNum !== TTT.NONE) {
				var winner = TTT.players[winnerNum];
				var msg = (winnerNum === TTT.HUMAN) ? ' win!!  Go humanity!!' : ' wins.  :(';
				this._status.text('Game over. ' + this.model.get(winner + 'Name') + msg);
			}
			else
				this._status.text('');
			$(this.el).addClass('disabled');
		}
		else {
			$(this.el).removeClass('disabled');
			this.setupPlayer();
		}
	}
});


TTT.Views.ControlsView = Backbone.View.extend({
	events: {
		"click button.btn.btn-primary" : "clickStartGame"
	},

	initialize: function () {
		_.bindAll(this);

		this._playerselect = $('#playerselect');
		this._button = $('.btn.btn-primary');

		this.model.bind('change:gameOver', this.render);
	},

	render : function() {
		if ( this.model.get('gameOver')) {
			this._button.removeClass('disabled');
			this._playerselect.removeAttr('disabled');
		}
	},

	clickStartGame : function(evt)
	{
		if (! this._button.hasClass('disabled')) {
			// reset model
			var newGrid = new Array([-1, -1, -1], [-1, -1, -1], [-1, -1, -1]);
			this.model.set(this.model.defaults);
			this.model.set({ gameOver: false, grid: newGrid, currPlayer: 1*this._playerselect.val() });
			this._button.addClass('disabled');
			this._playerselect.attr('disabled', 'true');
		}
	}
});


TTT.Models.Game = Backbone.Model.extend(
{
	defaults: {
		currPlayer: TTT.NONE,
		grid: [[-1, -1, -1], [-1, -1, -1], [-1, -1, -1]],
		numTurns: 0,
		humanName: 'You',
		gameOver: true,
		winner: TTT.NONE
	},

	initialize : function() {
		_.bindAll(this);
		computerNames = [ 'C3PO', 'Bender', 'Karel', 'R2D2', 'A Cylon', 'GLaDOS' ];
		this.set('computerName', computerNames[Math.floor((Math.random()*computerNames.length))]);

		this._corners = [ [0,0], [0,2], [2,0], [2,2] ];
		this._edges = [ [1,0], [0,1], [2,1], [1,2] ];
		this.bind('change:currPlayer', this.doTurn);
	},

	doTurn : function()
	{
		var that = this;
		if ( this.gameIsOver() ) {
			this.set('gameOver', true);
		}
		else if (this.get('currPlayer') === TTT.COMPUTER)
			setTimeout(that.doComputerTurn, 900);
	},

	doComputerTurn : function()
	{
		var coords, grid = this.get('grid');

		if (this.get('numTurns') < 2) {
			coords = this.makeFirstMove(grid);
		}
		else {
			coords = this.winTheGame(TTT.COMPUTER);
			if (coords.length === 0)
				coords = this.winTheGame(TTT.HUMAN);		// block Human from winning
			if (coords.length === 0) {
				coords = this.damageControl(grid);
			}
		}

		grid[coords[0]][coords[1]] = TTT.COMPUTER;
		this.unset('grid', { silent: true });
		this.set({
			grid: grid,
			numTurns: 1 + this.get('numTurns'),
			currPlayer: TTT.HUMAN
		});
	},

	gameIsOver : function()
	{
		if (this.get('gameOver'))
			return true;

		// check if either player won
		var grid = this.get('grid');
		for (var i = 0; i < TTT.players.length; i++) {
			if ( this.hasWon(i, grid) ) {
				this.set({ winner: i });
				return true;
			}
		}
		// check if board is full
		if ( this.get('numTurns') >= TTT.numRows*TTT.numCols ) {
			this.set('winner', TTT.TIE);
			return true;
		}
		return false;
	},
	
	hasWon : function(playerNum, grid)
	{
		var byRows = [ [], [], [] ],
			byCols = [ [], [], [] ],
			byDiagonals = [ [], [] ];		// [0,0  1,1  2,2]   [0,2  1,1  2,0]

		// categorize player's moves by rows, columns and diagonals
		var row, col;
		for (row = 0; row < TTT.numRows; row++) {
			for (col = 0; col < TTT.numCols; col++)
			{
				var player = grid[row][col];
				if (player === playerNum) {
					byRows[row].push(true);
					byCols[col].push(true);

					if (row === col || Math.abs(row - col) === 2) {
						// add to diagonals
						if (row === col || row === 1)
							byDiagonals[0].push(true);
						if (Math.abs(row - col) === 2 || row === 1)
							byDiagonals[1].push(true);
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
	},

	/*  iterate through every spot on the board to see if there
	 *  is a move that will win the game for the specified player.
	 */
	winTheGame : function(playerNum) {
		var grid = this.get('grid'),
			row, col;
		for (row = 0; row < TTT.numRows; row++) {
			for (col = 0; col < TTT.numCols; col++)
			{
				if ( grid[row][col] === TTT.NONE ) {
					var gridCopy = $.extend(true, [], grid);
					gridCopy[row][col] = playerNum;
					if (this.hasWon(playerNum, gridCopy))
						return [row, col];
				}
			}
		}
		return [];
	},

	// pick random unselected box
	pickRandomBox : function()
	{
		var rowNum, colNum,
			grid = this.get('grid');

		while (true) {
			rowNum = Math.floor((Math.random()*TTT.numRows)),
			colNum = Math.floor((Math.random()*TTT.numCols));

			if ( grid[rowNum][colNum] === TTT.NONE )
				break;
		}
		return [rowNum, colNum];
	},

	makeFirstMove : function(grid) {
		if (grid[1][1] === TTT.NONE)		// take middle spot if available
			return [1, 1];
		else
			return this.getAvailableSpot(grid, this._corners);
	},

	/* take available corners, unless human has you in a  _X|_|__  situation.
	 *													  __|O|__
	 *														| |X
	 */
	damageControl : function(grid) {
		var coords,
			oppHasTwoOppositeCorners = (grid[0][0] ===TTT.HUMAN && grid[2][2] ===TTT.HUMAN)
			|| (grid[0][2] ===TTT.HUMAN && grid[2][0] ===TTT.HUMAN);

		if (grid[1][1] === TTT.COMPUTER && oppHasTwoOppositeCorners)
			return this.getAvailableSpot(grid, this._edges);
		else {
			coords = this.getAvailableSpot(grid, this._corners);
			if (coords.length === 0)
				coords = this.getAvailableSpot(grid, this._edges);
			return coords;
		}
	},

	getAvailableSpot : function(grid, spots) {
		for (var i = 0; i < spots.length; i++) {
			var spot = spots[i],
				row = spot[0],
				col = spot[1];
			if (grid[row][col] === TTT.NONE)
				return spot;
		}
		return [];
	}
});
