
const mqtt = require('mqtt');

const args = process.argv.slice(2);
const DEVICE_ID = args[0] || 'keg-A';
const MAX_VOL = 20000;
let volumeMl = parseInt(args[1]) || MAX_VOL;
const SYSTEM_ID = args[2] || 'tap-01';
const BEER_NAME = args[3] || 'Hazy IPA';

const BROKER = 'mqtt://smart-tap.olivertemple.dev:1883';
const client = mqtt.connect(BROKER);

const TOPIC_CMD = `${SYSTEM_ID}/keg/${DEVICE_ID}/command`;
const TOPIC_STATUS = `${SYSTEM_ID}/keg/${DEVICE_ID}/status`;
const TOPIC_EVENT = `${SYSTEM_ID}/keg/${DEVICE_ID}/event`;

const PUB = '\x1b[32m';
const SUB = '\x1b[36m';
const LOG = '\x1b[33m';
const ERR = '\x1b[31m';
const RESET = '\x1b[0m';

let state = 'IDLE';
let pumpInterval = null;

function buildStatusPayload(state, volumeMl, config) {
  return {
    state: state,
    flow_lpm: state === 'PUMPING' ? (50 * 2 * 60) / 1000 : 0,
    temp_beer_c: 4.2,
    temp_cellar_c: 12.0,
    weight_raw_g: volumeMl + 200,
    vol_remaining_ml: volumeMl,
    vol_total_ml: MAX_VOL,
    beer_name: BEER_NAME,
    pump_duty: config.pwm_duty || 0
  };
}

console.log(`--- SMART KEG SIMULATION (${DEVICE_ID}) on ${SYSTEM_ID} ---`);
console.log(`[INIT] Beer: ${BEER_NAME}, Volume: ${volumeMl}ml`);

client.on('connect', () => {
    console.log(`${LOG}[SYSTEM] Connected to Broker${RESET}`);
    client.subscribe(TOPIC_CMD);
    console.log(`${LOG}[SYSTEM] Subscribed to ${TOPIC_CMD}${RESET}`);
    const initStatus = buildStatusPayload('IDLE', volumeMl, { pwm_duty: 0 });
    console.log(`${PUB}[PUB]  INITIAL STATUS: ${volumeMl}ml${RESET}`);
    console.log(`DATA: ${JSON.stringify(initStatus)}`);
    client.publish(TOPIC_STATUS, JSON.stringify(initStatus));
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

    pumpInterval = setInterval(() => {
        const flowRate = 50;
        volumeMl -= flowRate;
        
        if (volumeMl < 0) volumeMl = 0;

        const status = buildStatusPayload('PUMPING', volumeMl, config);
        console.log(`${PUB}[PUB]  STATUS: ${volumeMl}ml left${RESET}`);
        console.log(`DATA: ${JSON.stringify(status)}`);
        client.publish(TOPIC_STATUS, JSON.stringify(status));

        if (volumeMl <= 0) {
            stopPump();
            publishEmptyEvent();
        }

    }, 500);
}

function stopPump() {
    if (state === 'IDLE') return;
    state = 'IDLE';
    console.log(`${LOG}[LOGIC] Pump Stopped${RESET}`);
    clearInterval(pumpInterval);

    const status = buildStatusPayload('IDLE', volumeMl, { pwm_duty: 0 });
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
