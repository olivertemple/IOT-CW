
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const mqtt = require('mqtt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3002;
const TOPIC_PATTERN = 'taps/+/+';

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for local dev convenience
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// CORS middleware above will handle preflight requests
app.use(express.json());

// --- Database Setup ---
const dbPath = path.resolve(__dirname, 'smarttap.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Error opening database:', err.message);
  else console.log('Connected to SQLite database.');
});

db.serialize(() => {
  // Table: Tap Configurations (Persistent State)
  db.run(`CREATE TABLE IF NOT EXISTS taps (
    id TEXT PRIMARY KEY,
    name TEXT,
    beer_name TEXT,
    beer_type TEXT,
    keg_size_liters REAL,
    price_per_pint REAL,
    cost_per_keg REAL,
    spare_kegs INTEGER,
    state TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Table: IoT Events (Historical Data)
  db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tap_id TEXT,
    device_type TEXT, -- 'flow', 'keg', 'valve'
    payload TEXT,     -- JSON string
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Table: Daily Aggregates (Speed up analytics)
  db.run(`CREATE TABLE IF NOT EXISTS daily_stats (
    date TEXT,
    tap_id TEXT,
    total_poured REAL,
    PRIMARY KEY (date, tap_id)
  )`);

  // Migration: ensure `state` column exists on older DBs
  db.all("PRAGMA table_info('taps')", [], (err, cols) => {
    if (err) return console.error('Failed to read taps schema:', err.message);
    const hasState = Array.isArray(cols) && cols.some(c => c.name === 'state');
    if (!hasState) {
      console.log('Migrating DB: adding `state` column to taps');
      db.run('ALTER TABLE taps ADD COLUMN state TEXT', (err2) => {
        if (err2) console.error('Failed to add state column:', err2.message);
        else console.log('Migration complete: `state` column added');
      });
    }
  });
});

// --- MQTT Logger ---
// Note: This will try to connect to Mosquitto. Use environment variables
// to override the broker host/port when running in Docker compose.
const MQTT_HOST = process.env.MQTT_HOST || 'localhost';
const MQTT_PORT = process.env.MQTT_PORT || '1883';
const MQTT_BROKER = process.env.MQTT_BROKER || `mqtt://${MQTT_HOST}:${MQTT_PORT}`;

console.log('Connecting backend MQTT to', MQTT_BROKER);
const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
  console.log('Backend Logger connected to MQTT Broker');
  mqttClient.subscribe(TOPIC_PATTERN);
});

mqttClient.on('error', (err) => {
  console.warn('MQTT Backend Connection Error (Is Mosquitto running?):', err.message);
});

mqttClient.on('message', (topic, message) => {
  const parts = topic.split('/');
  if (parts.length < 3) return;
  
  const tapId = parts[1];
  const deviceType = parts[2];
  const payloadStr = message.toString();

  // 1. Log Raw Event
  const stmt = db.prepare('INSERT INTO events (tap_id, device_type, payload) VALUES (?, ?, ?)');
  stmt.run(tapId, deviceType, payloadStr);
  stmt.finalize();

  // 2. Persist latest runtime state for this tap so UI can recover after restart
  // Attempt to parse the payload and merge into existing `state` JSON column on taps.
  let parsed = null;
  try { parsed = JSON.parse(payloadStr); } catch (e) { parsed = null; }

  // Read existing state and merge
  db.get('SELECT state FROM taps WHERE id = ?', [tapId], (err, row) => {
    if (err) return; // ignore persistence failure

    let existing = {};
    if (row && row.state) {
      try { existing = JSON.parse(row.state); } catch (e) { existing = {}; }
    }

    // Merge strategy: shallow merge of parsed payload (if JSON) into existing state.
    // This keeps a record of the last known runtime fields (e.g., currentLevelLiters, totalPoured, keg weight, temps).
      // Normalize some common keys from device payloads to friendly runtime names
      const normalised = Object.assign({}, parsed || {});
      if (normalised.weight !== undefined && normalised.kegWeightCurrent === undefined) {
        normalised.kegWeightCurrent = normalised.weight;
      }
      if (normalised.temp !== undefined && normalised.temperature === undefined) {
        normalised.temperature = normalised.temp;
      }
      if (normalised.cellarTemp !== undefined && normalised.cellarTemp === undefined) {
        normalised.cellarTemp = normalised.cellarTemp;
      }

      const merged = Object.assign({}, existing, normalised || {});

    // Ensure there's at least an entry in taps for this id. If no taps row exists, create a minimal one.
    db.get('SELECT id FROM taps WHERE id = ?', [tapId], (err2, existsRow) => {
      if (err2) return;
      if (!existsRow) {
          const insert = db.prepare('INSERT INTO taps (id, name, beer_name, beer_type, keg_size_liters, price_per_pint, cost_per_keg, spare_kegs, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
          insert.run(tapId, tapId, '', '', 0, 0, 0, 0, JSON.stringify(merged), (err) => {
            if (err) console.error('Failed to create tap row for MQTT event:', err.message);
          });
          insert.finalize();
        } else {
          db.run('UPDATE taps SET state = ? WHERE id = ?', [JSON.stringify(merged), tapId], (err) => {
            if (err) {
              console.error('Failed to update tap state from MQTT:', err.message);
            } else {
              console.log(`Updated taps.state for ${tapId}:`, Object.keys(merged).join(','));
            }
          });
        }
    });
  });
});

// --- API Routes ---

// Get all configured Taps
app.get('/api/taps', (req, res) => {
  console.log(`GET /api/taps from ${req.ip}`);
  db.all('SELECT * FROM taps', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`Returning ${rows.length} taps from DB`);
    
    // Transform snake_case to camelCase for frontend
    const taps = rows.map(row => {
      let state = {};
      if (row.state) {
        try { state = JSON.parse(row.state); } catch (e) { state = {}; }
      }
        // If only a keg weight was persisted, derive currentLevelLiters from weight
        const BEER_DENSITY = 1.03; // kg per liter
        const kegWeightCurrent = state.kegWeightCurrent !== undefined ? state.kegWeightCurrent : (state.weight !== undefined ? state.weight : null);
        const kegWeightEmpty = state.kegWeightEmpty !== undefined ? state.kegWeightEmpty : 13.5;

        let derivedLevel = null;
        if (kegWeightCurrent !== null) {
          const net = Math.max(0, kegWeightCurrent - kegWeightEmpty);
          derivedLevel = Number((net / BEER_DENSITY).toFixed(1));
        }

        return {
          id: row.id,
          name: row.name,
          beerName: row.beer_name,
          beerType: row.beer_type,
          kegSizeLiters: row.keg_size_liters,
          pricePerPint: row.price_per_pint,
          costPerKeg: row.cost_per_keg,
          spareKegs: state.spareKegs !== undefined ? state.spareKegs : row.spare_kegs,
          // Operational values: prefer persisted runtime `state`, fall back to defaults
          currentLevelLiters: state.currentLevelLiters !== undefined ? state.currentLevelLiters : (derivedLevel !== null ? derivedLevel : row.keg_size_liters),
          totalConsumedLiters: state.totalConsumedLiters !== undefined ? state.totalConsumedLiters : 0,
          temperature: state.temperature !== undefined ? state.temperature : 4.0,
          isFlowing: state.isFlowing !== undefined ? state.isFlowing : false,
          lastKegSwap: state.lastKegSwap !== undefined ? state.lastKegSwap : row.created_at,
          status: state.status !== undefined ? state.status : 'active',
          kegWeightCurrent: kegWeightCurrent !== null ? kegWeightCurrent : 0,
          kegWeightEmpty: kegWeightEmpty,
          cellarTemp: state.cellarTemp !== undefined ? state.cellarTemp : 11.0
        };
    });
    res.json(taps);
  });
});

