
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Allow overriding DB file path via environment for Docker persistence
const dbPath = process.env.DB_FILE ? path.resolve(process.env.DB_FILE) : path.resolve(__dirname, 'smartbar.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Configuration Settings
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`, (err) => {
        if (err) console.error("Error creating settings table:", err.message);
    });

    // Set default broker if not exists
    db.get("SELECT value FROM settings WHERE key = 'mqtt_broker'", (err, row) => {
        if(!row) {
            db.run("INSERT INTO settings (key, value) VALUES ('mqtt_broker', 'mqtt://test.mosquitto.org')");
        }
    });

    // History of Pours
    db.run(`CREATE TABLE IF NOT EXISTS pour_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER,
      keg_id TEXT,
      beer_name TEXT,
      volume_ml INTEGER,
      duration_sec REAL
    )`);

    // Inventory / Keg Status
    db.run(`CREATE TABLE IF NOT EXISTS inventory (
      keg_id TEXT PRIMARY KEY,
      beer_name TEXT,
      volume_total_ml INTEGER,
      volume_remaining_ml INTEGER,
      status TEXT, -- ACTIVE, STANDBY, EMPTY
      last_updated INTEGER
    )`);

    // Orders
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER,
      keg_id TEXT,
      beer_name TEXT,
      status TEXT -- PENDING, ORDERED, DELIVERED
    )`);
  });
}

module.exports = {
  db,
  getSetting: (key, callback) => {
    db.get("SELECT value FROM settings WHERE key = ?", [key], (err, row) => {
        if (err) {
            console.error(`Error getting setting ${key}:`, err.message);
            callback(null);
        } else {
            callback(row ? row.value : null);
        }
    });
  },
  saveSetting: (key, value) => {
    // Use REPLACE INTO for broader SQLite compatibility compared to ON CONFLICT
    db.run("REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value], (err) => {
        if (err) console.error("Error saving setting:", err.message);
    });
  },
  logPour: (kegId, beerName, volume, duration) => {
    db.run(
      `INSERT INTO pour_history (timestamp, keg_id, beer_name, volume_ml, duration_sec) VALUES (?, ?, ?, ?, ?)`,
      [Date.now(), kegId, beerName, volume, duration],
      (err) => { if (err) console.error(err.message); }
    );
  },
  updateKeg: (kegId, beerName, total, remaining, status) => {
    db.run(
      `REPLACE INTO inventory (keg_id, beer_name, volume_total_ml, volume_remaining_ml, status, last_updated) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [kegId, beerName, total, remaining, status, Date.now()],
      (err) => { if (err) console.error("Error updating keg:", err.message); }
    );
  },
  createOrder: (kegId, beerName) => {
    db.get(`SELECT id FROM orders WHERE keg_id = ? AND status = 'PENDING'`, [kegId], (err, row) => {
        if (!row) {
            db.run(`INSERT INTO orders (timestamp, keg_id, beer_name, status) VALUES (?, ?, ?, 'PENDING')`,
            [Date.now(), kegId, beerName]);
            console.log(`[DB] Created auto-order for ${beerName} (${kegId})`);
        }
    });
  },
  getHistory: (callback) => {
    db.all(`SELECT * FROM pour_history ORDER BY timestamp DESC LIMIT 50`, [], (err, rows) => callback(rows || []));
  },
  getInventory: (callback) => {
    db.all(`SELECT * FROM inventory`, [], (err, rows) => callback(rows || []));
  },
  getOrders: (callback) => {
      db.all(`SELECT * FROM orders ORDER BY timestamp DESC`, [], (err, rows) => callback(rows || []));
  }
};
