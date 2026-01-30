
function setupRoutes(app, controllers) {
  const { configController, tapController, inventoryController } = controllers;

  app.get('/api/config', (req, res) => configController.getConfig(req, res));
  app.post('/api/config', (req, res) => configController.updateConfig(req, res));

  // Simple auth endpoint (mock): accepts any non-empty username/password and returns a token
  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res.status(400).json({ message: 'username and password required' });
      }
      // In a real system, validate credentials, hash passwords, and issue JWTs.
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
      return res.json({ token, username });
    } catch (err) {
      return res.status(500).json({ message: 'auth error' });
    }
  });

  app.get('/api/taps', (req, res) => tapController.listTaps(req, res));
  app.delete('/api/taps/:tapId', (req, res) => tapController.deleteTap(req, res));

  app.get('/api/beers', (req, res) => inventoryController.getBeers(req, res));
  app.get('/api/inventory', (req, res) => inventoryController.getInventory(req, res));

  app.get('/api/usage', (req, res) => inventoryController.getUsage(req, res));
  app.get('/api/efficiency', (req, res) => inventoryController.getEfficiency(req, res));
  app.get('/api/depletion/:kegId', (req, res) => inventoryController.getDepletion(req, res));
}

module.exports = setupRoutes;