// Health endpoint for quick checks
app.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Delete a tap
app.delete('/api/taps/:id', (req, res) => {
  const id = req.params.id;
  console.log('DELETE /api/taps/' + id);
  db.run('DELETE FROM taps WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Failed to delete tap:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, deleted: this.changes });
  });
});

// Register a new Tap
app.post('/api/taps', (req, res) => {
  const { id, name, beerName, beerType, kegSizeLiters, pricePerPint, costPerKeg, spareKegs } = req.body;

  console.log('POST /api/taps', { id, name });
  // Read existing state (if any) so we preserve runtime state when replacing the row.
  db.get('SELECT state FROM taps WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Failed to read existing tap state:', err.message);
      return res.status(500).json({ error: err.message });
    }

    const existingState = row && row.state ? row.state : null;

    const stmt = db.prepare(`INSERT OR REPLACE INTO taps 
      (id, name, beer_name, beer_type, keg_size_liters, price_per_pint, cost_per_keg, spare_kegs, state) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    stmt.run(id, name, beerName, beerType, kegSizeLiters, pricePerPint, costPerKeg, spareKegs, existingState, function(err2) {
      if (err2) {
        console.error('Failed to save tap:', err2.message);
        return res.status(500).json({ error: err2.message });
      }
      console.log('Saved tap:', id);
      res.json({ success: true, id: id });
    });
    stmt.finalize();
  });
});

// Get History for Analytics
app.get('/api/history', (req, res) => {
  const { period } = req.query; // 'day', 'week', 'month'
  
  let timeFilter = "'-1 day'";
  let groupBy = "strftime('%H:00', recorded_at)"; // Default hourly for day
  
  if (period === 'week') {
    timeFilter = "'-7 days'";
    groupBy = "date(recorded_at)";
  } else if (period === 'month') {
    timeFilter = "'-30 days'";
    groupBy = "date(recorded_at)";
  } else if (period === 'year') {
    timeFilter = "'-1 year'";
    groupBy = "strftime('%Y-%m', recorded_at)";
  }

  const query = `
    SELECT 
      ${groupBy} as time, 
      COUNT(*) as usage_count 
    FROM events 
    WHERE 
      recorded_at > datetime('now', ${timeFilter}) 
      AND device_type = 'flow'
    GROUP BY time
    ORDER BY time ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Map rows to Recharts format
    const formatted = rows.map(r => ({
      time: r.time,
      usage: r.usage_count
    }));
    
    res.json(formatted);
  });
});

const server = app.listen(PORT, () => {
  console.log(`SmartTap Backend running on http://localhost:${PORT}`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`Error: Port ${PORT} is already in use.`);
    } else {
        console.error("Server startup error:", e);
    }
});
