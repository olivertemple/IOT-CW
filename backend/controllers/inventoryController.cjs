
class InventoryController {
  constructor(db) {
    this.db = db;
  }

  getBeers(req, res) {
    this.db.getInventory((rows) => {
      const uniqueBeers = [...new Set(rows.map(r => r.beer_name))];
      res.json({ beers: uniqueBeers });
    });
  }

  getInventory(req, res) {
    this.db.getInventory((rows) => {
      res.json({ inventory: rows });
    });
  }

  getUsage(req, res) {
    const beer = req.query.beer || 'Hazy IPA';
    const to = parseInt(req.query.to, 10) || Date.now();
    const from = parseInt(req.query.from, 10) || (Date.now() - 24 * 3600000);

    this.db.getUsageRange(beer, from, to, (rows) => {
      const map = new Map();
      rows.forEach(r => map.set(r.bucket_ts, r.volume_ml));

      const startBucket = Math.floor(from / 3600000) * 3600000;
      const endBucket = Math.floor(to / 3600000) * 3600000;
      const out = [];
      for (let b = startBucket; b <= endBucket; b += 3600000) {
        out.push({ bucket_ts: b, volume_ml: map.get(b) || 0 });
      }
      res.json({ beer: beer, buckets: out });
    });
  }

  getEfficiency(req, res) {
    this.db.calculateEfficiency((efficiency) => {
      if (efficiency === null) {
        res.json({ efficiency: null, message: 'Insufficient data' });
      } else {
        res.json({ efficiency: efficiency.toFixed(1) });
      }
    });
  }

  getDepletion(req, res) {
    const kegId = req.params.kegId;
    
    this.db.getInventory((rows) => {
      const keg = rows.find(k => k.keg_id === kegId);
      if (!keg) {
        res.status(404).json({ error: 'Keg not found' });
        return;
      }
      
      this.db.estimateDepletion(kegId, keg.volume_remaining_ml, (daysRemaining) => {
        if (daysRemaining === null) {
          res.json({ days: null, message: 'Insufficient usage data' });
        } else {
          res.json({ days: daysRemaining.toFixed(1), kegId, currentVolume: keg.volume_remaining_ml });
        }
      });
    });
  }
}

module.exports = InventoryController;
