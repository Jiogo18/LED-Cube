import uniqueFramePainter, { events, Vector3D, Pos3D, getVectorFromKey, paintLed, findColor, readLed } from './../../common/js/utils/uniqueFramePainter.js';
import { XLENGTH, YLENGTH, ZLENGTH } from '../../common/js/utils/frame.js';
import { randInt, hslToHex } from '../../common/js/utils/ColorPicker.js';

export var direction = new Vector3D(1, 0, 0);
/** @type {Pos3D[]} */
export var snake = [new Pos3D(0, 0, 0)];
for (let i = 0; i < 4; i++) {
	snake.push(snake[snake.length - 1].clone().add(direction));
}

/** @type {Pos3D} */
export var foodPos;
export const foodColor = 0xFF0000;

export function getSnakeColor() {
	return uniqueFramePainter.ledCubeTools.colorPicker.getDecimal();
}

export function getRandomPos() {
	return new Pos3D(randInt(0, XLENGTH - 1), randInt(0, YLENGTH - 1), randInt(0, ZLENGTH - 1));
}

events.onStart = () => {
	const randomSnakeColor = hslToHex(randInt(20, 340), randInt(50, 100), randInt(40, 60)); // couleur vive, sauf rouge (food)
	uniqueFramePainter.ledCubeTools.colorPicker.setColor(randomSnakeColor);
	uniqueFramePainter.ledCubeTools.colorPicker.addEventListener('pickup', () => refreshSnake());
	uniqueFramePainter.ledCubeTools.addEventListener(uniqueFramePainter.ledCubeTools.EVENTS.PAGE_UNLOADED, () => onPageClosing());
	refreshSnake();
	setInterval(move, 200);
	console.log("Snake started");
};

events.onReady = () => {
	spawnFood();
	refreshSnake();
	console.log("Snake ready", document.timeline.currentTime);
};

export function refreshSnake() {
	const color = getSnakeColor();
	for (let i = 0; i < snake.length - 1; i++) {
		paintLed(snake[i], color, { refresh: false });
	}
	if (foodPos) paintLed(foodPos, foodColor, { refresh: false });
	uniqueFramePainter.ledCubeTools.cubeViewer.refresh();
}

/**
 * Called when the page is closing
 * Remove the snake from the cube
 */
function onPageClosing() {
	for (let i = 0; i < snake.length; i++) {
		paintLed(snake[i], 0, { refresh: false });
	}
}

document.addEventListener('keydown', (e) => {
	if (e.repeat || e.altKey) return;
	var vector = getVectorFromKey(e.key);
	if (vector.x != 0 || vector.y != 0 || vector.z != 0) {
		direction = vector;
		e.preventDefault();
		e.stopPropagation();
	}
});

export function move() {
	var currentPos = snake[snake.length - 1];
	var nextPos = currentPos.clone().add(direction);
	// if the place is free
	if (snake.every((pos) => !pos.equals(nextPos))) {
		snake.push(nextPos);
		var eatFood = foodPos?.equals(nextPos);
		paintLed(currentPos, getSnakeColor(), { refresh: false });
		paintLed(nextPos, 0xFFFFFF, { refresh: false });
		if (eatFood)
			spawnFood(true);
		else {
			paintLed(snake.shift(), 0, { refresh: false });
			if (!findFood(true)) spawnFood();
		}
		uniqueFramePainter.ledCubeTools.cubeViewer.refresh();
	}
}

/**
 * Returns the position of the first food found
 */
export function findFood(onlyCurrentPos = false) {
	if (readLed(foodPos) == foodColor) return foodPos;
	if (onlyCurrentPos) return undefined;
	return findColor(foodColor);
}

/**
 * Spawn a food at a random position
 * If a food is already present (red color), use it
 */
export function spawnFood(justEaten = false) {
	foodPos = findFood();
	if (!foodPos || justEaten) {
		let tentative = 0;
		do {
			foodPos = getRandomPos();
			tentative++;
			if (tentative > 200) {
				alert("You broke the game! Congratulations!");
				return;
			}
		} while (readLed(foodPos) != 0);
	}
	paintLed(foodPos, foodColor);
}

export default {
	uniqueFramePainter,
	ledCubeTools: uniqueFramePainter.ledCubeTools,
	direction,
	snake,
	get foodPos() { return foodPos; },
	refreshSnake,
	move,
	spawnFood,
	findFood,
};