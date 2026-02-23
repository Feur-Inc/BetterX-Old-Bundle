import { Database } from "bun:sqlite";
import path from "node:path";

const DB_PATH = process.env.DATABASE_URL || path.join(process.cwd(), "betterx.db");
const db = new Database(DB_PATH);

// Initialize schema
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    twitter_id TEXT UNIQUE,
    username TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS configs (
    user_id TEXT PRIMARY KEY,
    plugin_states TEXT,
    theme_state TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

export { db };
