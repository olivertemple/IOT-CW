
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

const SYSTEM_ID = 'tap-01';
let mqttClient = null;

// In-memory state for real-time broadcasting
const liveState = {
    tap: { view: 'OFFLINE', beer: 'N/A', pct: 0, alert: null },
    activeKeg: { id: '---', flow: 0, temp: 0, state: 'IDLE' }
};

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
      mqttClient.subscribe(`${SYSTEM_ID}/ui/display`);
      mqttClient.subscribe(`${SYSTEM_ID}/keg/+/status`);
      mqttClient.subscribe(`${SYSTEM_ID}/keg/+/event`);
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        
        // 1. Tap Display Updates
        if (topic.includes('/ui/display')) {
            liveState.tap = payload;
            io.emit('tap_update', liveState.tap);
        }

        // 2. Keg Telemetry
        else if (topic.includes('/status')) {
            const kegId = topic.split('/')[2];
            
            // Persist to DB
            db.updateKeg(kegId, "Hazy IPA", 20000, payload.vol_remaining_ml, payload.state);

            // Update Live State if it's the active pumping keg
            if (payload.state === 'PUMPING') {
                liveState.activeKeg = {
                    id: kegId,
                    flow: payload.flow_lpm,
                    temp: payload.temp_beer_c,
                    state: payload.state
                };
                io.emit('keg_update', liveState.activeKeg);
            } else if (liveState.activeKeg.id === kegId && payload.state === 'IDLE') {
                liveState.activeKeg.state = 'IDLE';
                liveState.activeKeg.flow = 0;
                io.emit('keg_update', liveState.activeKeg);
                
                // Logic: If idle and < 10% remaining, trigger auto-order
                if (payload.vol_remaining_ml < 2000) {
                    db.createOrder(kegId, "Hazy IPA");
                    io.emit('order_created', { kegId, beer: "Hazy IPA" });
                }
            }
        }
        
        // 3. Critical Events
        else if (topic.includes('/event')) {
            if (payload.event === 'EMPTY_DETECTED') {
                 const kegId = topic.split('/')[2];
                 db.updateKeg(kegId, "Hazy IPA", 20000, 0, "EMPTY");
                 io.emit('alert', { type: 'error', msg: `Keg ${kegId} Empty! Swapping...` });
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

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log('Frontend Connected:', socket.id);
  
  // Send initial state
  socket.emit('tap_update', liveState.tap);
  socket.emit('keg_update', liveState.activeKeg);
  
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
