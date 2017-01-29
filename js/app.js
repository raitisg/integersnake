var size = 5;
var selected;
var grid;
var score;
var cells;

var $canvas;
var $score;
var $retry;
var $gameOver;

var isMouseDown = false;
var isTouchDevice = 'ontouchstart' in window;

init();

function $one(selector) {
	return document.querySelector(selector);
}
function $all(selector) {
	return document.querySelectorAll(selector);
}

function getElementIndex(node) {
	var children = node.parentNode.childNodes;
	var index = 0;

	for (var i=0; i<children.length; i++) {
		if (children[i] === node) {
			return index;
		}

		if (children[i].nodeType === 1) {
			index++;
		}
	}

	return -1;
}

function init() {
	$gameOver = $one('#game-over');
	$canvas = $one('#canvas');
	$score = $one('#score');
	$retry = $one('#retry');

	var cells_html = '';
	var css_size = (100 / size) + '%';
	for (var i = 0; i < (size * size); i++) {
		cells_html += '<div class="square" style="width: '+css_size+'; height: '+css_size+';"><span class="cell" data-value=""></span></div>';
	}
	$canvas.innerHTML = cells_html;

	cells = $all('.cell');

	attachListeners();
	start();

	setTimeout(function(){
		$canvas.classList.remove('hidden');
	}, 100);
}

function start() {
	selected = [];
	grid = [];
	score = 0;

	increaseScore(0);

	initGrid();

	$gameOver.classList.remove('active');
}

/**
 * Init grid with new random numbers.
 */
function initGrid() {
	var x, y, n;

	// Init.
	for (y = 0; y < size; y++) {
		grid[y] = new Array(size);
		for (x = 0; x < size; x++) {
			grid[y][x] = randomSquare();
		}
	}

	// Draw.
	n = 0;
	for (y = 0; y < size; y++) {
		for (x = 0; x < size; x++) {
			setCellValue(n++, grid[y][x]);
		}
	}
}

/**
 * Return random integer between 1 and 3.
 *
 * @returns {Number}
 */
function randomSquare() {
	return Math.ceil(Math.random() * 3);
}

/**
 * Attach all needed event listeners.
 */
function attachListeners() {
	var i;

	$retry.addEventListener('click', start);

	$score.addEventListener('dblclick', start);

	for (i = cells.length - 1; i >= 0; i--) {
		cells[i].addEventListener(isTouchDevice ? 'touchstart' : 'mousedown', function(event) {
			isMouseDown = true;
			addSelection(getElementIndex(this.parentElement));
		});
	}

	// touchmove does not support events across multiple events - 'this' is always the first element.
	$canvas.addEventListener(isTouchDevice ? 'touchmove' : 'mousemove', function(event) {
		if (!isMouseDown) {
			return;
		}

		var x = event.pageX || event.touches[0].pageX;
		var y = event.pageY || event.touches[0].pageY;
		var e = document.elementFromPoint(x, y);

		addSelection(getElementIndex(e.parentElement));
	});

	for (i = cells.length - 1; i >= 0; i--) {
		cells[i].addEventListener(isTouchDevice ? 'touchend' : 'mouseup', function() {
			isMouseDown = false;
			evaluateSelected();
			selected = [];
			for (var i = cells.length - 1; i >= 0; i--) {
				cells[i].classList.remove('selected');
			}
			if (isGameOver()) {
				gameOver();
			}
		});
	}
}

/**
 * Add nth cell to current selection.
 *
 * @param {Number} index
 */
function addSelection(index) {
	var last,
			len = selected.length;

	if (index === selected[len-1]) {
		return;
	}

	if (len > 1) {
		last = selected[len - 2];
		if (index === last) {
			last = selected.pop();
			cells[last].classList.remove('selected');
			return;
		}
	}

	if (selected.indexOf(index) !== -1) {
		return;
	}

	if (len > 0) {
		last = selected[len - 1];
		if (!isNeighbor(last, index)) {
			return;
		}
	}

	selected.push(index);
	cells[index].classList.add('selected');
}

/**
 * Check if two cells are neighbors.
 *
 * @param {Number} index1
 * @param {Number} index2
 * @returns {Boolean}
 */
function isNeighbor(index1, index2) {
	var diff = Math.abs(index1 - index2);

	if (diff !== 1 && diff !== size) {
		return false;
	}

	if (diff === 1) {
		mod1 = index1 % size;
		mod2 = index2 % size;
		if (Math.abs(mod1 - mod2) != 1) {
			return false;
		}
	}

	return true;
}

function evaluateSelected() {
	var s, i, x, y, values, points;

	if (!selected.length) {
		return;
	}

	values = [];
	for (i = 0; i < selected.length; i++) {
		s = selected[i];
		y = Math.floor(s / size);
		x = s % size;
		values.push(grid[y][x]);
	}

	s = values[0];
	for (i = 0; i < values.length; i++) {
		if (values[i] !== s) {
			return;
		}
	}

	points = 0;
	for (i = 0; i < values.length; i++) {
		points += values[i];
	}

	s = selected[selected.length - 1];
	y = Math.floor(s / size);
	x = s % size;

	grid[y][x] = points;
	setCellValue(s, points);
	if (selected.length > 1) {
		increaseScore(points);
	}

	for (i = 0; i < selected.length - 1; i++) {
		s = selected[i];
		y = Math.floor(s / size);
		x = s % size;
		grid[y][x] = randomSquare();
		setCellValue(s, grid[y][x]);
	}

	return;
}

/**
 * Update cell's value.
 *
 * @param {Number} index
 * @param {Number} value
 */
function setCellValue(index, value) {
	cells[index].setAttribute('data-value', value);
	cells[index].innerHTML = value;
}

/**
 * Check if there are no more valid moves.
 *
 * @returns {Boolean}
 */
function isGameOver() {
	var t1, i, j, s;

	for (i = 0; i < size; i++) {
		for (j = 0; j < size; j++) {
			s = grid[i][j];

			try {
				t1 = grid[i][j - 1];
				if (s == t1) {
					return false;
				}
			} catch (e) {}

			try {
				t1 = grid[i][j + 1];
				if (s == t1) {
					return false;
				}
			} catch (e) {}

			try {
				t1 = grid[i + 1][j];
				if (s == t1) {
					return false;
				}
			} catch (e) {}

			try {
				t1 = grid[i - 1][j];
				if (s == t1) {
					return false;
				}
			} catch (e) {}
		}
	}

	return true;
}

/**
 * Show game over screen.
 */
function gameOver() {
	$gameOver.classList.add('active');
}

/**
 * Increase score by n points.
 *
 * @param {Number} n
 */
function increaseScore(n) {
	score += n;
	$score.innerHTML = score;
}