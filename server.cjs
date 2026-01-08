
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const cors = require('cors');
const db = require('./database.cjs');

const app = express();
app.use(cors());
app.use(express.json()); // Support JSON bodies

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow local frontend dev
    methods: ["GET", "POST"]
  }
});

let mqttClient = null;

// Keep last-known telemetry per keg for delta calculations
const lastTelemetry = {}; // kegId -> { vol_remaining_ml, ts, beer_name }

// Multi-tap support: track state per tap system
const tapStates = {}; // tapId -> { tap: {...}, activeKeg: {...} }

// --- MQTT Logic ---
function connectMqtt(brokerUrl) {
    if (mqttClient) {
        console.log('[MQTT] Disconnecting previous client...');
        mqttClient.end();
    }

    console.log(`[MQTT] Connecting to ${brokerUrl}...`);
    mqttClient = mqtt.connect(brokerUrl);

    mqttClient.on('connect', () => {
      console.log('[MQTT] Connected to broker');
      // Subscribe to ALL tap systems using wildcards
      mqttClient.subscribe('+/ui/display');
      mqttClient.subscribe('+/keg/+/status');
      mqttClient.subscribe('+/keg/+/event');
      console.log('[MQTT] Subscribed to all tap systems (+/ui/display, +/keg/+/status, +/keg/+/event)');
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const topicParts = topic.split('/');
        
        // 1. Tap Display Updates (tapId/ui/display)
        if (topic.includes('/ui/display')) {
            const tapId = topicParts[0];
            if (!tapStates[tapId]) {
              tapStates[tapId] = {
                tap: { view: 'OFFLINE', beer: 'N/A', pct: 0, alert: null, beer_name: 'Unknown' },
                activeKeg: { id: '---', flow: 0, temp: 0, state: 'IDLE' }
              };
            }
            tapStates[tapId].tap = payload;
            io.emit('tap_update', { tapId, ...payload });
        }

        // 2. Keg Telemetry (tapId/keg/kegId/status)
        else if (topic.includes('/status')) {
            const tapId = topicParts[0];
            const kegId = topicParts[2];
            
            // Auto-register tap if not exists
            if (!tapStates[tapId]) {
              tapStates[tapId] = {
                tap: { view: 'OFFLINE', beer: 'N/A', pct: 0, alert: null, beer_name: payload.beer_name || 'Unknown' },
                activeKeg: { id: '---', flow: 0, temp: 0, state: 'IDLE' }
              };
              console.log(`[MQTT] Auto-registered new tap system: ${tapId}`);
            }
            
            // Get beer name from payload or use previous value
            const beerName = payload.beer_name || lastTelemetry[kegId]?.beer_name || "Unknown Beer";
            
            // Persist to DB
            db.updateKeg(kegId, beerName, payload.vol_total_ml || 20000, payload.vol_remaining_ml, payload.state);

            // Log telemetry snapshot for time-series analysis
            try {
              db.logTelemetry(kegId, payload.vol_remaining_ml, payload.flow_lpm, payload.temp_beer_c, Date.now());
            } catch (e) { console.error('[SERVER] logTelemetry error', e); }

            // Compute volume delta (only when volume decreased) and roll up into hourly bucket
            const last = lastTelemetry[kegId];
            if (last && typeof last.vol_remaining_ml === 'number' && payload.vol_remaining_ml < last.vol_remaining_ml) {
              const delta = Math.max(0, last.vol_remaining_ml - payload.vol_remaining_ml);
              const bucket = Math.floor(Date.now() / 3600000) * 3600000; // hour start in ms
              db.addUsageHour(bucket, beerName, delta);
            }
            lastTelemetry[kegId] = { vol_remaining_ml: payload.vol_remaining_ml, ts: Date.now(), beer_name: beerName };

            // Update Live State if it's the active pumping keg
            if (payload.state === 'PUMPING') {
                tapStates[tapId].activeKeg = {
                    id: kegId,
                    flow: payload.flow_lpm,
                    temp: payload.temp_beer_c,
                    state: payload.state
                };
                io.emit('keg_update', { tapId, ...tapStates[tapId].activeKeg });
            } else if (tapStates[tapId].activeKeg.id === kegId && payload.state === 'IDLE') {
                tapStates[tapId].activeKeg.state = 'IDLE';
                tapStates[tapId].activeKeg.flow = 0;
                io.emit('keg_update', { tapId, ...tapStates[tapId].activeKeg });
                
                // Logic: If idle and < 10% remaining, trigger auto-order
                if (payload.vol_remaining_ml < 2000) {
                    db.createOrder(kegId, beerName);
                    io.emit('order_created', { kegId, beer: beerName, tapId });
                }
            }
        }
        
        // 3. Critical Events (tapId/keg/kegId/event)
        else if (topic.includes('/event')) {
            const tapId = topicParts[0];
            const kegId = topicParts[2];
            const beerName = lastTelemetry[kegId]?.beer_name || "Unknown Beer";
            
            if (payload.event === 'EMPTY_DETECTED') {
                 db.updateKeg(kegId, beerName, 20000, 0, "EMPTY");
                 io.emit('alert', { type: 'error', msg: `Keg ${kegId} on ${tapId} Empty! Swapping...` });
            }
        }

      } catch (e) {
        console.error('Parse Error:', e);
      }
    });

    mqttClient.on('error', (err) => {
        console.error('[MQTT] Error:', err.message);
    });
}

