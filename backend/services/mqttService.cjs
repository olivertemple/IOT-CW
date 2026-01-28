
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

  createDefaultTapState(tapId, beerName = 'Unknown') {
    return {
      tap: { view: 'OFFLINE', beer: 'N/A', pct: 0, alert: null, beer_name: beerName },
      activeKeg: { id: '---', flow: 0, temp: 0, state: 'IDLE' },
      lastHeartbeat: Date.now(),
      isConnected: true
    };
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
      
      if (topic.includes('/ui/display')) {
        this.handleTapDisplayUpdate(topicParts[0], payload);
      }
      else if (topic.includes('/status')) {
        this.handleKegTelemetry(topicParts[0], topicParts[2], payload);
      }
      else if (topic.includes('/event')) {
        this.handleKegEvent(topicParts[0], topicParts[2], payload);
      }
    } catch (e) {
      console.error('Parse Error:', e);
    }
  }

  handleTapDisplayUpdate(tapId, payload) {
    if (!this.tapStates[tapId]) {
      this.tapStates[tapId] = this.createDefaultTapState(tapId);
    }
    this.tapStates[tapId].tap = payload;
    this.tapStates[tapId].lastHeartbeat = Date.now();
    this.tapStates[tapId].isConnected = true;
    this.io.emit('tap_update', { tapId, isConnected: true, ...payload });
  }

  handleKegTelemetry(tapId, kegId, payload) {
    if (!this.tapStates[tapId]) {
      this.tapStates[tapId] = this.createDefaultTapState(tapId, payload.beer_name || 'Unknown');
      console.log(`[MQTT] Auto-registered new tap system: ${tapId}`);
    }
    
    this.tapStates[tapId].lastHeartbeat = Date.now();
    this.tapStates[tapId].isConnected = true;
    
    const beerName = payload.beer_name || this.lastTelemetry[kegId]?.beer_name || "Unknown Beer";
    
    this.db.updateKeg(kegId, beerName, payload.vol_total_ml || DEFAULT_KEG_SIZE_ML, payload.vol_remaining_ml, payload.state, tapId);

    try {
      this.db.logTelemetry(kegId, payload.vol_remaining_ml, payload.flow_lpm, payload.temp_beer_c, Date.now());
    } catch (e) { 
      console.error('[SERVER] logTelemetry error', e); 
    }

    // Track volume consumed - only count decreases (increases are sensor glitches)
    const last = this.lastTelemetry[kegId];
    if (last && typeof last.vol_remaining_ml === 'number' && payload.vol_remaining_ml < last.vol_remaining_ml) {
      const delta = Math.max(0, last.vol_remaining_ml - payload.vol_remaining_ml);
      // Round timestamp to nearest hour for aggregation (e.g., 12:34:56 → 12:00:00)
      const bucket = Math.floor(Date.now() / 3600000) * 3600000;
      this.db.addUsageHour(bucket, beerName, delta);
    }
    this.lastTelemetry[kegId] = { vol_remaining_ml: payload.vol_remaining_ml, ts: Date.now(), beer_name: beerName };

    if (payload.state === 'PUMPING') {
      // When pumping, preserve exact sensor values (no defaults)
      this.tapStates[tapId].activeKeg = {
        id: kegId,
        flow: payload.flow_lpm,
        temp: payload.temp_beer_c,
        state: payload.state
      };
      this.io.emit('keg_update', { tapId, ...this.tapStates[tapId].activeKeg });
    } else {
      // When idle, apply safe defaults in case sensors report null
      this.tapStates[tapId].activeKeg = {
        id: kegId,
        flow: payload.flow_lpm || 0,
        temp: payload.temp_beer_c || 0,
        state: payload.state || 'IDLE'
      };

      this.io.emit('keg_update', { tapId, ...this.tapStates[tapId].activeKeg });

      if (payload.state === 'IDLE' && payload.vol_remaining_ml < 2000) {
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
