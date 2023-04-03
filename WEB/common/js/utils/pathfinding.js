import { XLENGTH, YLENGTH, ZLENGTH } from './frame.js';
import { Pos3D } from './uniqueFramePainter.js';

/**
 * @param {Pos3D} a
 * @param {Pos3D} b
 */
function manhattanDistance(a, b) {
	return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);
}

/**
 * @param {Pos3D} a
 * @param {Pos3D} b
 */
function isNextTo(a, b) {
	return manhattanDistance(a, b) == 1;
}

/**
 * @param {number} defaultValue
 */
function createGrid(defaultValue) {
	return Array.from({ length: ZLENGTH }, () => Array.from({ length: YLENGTH }, () => Array.from({ length: XLENGTH }, () => defaultValue)));
}

/**
 * @param {number[][][]} grid
 * @param {number} value
 */
function fillGrid(grid, value) {
	grid.forEach(z => z.forEach(y => y.fill(value)));
}

export class PathFinding {
	/** @type {Pos3D} */
	#start;
	/** @type {Pos3D} */
	#end;
	/** @type {Pos3D[]} */
	#walls;
	/** @type {Pos3D[]} */
	#path = [];
	/** @type {number[][][]} */
	grid;
	#forceReloadCounter = 0;

	constructor() { }

	/**
	 * @param {Pos3D} start
	 * @param {Pos3D} end
	 * @param {Pos3D[]} walls
	 */
	setParams(start, end, walls) {
		this.#start = start;
		if (!this.#end || !end?.equals(this.#end)) {
			this.reset();
		}
		this.#end = end;
		this.#walls = walls;
	}

	reset() {
		this.#path = [];
		this.#forceReloadCounter = 0;
	}

	/** @param {Pos3D} pos */
	isInGrid(pos) {
		return pos.x >= 0 && pos.x < XLENGTH && pos.y >= 0 && pos.y < YLENGTH && pos.z >= 0 && pos.z < ZLENGTH;
	}

	/** @param {Pos3D} pos */
	isWall(pos) {
		return this.#walls.some(wall => wall.equals(pos));
	}

	/**
	 * @param {Pos3D} pos
	 */
	getNeighbors(pos) {
		const neighbors = [];
		if (pos.x > 0) neighbors.push(new Pos3D(pos.x - 1, pos.y, pos.z));
		if (pos.x < XLENGTH - 1) neighbors.push(new Pos3D(pos.x + 1, pos.y, pos.z));
		if (pos.y > 0) neighbors.push(new Pos3D(pos.x, pos.y - 1, pos.z));
		if (pos.y < YLENGTH - 1) neighbors.push(new Pos3D(pos.x, pos.y + 1, pos.z));
		if (pos.z > 0) neighbors.push(new Pos3D(pos.x, pos.y, pos.z - 1));
		if (pos.z < ZLENGTH - 1) neighbors.push(new Pos3D(pos.x, pos.y, pos.z + 1));
		return neighbors;
	}

	/**
	 * @param {Pos3D} pos
	 * @param {number} value
	 */
	propagateIncreaseValue(pos, value) {
		const currentValue = this.grid[pos.z][pos.y][pos.x];
		if (currentValue != -1 && currentValue <= value) return;

		this.grid[pos.z][pos.y][pos.x] = value;

		const neighbors = this.getNeighbors(pos);
		for (const neighbor of neighbors) {
			if (this.isWall(neighbor))
				continue;
			this.propagateIncreaseValue(neighbor, value + 1);
		}
	}

	/**
	 * Version 1 : se déplacer en x, puis en y, puis en z sans regarder les murs
	 * note : fonctionne ok en 2D, se bloque assez rapidement
	 */
	calcPathNoBrain() {
		this.#path = [];
		let pos = this.#start.clone();
		const delta = this.#end.toVector3D().sub(this.#start);
		const direction = delta.clone();
		direction.x = Math.sign(direction.x);
		direction.y = Math.sign(direction.y);
		direction.z = Math.sign(direction.z);
		for (; pos.x != this.#end.x; pos.x += direction.x) {
			this.#path.push(pos.clone());
		}
		for (; pos.y != this.#end.y; pos.y += direction.y) {
			this.#path.push(pos.clone());
		}
		for (; pos.z != this.#end.z; pos.z += direction.z) {
			this.#path.push(pos.clone());
		}
		this.#path.push(pos.clone());
	}

