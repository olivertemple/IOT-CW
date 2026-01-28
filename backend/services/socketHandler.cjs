
class SocketHandler {
  constructor(io, tapStates, db) {
    this.io = io;
    this.tapStates = tapStates;
    this.db = db;
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log('Frontend Connected:', socket.id);
      
      Object.keys(this.tapStates).forEach(tapId => {
        socket.emit('tap_update', { tapId, ...this.tapStates[tapId].tap });
        socket.emit('keg_update', { tapId, ...this.tapStates[tapId].activeKeg });
      });
      
      this.db.getInventory((rows) => socket.emit('inventory_data', rows));
      this.db.getHistory((rows) => socket.emit('history_data', rows));
      this.db.getOrders((rows) => socket.emit('orders_data', rows));

      socket.on('disconnect', () => {
        console.log('Frontend Disconnected');
      });
    });
  }
}

module.exports = SocketHandler;