// Initialize MQTT from DB settings
db.getSetting('mqtt_broker', (url) => {
    const broker = url || 'mqtt://test.mosquitto.org';
    connectMqtt(broker);
});

// --- API Routes ---
app.get('/api/config', (req, res) => {
    db.getSetting('mqtt_broker', (url) => {
        res.json({ mqtt_broker: url || 'mqtt://test.mosquitto.org' });
    });
});

// List all detected tap systems
app.get('/api/taps', (req, res) => {
  const taps = Object.keys(tapStates).map(tapId => ({
    tapId,
    tap: tapStates[tapId].tap,
    activeKeg: tapStates[tapId].activeKeg
  }));
  res.json({ taps });
});

// Usage time-series endpoint (hourly aggregated)
// Query params: ?beer=Hazy%20IPA&from=1610000000000&to=1610003600000
app.get('/api/usage', (req, res) => {
  const beer = req.query.beer || 'Hazy IPA';
  const to = parseInt(req.query.to, 10) || Date.now();
  const from = parseInt(req.query.from, 10) || (Date.now() - 24 * 3600000);

  db.getUsageRange(beer, from, to, (rows) => {
    // Normalize response to include zeros for empty buckets
    // Build a map of bucket_ts -> volume
    const map = new Map();
    rows.forEach(r => map.set(r.bucket_ts, r.volume_ml));

    // compute hourly buckets from from -> to (align to hour)
    const startBucket = Math.floor(from / 3600000) * 3600000;
    const endBucket = Math.floor(to / 3600000) * 3600000;
    const out = [];
    for (let b = startBucket; b <= endBucket; b += 3600000) {
      out.push({ bucket_ts: b, volume_ml: map.get(b) || 0 });
    }
    res.json({ beer: beer, buckets: out });
  });
});

app.post('/api/config', (req, res) => {
    const { mqtt_broker } = req.body;
    if (mqtt_broker) {
        db.saveSetting('mqtt_broker', mqtt_broker);
        connectMqtt(mqtt_broker);
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Missing mqtt_broker' });
    }
});

// Efficiency calculation endpoint
app.get('/api/efficiency', (req, res) => {
  db.calculateEfficiency((efficiency) => {
    if (efficiency === null) {
      res.json({ efficiency: null, message: 'Insufficient data' });
    } else {
      res.json({ efficiency: efficiency.toFixed(1) });
    }
  });
});

// Depletion estimation endpoint
app.get('/api/depletion/:kegId', (req, res) => {
  const kegId = req.params.kegId;
  
  db.getInventory((rows) => {
    const keg = rows.find(k => k.keg_id === kegId);
    if (!keg) {
      res.status(404).json({ error: 'Keg not found' });
      return;
    }
    
    db.estimateDepletion(kegId, keg.volume_remaining_ml, (daysRemaining) => {
      if (daysRemaining === null) {
        res.json({ days: null, message: 'Insufficient usage data' });
      } else {
        res.json({ days: daysRemaining.toFixed(1), kegId, currentVolume: keg.volume_remaining_ml });
      }
    });
  });
});

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log('Frontend Connected:', socket.id);
  
  // Send initial state for all taps
  Object.keys(tapStates).forEach(tapId => {
    socket.emit('tap_update', { tapId, ...tapStates[tapId].tap });
    socket.emit('keg_update', { tapId, ...tapStates[tapId].activeKeg });
  });
  
  // Send initial DB data
  db.getInventory((rows) => socket.emit('inventory_data', rows));
  db.getHistory((rows) => socket.emit('history_data', rows));
  db.getOrders((rows) => socket.emit('orders_data', rows));

  socket.on('disconnect', () => {
    console.log('Frontend Disconnected');
  });
});

// Polling DB for updates (Simple version)
setInterval(() => {
    db.getInventory((rows) => io.emit('inventory_data', rows));
    db.getOrders((rows) => io.emit('orders_data', rows));
}, 5000);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`SmartBar Backend running on http://localhost:${PORT}`);
});
