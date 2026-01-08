npm run dev to start frontend

node ./server.cjs to start backend server

node ./dashboard.cjs to start simulator

currently uses mosquitto as mqtt broker

## Multi-Tap Support

The system now supports multiple tap systems simultaneously. Each tap system is identified by a unique ID (e.g., `tap-01`, `tap-02`).

### Starting Multiple Tap Simulators

To simulate multiple tap systems, run the dashboard with different tap names:

```bash
# Terminal 1 - Default tap (tap-01)
node ./dashboard.cjs

# Terminal 2 - Second tap system
node ./dashboard.cjs --tap=tap-02

# Terminal 3 - Third tap system
node ./dashboard.cjs --tap=tap-03
```

The backend automatically discovers and tracks all tap systems when they start publishing MQTT messages.

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