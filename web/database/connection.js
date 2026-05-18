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
		// Log query execution
		console.log(`\n[DB] Query: ${tagSQL}`);
		console.log(`[DB] SQL: ${sql}`);
		console.log(`[DB] Params:`, params);
		const startTime = Date.now();
		return new Promise((resolve, reject) => {
			const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
			if (isSelect) {
				this.db.all(sql, params, (err, rows) => {
					const duration = Date.now() - startTime;
					if (err) {
						console.error(`[DB] ❌ Query failed (${duration}ms):`, err.message);
					} else {
						console.log(`[DB] ✅ Query success (${duration}ms) - ${rows?.length || 0} rows`);
					}
					if (err) reject(err);
					else {
						this.lastAffected = rows ? rows.length : 0;
						resolve(rows || []);
					}
				});
			} else {
				this.db.run(sql, params, (err) => {
					const duration = Date.now() - startTime;
					if (err) {
						console.error(`[DB] ❌ Query failed (${duration}ms):`, err.message);
						reject(err);
					} else {
						console.log(`[DB] ✅ Query success (${duration}ms) - ${this.db.changes} rows affected`);
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
