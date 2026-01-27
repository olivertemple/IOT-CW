
// API Routes Configuration

function setupRoutes(app, controllers) {
  const { configController, tapController, inventoryController } = controllers;

  // Configuration endpoints
  app.get('/api/config', (req, res) => configController.getConfig(req, res));
  app.post('/api/config', (req, res) => configController.updateConfig(req, res));

  // Tap management endpoints
  app.get('/api/taps', (req, res) => tapController.listTaps(req, res));
  app.delete('/api/taps/:tapId', (req, res) => tapController.deleteTap(req, res));

  // Inventory and beer endpoints
  app.get('/api/beers', (req, res) => inventoryController.getBeers(req, res));
  app.get('/api/inventory', (req, res) => inventoryController.getInventory(req, res));

  // Analytics endpoints
  app.get('/api/usage', (req, res) => inventoryController.getUsage(req, res));
  app.get('/api/efficiency', (req, res) => inventoryController.getEfficiency(req, res));
  app.get('/api/depletion/:kegId', (req, res) => inventoryController.getDepletion(req, res));
}

module.exports = setupRoutes;
