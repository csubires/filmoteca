import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/filmoteca.db');

let db = null;

export async function initializeDatabase() {
	return new Promise((resolve, reject) => {
		db = new sqlite3.Database(DB_PATH, (err) => {
			if (err) {
				console.error('Error opening database:', err);
				reject(err);
			} else {
				console.log('Connected to database:', DB_PATH);
				resolve(db);
			}
		});
	});
}

export function getDatabase() {
	if (!db) {
		throw new Error('Database not initialized. Call initializeDatabase first.');
	}
	return db;
}

export async function runAsync(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.run(sql, params, function(err) {
			if (err) {
				reject(err);
			} else {
				resolve(this);
			}
		});
	});
}

export async function getAsync(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.get(sql, params, (err, row) => {
			if (err) {
				reject(err);
			} else {
				resolve(row);
			}
		});
	});
}

export async function allAsync(sql, params = []) {
	return new Promise((resolve, reject) => {
		db.all(sql, params, (err, rows) => {
			if (err) {
				reject(err);
			} else {
				resolve(rows);
			}
		});
	});
}

export async function closeDatabase() {
	return new Promise((resolve, reject) => {
		if (db) {
			db.close((err) => {
				if (err) {
					reject(err);
				} else {
					console.log('Database connection closed');
					resolve();
				}
			});
		} else {
			resolve();
		}
	});
}
