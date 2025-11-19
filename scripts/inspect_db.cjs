const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'smarttap.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) return console.error('Failed to open DB:', err.message);
  console.log('Opened DB:', dbPath);
});

db.serialize(() => {
  // Try to select state column; if it doesn't exist, fall back to a safe projection.
  db.all('SELECT id, name, beer_name, beer_type, keg_size_liters, spare_kegs, state, created_at FROM taps', [], (err, rows) => {
    if (err) {
      console.warn('Could not read `state` column (older schema). Falling back. Error:', err.message);
      db.all('SELECT id, name, beer_name, beer_type, keg_size_liters, spare_kegs, created_at FROM taps', [], (err2, rows2) => {
        if (err2) return console.error('Error reading taps:', err2.message);
        console.log('\n== taps ==');
        rows2.forEach(r => {
          console.log({ id: r.id, name: r.name, kegSizeLiters: r.keg_size_liters, spareKegs: r.spare_kegs });
        });
      });
      return;
    }

    console.log('\n== taps ==');
    rows.forEach(r => {
      let state = {};
      if (r.state) {
        try { state = JSON.parse(r.state); } catch (e) { state = { parseError: true }; }
      }
      console.log({ id: r.id, name: r.name, kegSizeLiters: r.keg_size_liters, spareKegs: r.spare_kegs, state });
    });
  });

  db.get('SELECT COUNT(*) AS c FROM events', [], (err, row) => {
    if (err) {
      console.error('Error reading events:', err.message);
      return db.close(() => {});
    }
    console.log('\nEvents count:', row.c);
    db.close((closeErr) => {
      if (closeErr) console.error('Error closing DB:', closeErr.message);
      // exit explicitly so no other async cleanup races with sqlite native addon
      process.exit(0);
    });
  });
});
