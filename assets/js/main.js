function addElement(canvas, data, line, column) {
	var e = $('<div class="case" draggable="false" cellType="' + data[line][column] + '" line="' + line + '" column="' + column + '"></div>');
	$(canvas).append(e);
	e.css({"top" :  (line * 20) + "px", "left" :  (column * 20) + "px"});
}

function initializeData(data) {
	for (var line = 0; line < 40; line++) {
		data[line] = [];
		for (var column = 0; column < 40; column++) {
			data[line][column] = 0;
		}
	}

	return data;
}

function draw(data, canvas) {
	for (var line = 0; line < 40; line++) {
		for (var column = 0; column < 40; column++) {
			addElement(canvas, data, line, column);
		}
	}
}

function unsetElementOnThisCell(sfElementsPosition, y, x) {
	if (sfElementsPosition[0][0] == x && sfElementsPosition[0][1] == y) {
		sfElementsPosition[0] = [-1, 0];
	}
	if (sfElementsPosition[1][0] == x && sfElementsPosition[1][1] == y) {
		sfElementsPosition[1] = [-1, 0];
	}
}

function issetThisElement(sfElementsPosition, type) {
	switch (type) {
		case 'start':
			return (sfElementsPosition[0][0] != -1);
			break;
		case 'finish':
			return (sfElementsPosition[1][0] != -1);
			break;
	}
}

