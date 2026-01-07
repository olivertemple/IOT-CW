
const mqtt = require('mqtt');

// Arguments: node keg.js <KEG_ID> <START_VOL_ML>
const args = process.argv.slice(2);
const SYSTEM_ID = 'tap-01';
const DEVICE_ID = args[0] || 'keg-A';
const MAX_VOL = 20000; // 20L
let volumeMl = parseInt(args[1]) || MAX_VOL;

// MQTT Config
const BROKER = 'mqtt://test.mosquitto.org';
const client = mqtt.connect(BROKER);

// Topics
const TOPIC_CMD = `${SYSTEM_ID}/keg/${DEVICE_ID}/command`;
const TOPIC_STATUS = `${SYSTEM_ID}/keg/${DEVICE_ID}/status`;
const TOPIC_EVENT = `${SYSTEM_ID}/keg/${DEVICE_ID}/event`;

// Colors
const PUB = '\x1b[32m';
const SUB = '\x1b[36m';
const LOG = '\x1b[33m';
const ERR = '\x1b[31m';
const RESET = '\x1b[0m';

// Internal State
let state = 'IDLE'; // IDLE or PUMPING
let pumpInterval = null;

console.log(`--- SMART KEG SIMULATION (${DEVICE_ID}) ---`);
console.log(`[INIT] Volume: ${volumeMl}ml`);

client.on('connect', () => {
    console.log(`${LOG}[SYSTEM] Connected to Broker${RESET}`);
    client.subscribe(TOPIC_CMD);
    console.log(`${LOG}[SYSTEM] Subscribed to ${TOPIC_CMD}${RESET}`);
});

client.on('message', (topic, message) => {
    const payload = JSON.parse(message.toString());
    console.log(`${SUB}[SUB]  CMD: ${payload.action}${RESET}`);

    if (payload.action === 'START_PUMP') {
        startPump(payload);
    } else if (payload.action === 'STOP_PUMP') {
        stopPump();
    }
});

function startPump(config) {
    if (state === 'PUMPING') return;
    
    if (volumeMl <= 0) {
        console.log(`${ERR}[LOGIC] Cannot start pump: Keg Empty${RESET}`);
        publishEmptyEvent();
        return;
    }

    state = 'PUMPING';
    console.log(`${LOG}[LOGIC] Pump Started (PWM: ${config.pwm_duty})${RESET}`);

    // Start Physics Loop (2Hz)
    pumpInterval = setInterval(() => {
        // Simulate physics
        const flowRate = 50; // ml per tick (approx 100ml/sec = fast pour)
        volumeMl -= flowRate;
        
        // Clamp to 0
        if (volumeMl < 0) volumeMl = 0;

        // Publish Telemetry
        const status = {
            state: 'PUMPING',
            flow_lpm: (flowRate * 2 * 60) / 1000, // convert to LPM
            temp_beer_c: 4.2,
            temp_cellar_c: 12.0,
            weight_raw_g: volumeMl + 200, // + tare weight
            vol_remaining_ml: volumeMl,
            pump_duty: config.pwm_duty
        };
        console.log(`${PUB}[PUB]  STATUS: ${volumeMl}ml left${RESET}`);
        // Log raw JSON with DATA: prefix for the dashboard parser
        console.log(`DATA: ${JSON.stringify(status)}`);
        console.log(TOPIC_STATUS)
        client.publish(TOPIC_STATUS, JSON.stringify(status));

        // Check Empty
        if (volumeMl <= 0) {
            stopPump();
            publishEmptyEvent();
        }

    }, 500); // 500ms = 2Hz
}

function stopPump() {
    if (state === 'IDLE') return;
    state = 'IDLE';
    console.log(`${LOG}[LOGIC] Pump Stopped${RESET}`);
    clearInterval(pumpInterval);

    // Final status update
    const status = {
        state: 'IDLE',
        flow_lpm: 0,
        temp_beer_c: 4.2,
        temp_cellar_c: 12.0,
        weight_raw_g: volumeMl + 200,
        vol_remaining_ml: volumeMl,
        pump_duty: 0
    };
    console.log(`DATA: ${JSON.stringify(status)}`);
    client.publish(TOPIC_STATUS, JSON.stringify(status));
}

function publishEmptyEvent() {
    console.log(`${ERR}[LOGIC] DETECTED EMPTY! Publishing Event...${RESET}`);
    const payload = {
        event: 'EMPTY_DETECTED',
        reason: 'FLOW_STALL',
        metrics: { flow_rate_hz: 0, pump_current_ma: 90 },
        timestamp: Date.now()
    };
    client.publish(TOPIC_EVENT, JSON.stringify(payload));
}
