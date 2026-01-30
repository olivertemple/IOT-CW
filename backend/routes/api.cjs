
function setupRoutes(app, controllers) {
  const { configController, tapController, inventoryController } = controllers;

  app.get('/api/config', (req, res) => configController.getConfig(req, res));
  app.post('/api/config', (req, res) => configController.updateConfig(req, res));

  // Authentication endpoints: signup and login
  const bcrypt = require('bcryptjs');

  app.post('/api/auth/signup', (req, res) => {
    try {
      const { username, clientHash } = req.body || {};
      if (!username || !clientHash) {
        return res.status(400).json({ message: 'username and clientHash required' });
      }
      // server-side bcrypt hash of the client-provided hash
      const saltRounds = 10;
      bcrypt.hash(clientHash, saltRounds, (err, hashed) => {
        if (err) return res.status(500).json({ message: 'hash error' });
        // create user
        const db = require('../repositories/database.cjs');
        db.createUser(username, hashed, (dbErr, user) => {
          if (dbErr) {
            if (dbErr.message && dbErr.message.includes('UNIQUE')) {
              return res.status(409).json({ message: 'username already exists' });
            }
            return res.status(500).json({ message: 'db error' });
          }
          const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
          return res.json({ token, username: user.username });
        });
      });
    } catch (err) {
      return res.status(500).json({ message: 'auth signup error' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { username, clientHash } = req.body || {};
      if (!username || !clientHash) {
        return res.status(400).json({ message: 'username and clientHash required' });
      }
      const db = require('../repositories/database.cjs');
      db.getUserByUsername(username, (dbErr, user) => {
        if (dbErr) return res.status(500).json({ message: 'db error' });
        if (!user) return res.status(401).json({ message: 'invalid credentials' });
        bcrypt.compare(clientHash, user.password_hash, (cmpErr, ok) => {
          if (cmpErr) return res.status(500).json({ message: 'compare error' });
          if (!ok) return res.status(401).json({ message: 'invalid credentials' });
          const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
          return res.json({ token, username });
        });
      });
    } catch (err) {
      return res.status(500).json({ message: 'auth login error' });
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
