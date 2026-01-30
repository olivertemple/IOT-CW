
class TapController {
  constructor(tapStates, db, io) {
    this.tapStates = tapStates;
    this.db = db;
    this.io = io;
  }

  listTaps(req, res) {
    const taps = Object.keys(this.tapStates).map(tapId => ({
      tapId,
      tap: this.tapStates[tapId].tap,
      activeKeg: this.tapStates[tapId].activeKeg,
      isConnected: this.tapStates[tapId].isConnected || false,
      lastHeartbeat: this.tapStates[tapId].lastHeartbeat || 0
    }));
    res.json({ taps });
  }

  deleteTap(req, res) {
    const tapId = req.params.tapId;
    
    if (this.tapStates[tapId]) {
      delete this.tapStates[tapId];
      
      this.db.deleteKegsByTap(tapId, (err) => {
        if (err) {
          console.error(`[API] Failed to delete kegs for tap ${tapId}:`, err.message);
          res.status(500).json({ error: `Failed to delete kegs: ${err.message}` });
        } else {
          console.log(`[API] Deleted tap system and kegs: ${tapId}`);
          this.io.emit('tap_deleted', { tapId });
          
          this.db.getInventory((rows) => this.io.emit('inventory_data', rows));
          
          res.json({ success: true, message: `Tap ${tapId} disconnected and kegs removed` });
        }
      });
    } else {
      res.status(404).json({ error: 'Tap not found' });
    }
  }
}

module.exports = TapController;
