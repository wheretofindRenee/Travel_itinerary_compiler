const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// 云环境(Render)用 /tmp 作为可写目录，本地用项目内
const DB_DIR = process.env.RENDER ? os.tmpdir() : path.join(__dirname);
const DB_PATH = path.join(DB_DIR, 'itinerary.db');

let db;

function initDB() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS itineraries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE,
      data TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_token ON itineraries(token);
  `);
}

function getDB() {
  return db;
}

module.exports = { initDB, getDB };
