
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
let idleStatusInterval = null;
let currentFlowLpm = 0;

// Base temps per keg (used to seed slower jitter updates)
const BASE_TEMPS = {
    'keg-A': { beer: 4.2, cellar: 11.5 },
    'keg-B': { beer: 6.5, cellar: 12.5 },
    'keg-C': { beer: 4.8, cellar: 12.0 }
};

// Temperature jitter control: update temps less frequently
let currentBeerTemp = null;
let currentCellarTemp = null;
let tempInterval = null;
const TEMP_JITTER_MS = 15000; // ~15s

// Flow jitter control: update flow jitter less frequently while pumping
let flowJitterInterval = null;
const FLOW_JITTER_MS = 3000; // ~3s

function buildStatusPayload(state, volumeMl, config) {
    const defaults = BASE_TEMPS[DEVICE_ID] || { beer: 4.5, cellar: 12.0 };

    // initialize persistent temps if needed
    if (currentBeerTemp === null) {
        currentBeerTemp = +(defaults.beer + (Math.random() - 0.5) * 0.2).toFixed(2);
    }
    if (currentCellarTemp === null) {
        currentCellarTemp = +(defaults.cellar + (Math.random() - 0.5) * 0.3).toFixed(2);
    }

    return {
        state: state,
        // Report the current pumping flow (with jitter) while pumping, otherwise 0
        flow_lpm: state === 'PUMPING' ? +(currentFlowLpm || 0).toFixed(2) : 0,
        temp_beer_c: currentBeerTemp,
        temp_cellar_c: currentCellarTemp,
        weight_raw_g: volumeMl + 200,
        vol_remaining_ml: volumeMl,
        vol_total_ml: MAX_VOL,
        beer_name: BEER_NAME,
        pump_duty: config.pwm_duty || 0
    };
}

function startTempInterval() {
    if (tempInterval) return;
    // ensure initial values
    const defaults = BASE_TEMPS[DEVICE_ID] || { beer: 4.5, cellar: 12.0 };
    if (currentBeerTemp === null) currentBeerTemp = +(defaults.beer + (Math.random() - 0.5) * 0.2).toFixed(2);
    if (currentCellarTemp === null) currentCellarTemp = +(defaults.cellar + (Math.random() - 0.5) * 0.3).toFixed(2);

    tempInterval = setInterval(() => {
        // small random walk around current value
        currentBeerTemp = +(currentBeerTemp + (Math.random() - 0.5) * 0.15).toFixed(2);
        currentCellarTemp = +(currentCellarTemp + (Math.random() - 0.5) * 0.2).toFixed(2);
    }, TEMP_JITTER_MS);
}

function startFlowJitter() {
    if (flowJitterInterval) return;
    // initial flow
    currentFlowLpm = +(6.0 + (Math.random() - 0.5) * 0.3).toFixed(2);
    flowJitterInterval = setInterval(() => {
        const jitter = (Math.random() - 0.5) * 0.6; // +/-0.3
        currentFlowLpm = +(6.0 + jitter).toFixed(2);
    }, FLOW_JITTER_MS);
}

function stopFlowJitter() {
    if (flowJitterInterval) {
        clearInterval(flowJitterInterval);
        flowJitterInterval = null;
    }
    currentFlowLpm = 0;
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
    // Start periodic idle status publishes (every 30s)
    startIdleStatusInterval();
    // Start slower temperature jitter updates
    startTempInterval();
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
    // Stop idle status updates while pumping so we don't change frequency
    if (idleStatusInterval) {
        clearInterval(idleStatusInterval);
        idleStatusInterval = null;
    }
    // start slower flow jitter updates (separate interval)
    startFlowJitter();
    pumpInterval = setInterval(() => {
        // Use the currentFlowLpm value (updated by startFlowJitter())
        const flowLpm = currentFlowLpm || 6.0;
        // Convert LPM to ml per 500ms tick: (L/min) * 1000 ml/L / 60 sec * 0.5 sec
        const flowRate = Math.round(flowLpm * 1000 / 60 * 0.5);
        volumeMl -= flowRate;
        if (volumeMl < 0) volumeMl = 0;

        const status = buildStatusPayload('PUMPING', volumeMl, config);
        // include flowLpm in logs for visibility
        console.log(`${PUB}[PUB]  STATUS: ${volumeMl}ml left (flow ${flowLpm} LPM)${RESET}`);
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
    // stop flow jitter updates and reset flow
    stopFlowJitter();

    const status = buildStatusPayload('IDLE', volumeMl, { pwm_duty: 0 });
    console.log(`DATA: ${JSON.stringify(status)}`);
    client.publish(TOPIC_STATUS, JSON.stringify(status));

    // Resume periodic idle status publishes
    startIdleStatusInterval();
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

function startIdleStatusInterval() {
    // ensure only one interval exists
    if (idleStatusInterval) clearInterval(idleStatusInterval);
    idleStatusInterval = setInterval(() => {
        try {
            if (state === 'IDLE') {
                const status = buildStatusPayload('IDLE', volumeMl, { pwm_duty: 0 });
                console.log(`DATA: ${JSON.stringify(status)}`);
                client.publish(TOPIC_STATUS, JSON.stringify(status));
            }
        } catch (e) {
            console.error('[SIM KEG] idle status interval error', e);
        }
    }, 30000);
}
