
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`, (err) => {
        if (err) console.error("Error creating settings table:", err.message);
    });

    db.get("SELECT value FROM settings WHERE key = 'mqtt_broker'", (err, row) => {
        if(!row) {
            db.run("INSERT INTO settings (key, value) VALUES ('mqtt_broker', 'mqtt://test.mosquitto.org')");
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS pour_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER,
      keg_id TEXT,
      beer_name TEXT,
      volume_ml INTEGER,
      duration_sec REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS inventory (
      keg_id TEXT,
      beer_name TEXT,
      volume_total_ml INTEGER,
      volume_remaining_ml INTEGER,
      status TEXT,
      tap_id TEXT,
      last_updated INTEGER,
      PRIMARY KEY (tap_id, keg_id)
    )`);
    
    db.all(`PRAGMA table_info(inventory)`, [], (err, columns) => {
      if (!err && columns && columns.length > 0) {
        db.all(`PRAGMA index_list(inventory)`, [], (idxErr, indexes) => {
          if (!idxErr) {
            const hasTapId = columns.some(col => col.name === 'tap_id');
            const kegIdCol = columns.find(col => col.name === 'keg_id');
            
            if (kegIdCol && kegIdCol.pk === 1 && hasTapId) {
              console.log('[DB] Migrating inventory table to composite primary key...');
              db.serialize(() => {
                db.run(`CREATE TABLE inventory_backup AS SELECT * FROM inventory`);
                db.run(`DROP TABLE inventory`);
                db.run(`CREATE TABLE inventory (
                  keg_id TEXT,
                  beer_name TEXT,
                  volume_total_ml INTEGER,
                  volume_remaining_ml INTEGER,
                  status TEXT,
                  tap_id TEXT,
                  last_updated INTEGER,
                  PRIMARY KEY (tap_id, keg_id)
                )`);
                db.run(`INSERT OR IGNORE INTO inventory SELECT * FROM inventory_backup WHERE tap_id IS NOT NULL`);
                db.run(`DROP TABLE inventory_backup`);
                console.log('[DB] Inventory table migration complete');
              });
            }
          }
        });
      }
    });
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER,
      keg_id TEXT,
      beer_name TEXT,
      status TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS telemetry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER,
      keg_id TEXT,
      vol_remaining_ml INTEGER,
      flow_lpm REAL,
      temp_beer_c REAL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS usage_hourly (
      bucket_ts INTEGER,
      beer_name TEXT,
      volume_ml INTEGER,
      PRIMARY KEY (bucket_ts, beer_name)
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
  updateKeg: (kegId, beerName, total, remaining, status, tapId = null) => {
    db.run(
      `REPLACE INTO inventory (keg_id, beer_name, volume_total_ml, volume_remaining_ml, status, tap_id, last_updated) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [kegId, beerName, total, remaining, status, tapId, Date.now()],
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
    db.all(`SELECT * FROM inventory ORDER BY beer_name, keg_id`, [], (err, rows) => callback(rows || []));
  },
  deleteKegsByTap: (tapId, callback) => {
    db.run(`DELETE FROM inventory WHERE tap_id = ?`, [tapId], (err) => {
      if (err) {
        console.error('[DB] Error deleting kegs for tap:', err.message);
        callback && callback(err);
      } else {
        console.log(`[DB] Deleted kegs for tap ${tapId}`);
        callback && callback(null);
      }
    });
  },
  getOrders: (callback) => {
      db.all(`SELECT * FROM orders ORDER BY timestamp DESC`, [], (err, rows) => callback(rows || []));
  }
};

module.exports.logTelemetry = (kegId, volRemaining, flowLpm, tempBeerC, ts = Date.now()) => {
  db.run(
    `INSERT INTO telemetry (timestamp, keg_id, vol_remaining_ml, flow_lpm, temp_beer_c) VALUES (?, ?, ?, ?, ?)`,
    [ts, kegId, volRemaining, flowLpm, tempBeerC],
    (err) => { if (err) console.error('[DB] logTelemetry error:', err.message); }
  );
};

module.exports.addUsageHour = (bucketTs, beerName, volumeMl) => {
  if (!volumeMl || volumeMl <= 0) return;
  db.run(
    `INSERT INTO usage_hourly (bucket_ts, beer_name, volume_ml) VALUES (?, ?, ?)
     ON CONFLICT(bucket_ts, beer_name) DO UPDATE SET volume_ml = volume_ml + excluded.volume_ml`,
    [bucketTs, beerName, volumeMl],
    (err) => { if (err) console.error('[DB] addUsageHour error:', err.message); }
  );
};

module.exports.getUsageRange = (beerName, startTs, endTs, callback) => {
  db.all(
    `SELECT bucket_ts, volume_ml FROM usage_hourly WHERE beer_name = ? AND bucket_ts BETWEEN ? AND ? ORDER BY bucket_ts`,
    [beerName, startTs, endTs],
    (err, rows) => callback(rows || [])
  );
};

module.exports.calculateEfficiency = (callback) => {
  const oneDayAgo = Date.now() - 24 * 3600000;
  db.all(
    `SELECT vol_remaining_ml, flow_lpm, timestamp FROM telemetry WHERE timestamp > ? ORDER BY timestamp`,
    [oneDayAgo],
    (err, rows) => {
      if (err || !rows || rows.length < 2) {
        callback(null);
        return;
      }
      
      let totalFlowVolume = 0;
      let totalActualVolume = 0;
      
      for (let i = 1; i < rows.length; i++) {
        const prev = rows[i - 1];
        const curr = rows[i];
        const timeDeltaSec = (curr.timestamp - prev.timestamp) / 1000;
        const volumeDelta = Math.max(0, prev.vol_remaining_ml - curr.vol_remaining_ml);
        
        const flowBasedVolume = (prev.flow_lpm * timeDeltaSec * 1000) / 60;
        
        totalFlowVolume += flowBasedVolume;
        totalActualVolume += volumeDelta;
      }
      
      if (totalFlowVolume === 0) {
        callback(null);
        return;
      }
      
      const efficiency = Math.min(100, (totalActualVolume / totalFlowVolume) * 100);
      callback(isNaN(efficiency) ? null : efficiency);
    }
  );
};

module.exports.estimateDepletion = (kegId, currentVolumeMl, callback) => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600000;
  
  db.get(
    `SELECT beer_name FROM inventory WHERE keg_id = ?`,
    [kegId],
    (err, row) => {
      if (err || !row) {
        callback(null);
        return;
      }
      
      const beerName = row.beer_name;
      
      db.all(
        `SELECT SUM(volume_ml) as total_volume FROM usage_hourly WHERE beer_name = ? AND bucket_ts > ?`,
        [beerName, sevenDaysAgo],
        (err, rows) => {
          if (err || !rows || rows.length === 0 || !rows[0].total_volume) {
            callback(null);
            return;
          }
          
          const totalVolume = rows[0].total_volume;
          const avgDailyConsumption = totalVolume / 7;
          
          if (avgDailyConsumption <= 0 || currentVolumeMl <= 0) {
            callback(null);
            return;
          }
          
          const daysRemaining = currentVolumeMl / avgDailyConsumption;
          callback(daysRemaining);
        }
      );
    }
  );
};
