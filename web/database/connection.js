import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs/promises';

class HandlerSQL {
	constructor(dbPath, tagQuery) {
		this.dbPath = dbPath;
		this.tag_query = tagQuery || {};
		this.db = null;
		this.lastAffected = 0;
	}

	async connect() {
		return new Promise((resolve, reject) => {
			const dbDir = path.dirname(this.dbPath);
			fs.mkdir(dbDir, { recursive: true }).catch(() => {});

			this.db = new sqlite3.Database(this.dbPath, (err) => {
				if (err) {
					reject(err);
				} else {
					this.db.run('PRAGMA foreign_keys = ON');
					resolve(this);
				}
			});
		});
	}

	async close() {
		return new Promise((resolve, reject) => {
			if (this.db) {
				this.db.close((err) => {
					if (err) reject(err);
					else resolve();
				});
			} else {
				resolve();
			}
		});
	}

	async execute(tagSQL, params = {}) {
		const sql = this.tag_query[tagSQL];
		if (!sql) {
			throw new Error(`Query tag "${tagSQL}" not found`);
		}
		return new Promise((resolve, reject) => {
			const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
			if (isSelect) {
				this.db.all(sql, params, (err, rows) => {
					if (err) reject(err);
					else {
						this.lastAffected = rows ? rows.length : 0;
						resolve(rows || []);
					}
				});
			} else {
				this.db.run(sql, params, (err) => {
					if (err) {
						reject(err);
					} else {
						this.lastAffected = this.db.changes;
						resolve({
							changes: this.db.changes,
							lastID: this.db.lastID
						});
					}
				});
			}
		});
	}

	affected() {
		return this.lastAffected;
	}
}

function createHandlerSQL(dbPath, tagQuery) {
	return new HandlerSQL(dbPath, tagQuery);
}

export { createHandlerSQL, HandlerSQL };
