
const mqtt = require('mqtt');

const broker = process.env.MQTT_BROKER || 'mqtt://test.mosquitto.org';
const topics = process.argv.slice(2);
const subscribeTopics = topics.length
  ? topics
  : [
      '+/ui/display',
      '+/ui/event',
      '+/keg/+/status',
      '+/keg/+/event',
      '+/keg/+/command'
    ];

const client = mqtt.connect(broker);

client.on('connect', () => {
  console.log(`Connected to ${broker}`);
  console.log(`Subscribing to: ${subscribeTopics.join(', ')}`);
  subscribeTopics.forEach((t) => {
    client.subscribe(t, { qos: 0 }, (err) => {
      if (err) console.error(`Subscribe error for ${t}:`, err.message || err);
    });
  });
});

client.on('message', (topic, message) => {
  const raw = message.toString();
  let pretty = raw;
  try {
    const parsed = JSON.parse(raw);
    pretty = JSON.stringify(parsed, null, 2);
  } catch (e) {
    // not JSON — keep raw string
  }

  console.log('---');
  console.log(`Topic: ${topic}`);
  console.log('Message:');
  console.log(pretty);
});

client.on('error', (err) => {
  console.error('MQTT error:', err.message || err);
});

process.on('SIGINT', () => {
  console.log('\nDisconnecting...');
  client.end(false, () => process.exit(0));
});
