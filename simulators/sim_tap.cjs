
const mqtt = require('mqtt');
const readline = require('readline');

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Usage: node sim_tap.cjs [SYSTEM_ID]');
    console.log('  SYSTEM_ID   MQTT system id / tap id (default tap-01)');
    console.log('Options: --help, -h   show this help');
    process.exit(0);
}

const SYSTEM_ID = argv[0] || 'tap-01';
const BROKER = 'mqtt://smart-tap.olivertemple.dev:1883';

const client = mqtt.connect(BROKER);

const PUB = '\x1b[32m';
const SUB = '\x1b[36m';
const LOG = '\x1b[33m';
const RESET = '\x1b[0m';

let isPouring = false;

console.log(`--- SMART TAP UI SIMULATION (${SYSTEM_ID}) ---`);
console.log("Controls: Press [ENTER] to toggle Pour Start/Stop\n");

client.on('connect', () => {
    console.log(`${LOG}[SYSTEM] Connected to Broker ${BROKER}${RESET}`);
    
    const topic = `${SYSTEM_ID}/ui/display`;
    client.subscribe(topic);
    console.log(`${LOG}[SYSTEM] Subscribed to ${topic}${RESET}`);
});

client.on('message', (topic, message) => {
    const payload = JSON.parse(message.toString());
    console.log(`${SUB}[SUB]  TOPIC: ${topic}${RESET}`);
    console.log(`${SUB}       DATA:  ${JSON.stringify(payload)}${RESET}`);
    
    if (process.stdin.isTTY) {
        console.log(`\n\t+----------------------------------+`);
        console.log(`\t| SCREEN UPDATE: ${payload.view.padEnd(17)} |`);
        console.log(`\t| Beer: ${payload.beer_name ? payload.beer_name.padEnd(24) : 'N/A                     '} |`);
        console.log(`\t| Rem : ${(payload.volume_remaining_pct + '%').padEnd(24)} |`);
        if(payload.alert) console.log(`\t| ALERT: ${payload.alert.padEnd(24)}|`);
        console.log(`\t+----------------------------------+\n`);
    }
});

if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on('keypress', (str, key) => {
        if (key.name === 'c' && key.ctrl) {
            process.exit();
        }
        
        if (key.name === 'return') {
            togglePour();
        }
    });
} else {
    process.stdin.on('data', (data) => {
        if (data.toString().includes('\n')) {
            togglePour();
        }
    });
}

function togglePour() {
    isPouring = !isPouring;
    const eventType = isPouring ? 'POUR_START' : 'POUR_STOP';
    const topic = `${SYSTEM_ID}/ui/event`;
    
    const payload = {
        event: eventType,
        timestamp: Date.now()
    };

    console.log(`${PUB}[PUB]  TOPIC: ${topic}${RESET}`);
    console.log(`${PUB}       DATA:  ${JSON.stringify(payload)}${RESET}`);
    
    client.publish(topic, JSON.stringify(payload));
}
