
// Configuration API Controller

class ConfigController {
  constructor(db, mqttService) {
    this.db = db;
    this.mqttService = mqttService;
  }

  getConfig(req, res) {
    this.db.getSetting('mqtt_broker', (url) => {
      res.json({ mqtt_broker: url || 'mqtt://test.mosquitto.org' });
    });
  }

  updateConfig(req, res) {
    const { mqtt_broker } = req.body;
    if (mqtt_broker) {
      this.db.saveSetting('mqtt_broker', mqtt_broker);
      this.mqttService.connect(mqtt_broker);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Missing mqtt_broker' });
    }
  }
}

module.exports = ConfigController;