	/**
	 * Version 2 :
	 * Dessiner une grille de taille XLENGTH*YLENGTH*ZLENGTH
	 * Commencer par la case d'arrivée (end) à la valeur 0
	 * Pour chaque case adjacente, si ce n'est pas un mur, donner la valeur de la case actuelle + 1
	 * Si la case adjacente a déjà une valeur, prendre la plus petite
	 * Recommencer pour remplir toutes les cases accessibles (qui ne sont pas derrière un mur)
	 * Par défaut, toutes les cases ont la valeur -1
	 * Une case à la valeur -1 n'est pas accessible
	 * @param {number} forceReload Trop faible, le path sera calculé très souvent, trop élevé, on peut passer à côté d'un chemin plus court (murt a changé)
	 */
	calcPathDistanceFromEnd(forceReload = 10) {
		this.#forceReloadCounter++;
		if (this.#path.length > 0 && this.#forceReloadCounter < forceReload) {
			// remove the elements in the path until the start
			while (this.#path.length > 0 && !this.#path[0].equals(this.#start)) {
				this.#path.shift();
			}
			if (this.#path.length > 0) {
				return;
			}
		}
		this.#forceReloadCounter = 0;


		if (!this.grid) {
			this.grid = createGrid(-1);
		}
		else {
			fillGrid(this.grid, -1);
		}

		// We could calculate only the cells that changed, but this takes only 20 ms
		this.propagateIncreaseValue(this.#end, 0);

		// à partir de la case de départ, chercher la case adjacente avec la plus petite valeur

		this.#path = [];
		let pos = this.#start;
		do {
			this.#path.push(pos);

			let neighbors = this.getNeighbors(pos)
				.map(pos => ({ pos, value: this.grid[pos.z][pos.y][pos.x] }))
				.filter(n => n.value !== -1).sort((a, b) => a.value - b.value);
			pos = neighbors[0]?.pos;
		} while (pos && !pos.equals(this.#end));

		if (pos) {
			// pos == end
			this.#path.push(pos);
		}
		else {
			// pas de chemin
			this.#path = [];
		}
	}

	calcPath() {
		this.calcPathDistanceFromEnd();
	}

	getNextPos() {
		return this.#path[1];
	}

	getNextDirection() {
		return this.getNextPos()?.toVector3D().sub(this.#start);
	}

	/**
	 * Check if the path is valid (pos[i+1] is next to pos[i])
	 */
	isPathValid() {
		if (this.#path.length == 0) return false; // pas de chemin
		for (let i = 0; i < this.#path.length - 1; i++) {
			const dx = Math.abs(this.#path[i].x - this.#path[i + 1].x);
			const dy = Math.abs(this.#path[i].y - this.#path[i + 1].y);
			const dz = Math.abs(this.#path[i].z - this.#path[i + 1].z);
			if (dx + dy + dz != 1) return false; // pas à côté
		}
		return true;
	}

	/**
	 * Check if the path can be used
	 * Doesn't check if the path is correct (pos[i+1] is next to pos[i])
	 */
	isPathGood() {
		if (this.#path.length == 0) return false; // pas de chemin
		if (!this.#path[this.#path.length - 1].equals(this.#end)) return false; // n'arrive pas à la fin
		if (!this.#path[0].equals(this.#start)) return false; // ne commence pas à côté de start
		if (this.#path.some((pos) => this.#walls.some((wall) => wall.equals(pos)))) return false; // passe par un mur
		if (this.#path.some((pos, i) => i > 0 && this.#path.slice(0, i).some((pos2) => pos2.equals(pos)))) return false; // se croise
		return true;
	}
}