function getDistance(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function checkSurrounds(data, currentCell, start, finish) {
	var surrounds = [];

	//console.log("Surrounds indexs: ");
	for (var surround_line = -1; surround_line < 2; surround_line++) {
		for (var surround_column = -1; surround_column < 2; surround_column++) {
			if (currentCell[1] + surround_line < 0 || currentCell[1] + surround_line > 39 || currentCell[0] + surround_column < 0 || currentCell[0] + surround_column > 39 || (surround_line == 0 && surround_column == 0) || data[currentCell[1] + surround_line][currentCell[0] + surround_column] == 1 || data[currentCell[1] + surround_line][currentCell[0] + surround_column] == 5) {
				// Case innaccessible
			} else {
				A = getDistance(currentCell[0] + surround_column, currentCell[1] + surround_line, start[0], start[1]);
				B = getDistance(currentCell[0] + surround_column, currentCell[1] + surround_line, finish[0], finish[1]);
				var column = currentCell[0] + surround_column;
				var line = currentCell[1] + surround_line;
				surrounds[(line * 40) + column] = [column, line, A, B, (line * 40) + column];
				//console.log((line * 40) + column);
			}
		}
	}

	return surrounds;
}

function getNearestCellAccessible(accessibleCells) {
	var nearest = [0, 0, 0, 9999999];

	for (var key in accessibleCells) {
		if (accessibleCells[key][3] < nearest[3]) {
			nearest = accessibleCells[key];
		}
	}

	return nearest;
}

$(function() {
	var body = $("body"), canvasInner = $("#canvas .inner"), canvasOver = $("#canvas .inner .over");
	var reset = $(".btn#reset"), solve = $(".btn#solve"), info = $(".btn#info");
	var canvasOffset = canvasInner.offset();
	var posX, posY;
	var data = [];
	var detect = false, paused = true;
	var mouseCase = 0;
	var sfElementsPosition = [[-1, 0], [-1, 0]];

	$(body).bind("contextmenu", function(event) {
        event.preventDefault();
    });

	data = initializeData(data);

	draw(data, canvasInner);

	$(reset).click(function(event) {
		for (var line = 0; line < 40; line++) {
			for (var column = 0; column < 40; column++) {
				data[line][column] = 0;
				canvasInner.children('.case[line=' + line + '][column=' + column + ']').attr({'cellType' : '0'});
			}
		}
		sfElementsPosition = [[-1, 0], [-1, 0]];
	});

	$(info).click(function(event) {
		alert("Reprendre pour commencer/reprendre, Pause pour mettre en pause !\n\nTouche S = Départ\nTouche E = Arrivée\nBouton gauche souris = Dessiner des murs\nBouton droite souris = Effacer\n\nCliquez-glissez pour plus de fun !");
	});

	$(canvasInner).mousedown(function(event) {
		detect = true;
		switch (event.which) {
			case 1:
				mouseCase = 1;
				break;
			case 2:
				mouseCase = 0;
				break;
			default:
				mouseCase = 0;
		}
	});

	$(canvasInner).mouseup(function(event) {
		detect = false;
	});

	$(body).mousemove(function(event) {
		posX = event.pageX - canvasOffset.left;
		posY = event.pageY - canvasOffset.top;
		if (!detect) {
			canvasOver.css({'opacity' : '0.1'});
		} else {
			canvasOver.css({'opacity' : '0'});
			//console.log("posX: " + posX + " - posY: " + posY);
			if (posX > 0 && posX < 800 && posY > 0 && posY < 800) {
				var lineFromPosY = Math.floor(posY / 20);
				var columnFromPosX = Math.floor(posX / 20);
				if (data[lineFromPosY][columnFromPosX] != mouseCase) {
					unsetElementOnThisCell(sfElementsPosition, lineFromPosY, columnFromPosX);
					data[lineFromPosY][columnFromPosX] = mouseCase;
					canvasInner.children('.case[line=' + lineFromPosY + '][column=' + columnFromPosX + ']').attr({'cellType' : mouseCase});
				}
			} else {
				detect = false;
			}
		}
	});

	$(body).keydown(function(event) {
		if (event.which == 83 || event.which == 69) {
			
			var cellType = (event.which === 83) ? 2 : 3;

			var lineFromPosY = Math.floor(posY / 20);
			var columnFromPosX = Math.floor(posX / 20);

			if (data[lineFromPosY][columnFromPosX] < 2) { // L'élément en cours sur cette case n'est pas un start/finish
				//console.log("ELEMENT ADDED");

				var elem = sfElementsPosition[cellType - 2];
				//console.log(elem);
				data[elem[1]][elem[0]] = 0;
				canvasInner.children('.case[line=' + elem[1] + '][column=' + elem[0] + ']').attr({'cellType' : '0'});
				sfElementsPosition[cellType - 2] = [columnFromPosX, lineFromPosY];
				
				data[lineFromPosY][columnFromPosX] = cellType;
				canvasInner.children('.case[line=' + lineFromPosY + '][column=' + columnFromPosX + ']').attr({'cellType' : cellType});
			}
		}
	});

	$(solve).click(function() {
		if (issetThisElement(sfElementsPosition, 'start') && issetThisElement(sfElementsPosition, 'finish')) {
			// START ET FINISH PRÉSENTS
			var path = [];
			var start = [sfElementsPosition[0][0], sfElementsPosition[0][1]];
			var finish = [sfElementsPosition[1][0], sfElementsPosition[1][1]];
			var distanceToFinish = getDistance(start[0], start[1], finish[0], finish[1]);
			start[2] = 0;
			start[3] = distanceToFinish;
			finish[2] = distanceToFinish;
			finish[3] = 0;
			var currentCell = [start[0], start[1], 0, distanceToFinish, (start[1] * 40) + start[0]];
			var surrounds = [];
			var accessibleCells = [];
			
			//console.log("Current cell:");
			//console.log(currentCell);

			path.push(currentCell);

			i = 0;
			while ((currentCell[0] != finish[0] || currentCell[1] != finish[1]) && i < 1600) {
				// Check surrounds
				surrounds = checkSurrounds(data, currentCell, start, finish);
				//console.log("Surrounds:");
				//console.log(surrounds);

				// Add unknow surrounds in the accessibles cells
				for (var key in surrounds) {
					if (typeof accessibleCells[key] == "undefined") {
						accessibleCells[key] = surrounds[key];
						if ((surrounds[key][1] != finish[1] || surrounds[key][0] != finish[0]) && (surrounds[key][1] != start[1] || surrounds[key][0] != start[0])) {
							data[surrounds[key][1]][surrounds[key][0]] = 4;
						}
					}
				}
				//console.log("Discovered cells:");
				console.log(accessibleCells);
				console.log("Length:" + accessibleCells.length);

				// Set new current cell
				currentCell = getNearestCellAccessible(accessibleCells);

				if (typeof currentCell[4] == "undefined") {
					console.log("Chemin impossible");
					break;
				} else {
					if ((currentCell[1] != finish[1] || currentCell[0] != finish[0]) && (currentCell[1] != start[1] || currentCell[0] != start[0])) {
						data[currentCell[1]][currentCell[0]] = 5;
						canvasInner.children('.case[line=' + currentCell[1] + '][column=' + currentCell[0] + ']').attr({'cellType' : 5});
					}
					path.push(currentCell);
					delete accessibleCells[currentCell[4]];

					console.log("New current cell:");
					console.log(currentCell[4]);

					console.log("i value:" + i + "\n\n");
					i++;
				}
				
			}
			//console.log("Path:");
			//console.log(path);

			for (var key in accessibleCells) {
				if ((accessibleCells[key][1] != finish[1] || accessibleCells[key][0] != finish[0]) && (accessibleCells[key][1] != start[1] || accessibleCells[key][0] != start[0])) {
					canvasInner.children('.case[line=' + accessibleCells[key][1] + '][column=' + accessibleCells[key][0] + ']').attr({'cellType' : 4});
				}
			}
		} else {
			console.log('Elements manquants !');
		}
	});

});