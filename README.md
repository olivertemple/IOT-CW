npm run dev to start frontend

node ./server.cjs to start backend server

node ./simulators/dashboard.cjs to start simulator

currently uses mosquitto as mqtt broker

## Multi-Tap Support & Customization

The system now supports multiple tap systems simultaneously with customizable beer names and keg configurations.

### Starting Multiple Tap Simulators

#### Basic Usage (Single Tap)
```bash
# Default tap (tap-01) with Hazy IPA and default kegs
node ./simulators/dashboard.cjs
```

#### Custom Tap Name
```bash
# Second tap system
node ./simulators/dashboard.cjs --tap=tap-02

# Third tap system
node ./simulators/dashboard.cjs --tap=tap-03
```

#### Custom Beer Name
```bash
# Tap serving Guinness
node ./simulators/dashboard.cjs --tap=tap-01 --beer="Guinness Stout"

# Tap serving Lager
node ./simulators/dashboard.cjs --tap=tap-02 --beer="Pilsner Lager"
```

#### Custom Keg Configuration
```bash
# Custom kegs: keg-ID:volume_ml (comma-separated)
node ./simulators/dashboard.cjs --tap=tap-01 --beer="IPA" --kegs=keg-1:5000,keg-2:20000,keg-3:20000

# Different beer and keg setup
node ./simulators/dashboard.cjs --tap=tap-02 --beer="Stout" --kegs=keg-A:10000,keg-B:15000
```

#### Complete Example
```bash
# Terminal 1 - IPA tap with 3 kegs
node ./simulators/dashboard.cjs --tap=tap-01 --beer="Hazy IPA" --kegs=keg-A:1000,keg-B:20000,keg-C:20000

# Terminal 2 - Stout tap with 2 kegs
node ./simulators/dashboard.cjs --tap=tap-02 --beer="Guinness" --kegs=keg-X:15000,keg-Y:20000

# Terminal 3 - Lager tap
node ./simulators/dashboard.cjs --tap=tap-03 --beer="Pilsner" --kegs=keg-1:20000,keg-2:20000
```

The backend automatically discovers and tracks all tap systems when they start publishing MQTT messages.

### Frontend Features

**Multi-Tap Overview**: The frontend now shows all connected tap systems in a grid view with key metrics at a glance. Click any tap card to view detailed information.

**Tap Selector**: When viewing detailed dashboard for a specific tap, you can quickly switch between taps using the tap selector bar.

### API Endpoints

- `GET /api/taps` - List all detected tap systems
- `GET /api/efficiency` - Get calculated system efficiency (flow-meter vs load-cell)
- `GET /api/depletion/:kegId` - Get estimated depletion time for a specific keg

### Data-Driven Calculations

**System Efficiency**: Calculated from last 24 hours of telemetry data by comparing flow-meter readings against actual volume consumed (load-cell measurements).

**Estimated Depletion**: Calculated from last 7 days of usage patterns. Shows how many days until keg is empty based on average consumption rate.

Docker
------

Build and run both services with persistent DB volume:

```bash
docker-compose build
docker-compose up -d
```

Frontend will be available at http://localhost:8080 and backend at http://localhost:3001.
The SQLite DB is persisted in the Docker volume `smartbar_data`.