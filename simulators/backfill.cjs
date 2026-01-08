#!/usr/bin/env node
// Backfill script for smarttap demo data
// Usage: node scripts/backfill.js [--volume=smarttap-iot-docs-3_smartbar_data] [--days=7]

const { execSync } = require('child_process');
const argv = require('minimist')(process.argv.slice(2));

const volume = argv.volume || process.env.VOLUME || 'smarttap-iot-docs-3_smartbar_data';
const days = parseInt(argv.days || process.env.DAYS || '7', 10);

const beers = [
  { keg: 'keg-A', name: 'Hazy IPA' },
  { keg: 'keg-B', name: 'Stout' },
  { keg: 'keg-C', name: 'Lager' }
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const now = Date.now();
const start = now - days * 24 * 3600 * 1000;
const startBucket = Math.floor(start / 3600000) * 3600000;

// Build SQL
let sql = `PRAGMA journal_mode=WAL;\nBEGIN TRANSACTION;\n`;

// Ensure inventory rows exist with full kegs
for (const b of beers) {
  sql += `REPLACE INTO inventory (keg_id, beer_name, volume_total_ml, volume_remaining_ml, status, last_updated) VALUES ('${b.keg}', '${b.name}', 20000, 20000, 'ACTIVE', ${Date.now()});\n`;
}

// We'll keep a running remaining volume per keg
const remaining = {};
beers.forEach(b => remaining[b.keg] = 20000);

for (let t = startBucket; t <= now; t += 3600000) {
  const hour = new Date(t).getHours();

  for (const b of beers) {
    // base demand by hour (evenings busier)
    let multiplier = 1;
    if (hour >= 18 && hour <= 23) multiplier = 1.6;
    else if (hour >= 11 && hour <= 14) multiplier = 1.2;
    else if (hour >= 1 && hour <= 5) multiplier = 0.2;

    // usage between 0 and ~600 ml per hour scaled
    const usage = Math.max(0, Math.round((randInt(0, 400) * multiplier)));

    // apply usage to remaining (prevent negative)
    const actualUsage = Math.min(remaining[b.keg], usage);
    remaining[b.keg] -= actualUsage;

    // Insert an hourly aggregate row (upsert to accumulate if bucket already exists)
    sql += `INSERT INTO usage_hourly (bucket_ts, beer_name, volume_ml) VALUES (${t}, '${b.name}', ${actualUsage}) ON CONFLICT(bucket_ts, beer_name) DO UPDATE SET volume_ml = usage_hourly.volume_ml + excluded.volume_ml;\n`;

    // Insert a telemetry sample for this hour reflecting remaining vol
    const flow = actualUsage > 0 ? randInt(3, 8) : 0;
    sql += `INSERT INTO telemetry (timestamp, keg_id, vol_remaining_ml, flow_lpm, temp_beer_c) VALUES (${t + 1000}, '${b.keg}', ${remaining[b.keg]}, ${flow}, 4.2);\n`;
  }
}

// Also add some pour_history samples for realism (take last few pours)
let phId = 1;
for (const b of beers) {
  for (let i = 0; i < 5; i++) {
    const ts = now - i * 3600000 - randInt(0, 300000);
    const vol = randInt(50, 500);
    const dur = Math.round(vol / 100 * 2); // seconds-ish
    sql += `INSERT INTO pour_history (timestamp, keg_id, beer_name, volume_ml, duration_sec) VALUES (${ts}, '${b.keg}', '${b.name}', ${vol}, ${dur});\n`;
    phId++;
  }
}

sql += `COMMIT;\n`;

console.log(`Writing ${days} days of sample data for ${beers.length} beers into volume: ${volume}`);

try {
  // Run the SQL inside a disposable alpine container with sqlite installed
  const cmd = `docker run --rm -i -v ${volume}:/data alpine sh -c "apk add --no-cache sqlite >/dev/null 2>&1 && sqlite3 /data/smartbar.db"`;
  // Provide SQL via stdin while inheriting stdout/stderr so the container logs are visible.
  execSync(cmd, { input: Buffer.from(sql), stdio: ['pipe', 'inherit', 'inherit'] });
  console.log('Backfill complete.');
} catch (e) {
  console.error('Backfill failed:', e.message || e);
  process.exit(1);
}
