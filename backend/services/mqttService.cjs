
const mqtt = require('mqtt');
const { DEFAULT_KEG_SIZE_ML } = require('../config/constants.cjs');

class MqttService {
  constructor(db, tapStates, io, lastTelemetry) {
    this.mqttClient = null;
    this.db = db;
    this.tapStates = tapStates;
    this.io = io;
    this.lastTelemetry = lastTelemetry;
  }

  connect(brokerUrl) {
    if (this.mqttClient) {
      console.log('[MQTT] Disconnecting previous client...');
      this.mqttClient.end();
    }

    console.log(`[MQTT] Connecting to ${brokerUrl}...`);
    this.mqttClient = mqtt.connect(brokerUrl);

    this.mqttClient.on('connect', () => {
      console.log('[MQTT] Connected to broker');
      // Subscribe to ALL tap systems using wildcards
      this.mqttClient.subscribe('+/ui/display');
      this.mqttClient.subscribe('+/keg/+/status');
      this.mqttClient.subscribe('+/keg/+/event');
      console.log('[MQTT] Subscribed to all tap systems (+/ui/display, +/keg/+/status, +/keg/+/event)');
    });

    this.mqttClient.on('message', (topic, message) => this.handleMessage(topic, message));

    this.mqttClient.on('error', (err) => {
      console.error('[MQTT] Error:', err.message);
    });
  }

  handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      const topicParts = topic.split('/');
      
      // 1. Tap Display Updates (tapId/ui/display)
      if (topic.includes('/ui/display')) {
        this.handleTapDisplayUpdate(topicParts[0], payload);
      }
      // 2. Keg Telemetry (tapId/keg/kegId/status)
      else if (topic.includes('/status')) {
        this.handleKegTelemetry(topicParts[0], topicParts[2], payload);
      }
      // 3. Critical Events (tapId/keg/kegId/event)
      else if (topic.includes('/event')) {
        this.handleKegEvent(topicParts[0], topicParts[2], payload);
      }
    } catch (e) {
      console.error('Parse Error:', e);
    }
  }

  handleTapDisplayUpdate(tapId, payload) {
    if (!this.tapStates[tapId]) {
      this.tapStates[tapId] = {
        tap: { view: 'OFFLINE', beer: 'N/A', pct: 0, alert: null, beer_name: 'Unknown' },
        activeKeg: { id: '---', flow: 0, temp: 0, state: 'IDLE' },
        lastHeartbeat: Date.now(),
        isConnected: true
      };
    }
    this.tapStates[tapId].tap = payload;
    this.tapStates[tapId].lastHeartbeat = Date.now();
    this.tapStates[tapId].isConnected = true;
    this.io.emit('tap_update', { tapId, isConnected: true, ...payload });
  }

  handleKegTelemetry(tapId, kegId, payload) {
    // Auto-register tap if not exists
    if (!this.tapStates[tapId]) {
      this.tapStates[tapId] = {
        tap: { view: 'OFFLINE', beer: 'N/A', pct: 0, alert: null, beer_name: payload.beer_name || 'Unknown' },
        activeKeg: { id: '---', flow: 0, temp: 0, state: 'IDLE' },
        lastHeartbeat: Date.now(),
        isConnected: true
      };
      console.log(`[MQTT] Auto-registered new tap system: ${tapId}`);
    }
    
    // Update heartbeat on any keg status message
    this.tapStates[tapId].lastHeartbeat = Date.now();
    this.tapStates[tapId].isConnected = true;
    
    // Get beer name from payload or use previous value
    const beerName = payload.beer_name || this.lastTelemetry[kegId]?.beer_name || "Unknown Beer";
    
    // Persist to DB with tap association
    this.db.updateKeg(kegId, beerName, payload.vol_total_ml || DEFAULT_KEG_SIZE_ML, payload.vol_remaining_ml, payload.state, tapId);

    // Log telemetry snapshot for time-series analysis
    try {
      this.db.logTelemetry(kegId, payload.vol_remaining_ml, payload.flow_lpm, payload.temp_beer_c, Date.now());
    } catch (e) { 
      console.error('[SERVER] logTelemetry error', e); 
    }

    // Compute volume delta (only when volume decreased) and roll up into hourly bucket
    const last = this.lastTelemetry[kegId];
    if (last && typeof last.vol_remaining_ml === 'number' && payload.vol_remaining_ml < last.vol_remaining_ml) {
      const delta = Math.max(0, last.vol_remaining_ml - payload.vol_remaining_ml);
      const bucket = Math.floor(Date.now() / 3600000) * 3600000; // hour start in ms
      this.db.addUsageHour(bucket, beerName, delta);
    }
    this.lastTelemetry[kegId] = { vol_remaining_ml: payload.vol_remaining_ml, ts: Date.now(), beer_name: beerName };

    // Update Live State if it's the active pumping keg
    if (payload.state === 'PUMPING') {
      this.tapStates[tapId].activeKeg = {
        id: kegId,
        flow: payload.flow_lpm,
        temp: payload.temp_beer_c,
        state: payload.state
      };
      this.io.emit('keg_update', { tapId, ...this.tapStates[tapId].activeKeg });
    } else if (this.tapStates[tapId].activeKeg.id === kegId && payload.state === 'IDLE') {
      this.tapStates[tapId].activeKeg.state = 'IDLE';
      this.tapStates[tapId].activeKeg.flow = 0;
      this.io.emit('keg_update', { tapId, ...this.tapStates[tapId].activeKeg });
      
      // Logic: If idle and < 10% remaining, trigger auto-order
      if (payload.vol_remaining_ml < 2000) {
        this.db.createOrder(kegId, beerName);
        this.io.emit('order_created', { kegId, beer: beerName, tapId });
      }
    }
  }

  handleKegEvent(tapId, kegId, payload) {
    const beerName = this.lastTelemetry[kegId]?.beer_name || "Unknown Beer";
    
    if (payload.event === 'EMPTY_DETECTED') {
      this.db.updateKeg(kegId, beerName, DEFAULT_KEG_SIZE_ML, 0, "EMPTY", tapId);
      this.io.emit('alert', { type: 'error', msg: `Keg ${kegId} on ${tapId} Empty! Swapping...` });
    }
  }
}

module.exports = MqttService;
