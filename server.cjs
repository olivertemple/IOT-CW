
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./backend/repositories/database.cjs');
const constants = require('./backend/config/constants.cjs');
const PORT = process.env.PORT || constants.PORT;
const DB_POLL_INTERVAL_MS = constants.DB_POLL_INTERVAL_MS;
const HEARTBEAT_CHECK_INTERVAL_MS = constants.HEARTBEAT_CHECK_INTERVAL_MS;
const HEARTBEAT_TIMEOUT_MS = constants.HEARTBEAT_TIMEOUT_MS;
const path = require('path');
const MqttService = require('./backend/services/mqttService.cjs');
const SocketHandler = require('./backend/services/socketHandler.cjs');
const ConfigController = require('./backend/controllers/configController.cjs');
const TapController = require('./backend/controllers/tapController.cjs');
const InventoryController = require('./backend/controllers/inventoryController.cjs');
const setupRoutes = require('./backend/routes/api.cjs');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Keep last-known telemetry per keg for delta calculations
const lastTelemetry = {};

// Multi-tap support: track state per tap system
const tapStates = {};
// Initialize MQTT Service
const mqttService = new MqttService(db, tapStates, io, lastTelemetry);

// Initialize Controllers
const configController = new ConfigController(db, mqttService);
const tapController = new TapController(tapStates, db, io);
const inventoryController = new InventoryController(db);

// Setup API Routes
setupRoutes(app, { configController, tapController, inventoryController });

// Serve frontend static files from the Vite build output
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for client-side routing except for /api/* paths
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize Socket.IO Handler
const socketHandler = new SocketHandler(io, tapStates, db);
socketHandler.initialize();

// Initialize MQTT from DB settings
db.getSetting('mqtt_broker', (url) => {
  const broker = url || 'mqtt://test.mosquitto.org';
  mqttService.connect(broker);
});

// Polling DB for updates
setInterval(() => {
  db.getInventory((rows) => io.emit('inventory_data', rows));
  db.getOrders((rows) => io.emit('orders_data', rows));
}, DB_POLL_INTERVAL_MS);

// Check for disconnected taps (heartbeat timeout)
setInterval(() => {
  const now = Date.now();
  Object.keys(tapStates).forEach(tapId => {
    const tap = tapStates[tapId];
    const timeSinceHeartbeat = now - (tap.lastHeartbeat || 0);
    
    if (timeSinceHeartbeat > HEARTBEAT_TIMEOUT_MS && tap.isConnected) {
      tap.isConnected = false;
      console.log(`[HEARTBEAT] Tap ${tapId} disconnected (timeout)`);
      io.emit('tap_status_changed', { tapId, isConnected: false });
    }
  });
}, HEARTBEAT_CHECK_INTERVAL_MS);

// Listen on all interfaces so container is accessible from host LAN
const LISTEN_HOST = process.env.LISTEN_HOST || '0.0.0.0';
server.listen(PORT, LISTEN_HOST, () => {
  console.log(`SmartBar Backend running on http://${LISTEN_HOST}:${PORT}`);
});
