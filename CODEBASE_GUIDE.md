# SmartBar IoT System - Complete Codebase Guide

## Overview

SmartBar is a real-time IoT beer dispensing management system that monitors multiple tap systems, tracks inventory, predicts keg depletion, and provides analytics on usage patterns. The system uses MQTT for device communication, SQLite for data persistence, and Socket.IO for real-time web updates.

## Architecture

### System Components

```
┌─────────────────┐        MQTT Topics        ┌──────────────────┐
│  Tap Simulator  │◄─────────────────────────►│   MQTT Broker    │
│  (Hardware IoT) │    +/ui/display            │   (Mosquitto)    │
└─────────────────┘    +/keg/+/status          └──────────────────┘
                       +/keg/+/event                      │
                                                         │
                                                         ▼
┌─────────────────┐                           ┌──────────────────┐
│ React Frontend  │◄──────Socket.IO──────────►│  Express Server  │
│  (Dashboard UI) │    Real-time Events       │   (Node.js)      │
└─────────────────┘                           └──────────────────┘
                                                         │
                                                         ▼
                                              ┌──────────────────┐
                                              │  SQLite Database │
                                              │  (smartbar.db)   │
                                              └──────────────────┘
```

### Data Flow

1. **Device → Backend**: Simulators publish telemetry via MQTT
2. **Backend Processing**: MQTT service parses messages, updates database
3. **Backend → Frontend**: Socket.IO emits real-time events
4. **Frontend Display**: React components render live data
5. **User Actions**: API calls modify system state

## Directory Structure

```
IOT-CW/
├── backend/                    # Server-side logic
│   ├── config/
│   │   └── constants.cjs       # System configuration (ports, timeouts)
│   ├── controllers/
│   │   ├── configController.cjs    # MQTT broker settings
│   │   ├── inventoryController.cjs # Keg analytics & efficiency
│   │   └── tapController.cjs       # Tap system management
│   ├── repositories/
│   │   └── database.cjs        # SQLite operations & schema
│   ├── routes/
│   │   └── api.cjs            # REST API endpoint definitions
│   └── services/
│       ├── mqttService.cjs    # MQTT message handling
│       └── socketHandler.cjs  # WebSocket connection management
│
├── frontend/                   # React application
│   ├── data/
│   │   └── synthetic_pub_beer_sales.csv  # Analytics demo data
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # Reusable UI components
│   │   │   │   ├── AlertToast.tsx
│   │   │   │   ├── NavIcon.tsx
│   │   │   │   ├── SettingsModal.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── tap/           # Tap-specific views
│   │   │   │   ├── DashboardView.tsx   # Single tap details
│   │   │   │   ├── TapCard.tsx         # Tap summary card
│   │   │   │   └── TapsOverview.tsx    # Multi-tap grid
│   │   │   ├── AnalyticsDashboard.tsx  # Usage forecasting
│   │   │   ├── FlowChart.tsx           # Telemetry visualization
│   │   │   ├── InventoryManager.tsx    # Keg inventory table
│   │   │   └── LiveTapView.tsx         # Real-time tap monitor
│   │   ├── hooks/
│   │   │   ├── useAlerts.ts            # Toast notifications
│   │   │   ├── useHistoryData.ts       # Historical telemetry
│   │   │   ├── useInventoryData.ts     # Keg state polling
│   │   │   └── useTapData.ts           # Socket.IO tap updates
│   │   ├── services/
│   │   │   ├── ridgeModel.ts           # ML forecasting engine
│   │   │   └── socket.ts               # Socket.IO client setup
│   │   ├── App.tsx                     # Main app component
│   │   ├── constants.ts                # Frontend config
│   │   ├── index.tsx                   # React entry point
│   │   └── types.ts                    # TypeScript definitions
│   └── vite.config.ts
│
├── simulators/                 # IoT device simulators
│   ├── backfill.cjs           # Historical data generator
│   ├── dashboard.cjs          # Terminal UI coordinator
│   ├── sim_keg.cjs            # Keg sensor simulator
│   ├── sim_tap.cjs            # Tap display simulator
│   └── sim_valve.cjs          # Valve controller simulator
│
├── server.cjs                  # Express server entry point
├── Dockerfile                  # Production container build
├── docker-compose.yml          # Multi-container orchestration
└── package.json               # Dependencies & scripts
```

## Core Technologies

### Backend Stack
- **Express 5.1**: HTTP server & REST API
- **Socket.IO 4.8**: Real-time bidirectional communication
- **MQTT 5.14**: IoT message broker protocol
- **SQLite3**: Embedded relational database
- **Node.js**: JavaScript runtime (CommonJS modules)

### Frontend Stack
- **React 19.2**: UI framework with hooks
- **TypeScript**: Type-safe JavaScript
- **Vite 6.4**: Build tool & dev server
- **Recharts 3.7**: Data visualization
- **Framer Motion 12.23**: UI animations
- **Lucide React**: Icon library

### DevOps
- **Docker**: Containerization
- **blessed/blessed-contrib**: Terminal UI for simulators

## Database Schema

### Tables

#### `settings`
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```
Stores: MQTT broker URL

#### `pour_history`
```sql
CREATE TABLE pour_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER,
  keg_id TEXT,
  beer_name TEXT,
  volume_ml INTEGER,
  duration_sec REAL
);
```
Records: Individual pour events for analytics

#### `inventory`
```sql
CREATE TABLE inventory (
  keg_id TEXT,
  beer_name TEXT,
  volume_total_ml INTEGER,
  volume_remaining_ml INTEGER,
  status TEXT,              -- ACTIVE, STANDBY, EMPTY
  tap_id TEXT,
  last_updated INTEGER,
  PRIMARY KEY (tap_id, keg_id)
);
```
Multi-tap support: Composite primary key `(tap_id, keg_id)`

#### `telemetry`
```sql
CREATE TABLE telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER,
  keg_id TEXT,
  vol_remaining_ml INTEGER,
  flow_lpm REAL,
  temp_beer_c REAL
);
```
Stores: Time-series sensor data for efficiency calculations

#### `orders`
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keg_id TEXT,
  beer_name TEXT,
  quantity INTEGER,
  status TEXT,              -- PENDING, DELIVERED
  created_at INTEGER
);
```
Manages: Keg restock orders

#### `usage_hourly`
```sql
CREATE TABLE usage_hourly (
  bucket_ts INTEGER,
  beer_name TEXT,
  volume_ml INTEGER,
  PRIMARY KEY (bucket_ts, beer_name)
);
```
Aggregates: Hourly consumption for trending

## MQTT Topics

### Message Patterns

#### Tap Display Updates
**Topic**: `{tapId}/ui/display`  
**Payload**:
```json
{
  "view": "POURING",
  "beer": "Hazy IPA",
  "pct": 85,
  "alert": null,
  "beer_name": "Hazy IPA"
}
```

#### Keg Telemetry
**Topic**: `{tapId}/keg/{kegId}/status`  
**Payload**:
```json
{
  "state": "PUMPING",
  "flow_lpm": 6.2,
  "temp_beer_c": 4.5,
  "temp_cellar_c": 12.0,
  "weight_raw_g": 18700,
  "vol_remaining_ml": 18500,
  "vol_total_ml": 20000,
  "beer_name": "Hazy IPA",
  "pump_duty": 6.2
}
```

#### Critical Events
**Topic**: `{tapId}/keg/{kegId}/event`  
**Payload**:
```json
{
  "event": "KEG_EMPTY",
  "keg_id": "keg-A",
  "volume_ml": 0,
  "timestamp": 1706457600000
}
```

Event types:
- `KEG_EMPTY`: Volume depleted
- `KEG_LOW`: Below 10% threshold
- `AUTO_SWAP`: Switched to standby keg
- `POUR_COMPLETE`: Pour ended

## Socket.IO Events

### Backend → Frontend

| Event | Payload | Description |
|-------|---------|-------------|
| `tap_update` | `{ tapId, isConnected, view, beer, pct, alert }` | Tap display state changed |
| `keg_update` | `{ tapId, kegId, ...telemetry }` | Keg sensor reading |
| `inventory_data` | `[ { keg_id, beer_name, volume_remaining_ml, ... } ]` | Inventory snapshot |
| `orders_data` | `[ { id, keg_id, quantity, status, ... } ]` | Order list |
| `tap_status_changed` | `{ tapId, isConnected }` | Heartbeat timeout |

### Frontend → Backend
None (uses REST API for actions)

## REST API Endpoints

### Configuration
- `GET /api/config` - Get current MQTT broker URL
- `PUT /api/config` - Update MQTT broker
  ```json
  { "mqtt_broker": "mqtt://broker.example.com" }
  ```

### Tap Management
- `GET /api/taps` - List all detected tap systems
  ```json
  [
    { "tapId": "tap-01", "isConnected": true, "tap": {...}, "activeKeg": {...} }
  ]
  ```
- `DELETE /api/taps/:tapId` - Remove tap from tracking

### Inventory
- `GET /api/inventory` - Get all kegs with status
- `GET /api/efficiency` - Calculate system efficiency
  ```json
  { "efficiency": 0.95 }
  ```
  Formula: `(flow_meter_volume / load_cell_volume) * 100`

- `GET /api/depletion/:kegId` - Predict days until empty
  ```json
  { "keg_id": "keg-A", "days_remaining": 5.2 }
  ```
  Uses: 7-day rolling average consumption

## Key Algorithms

### System Efficiency Calculation
**Location**: `backend/repositories/database.cjs:calculateEfficiency()`

```javascript
efficiency = Σ(flow_meter_volume) / Σ(load_cell_delta) × 100
```

Where:
- `flow_meter_volume` = (flow_lpm × time_delta_sec × 1000) / 60
- `load_cell_delta` = previous_volume - current_volume

Uses telemetry from last 24 hours. Returns 100% if no data or invalid readings.

### Keg Depletion Estimation
**Location**: `backend/repositories/database.cjs:estimateDepletion()`

```javascript
days_remaining = current_volume / avg_daily_consumption
```

Where:
- `avg_daily_consumption` = Σ(7_day_usage) / 7

Returns estimated days until keg empty. Uses pour_history table.

### Usage Forecasting (ML)
**Location**: `frontend/src/services/ridgeModel.ts`

**Algorithm**: Ridge Regression with L2 regularization

**Features** (13 total):
1. Previous 7-day usage (lag-1)
2. Previous 14-day usage (lag-2)
3. Rolling mean (3-week window)
4. Rolling std dev
5. Usage trend (lag-1 - lag-2)
6. Percent change
7. Week of year (seasonality)
8. Month
9. Day of week
10. Is weekend (binary)
11. Holiday effect (binary)
12. Promo level (0-3)
13. Beer ID (categorical)

**Training**:
- 80/20 time-based train/test split per beer
- Alpha search over log-scale [10^-3, 10^3]
- Closed-form solution: `w = (X^T X + αI)^-1 X^T y`

**Prediction**: Returns recommended units for next 7 days per beer

## State Management

### Backend State
**`tapStates` object** (in-memory):
```javascript
{
  "tap-01": {
    tap: { view: "IDLE", beer: "Hazy IPA", pct: 85, alert: null },
    activeKeg: { id: "keg-A", flow: 0, temp: 4.5, state: "IDLE" },
    lastHeartbeat: 1706457600000,
    isConnected: true
  }
}
```

**`lastTelemetry` object** (in-memory):
```javascript
{
  "keg-A": { vol_remaining_ml: 18500, flow_lpm: 0, ... }
}
```

Used for delta calculations to avoid redundant DB writes.

### Frontend State
- **React Hooks**: `useState` for local component state
- **Custom Hooks**: Encapsulate Socket.IO subscriptions
  - `useTapData`: Tap system updates
  - `useInventoryData`: 5-second polling for keg list
  - `useHistoryData`: Historical telemetry
  - `useAlerts`: Toast notifications

No global state management (Redux/Zustand) - hooks provide sufficient reactivity.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Backend HTTP server port |
| `LISTEN_HOST` | 0.0.0.0 | Bind address (container-friendly) |
| `DB_FILE` | ./backend/repositories/smartbar.db | SQLite database path |
| `MQTT_BROKER` | mqtt://test.mosquitto.org | MQTT broker URL |

### Constants (`backend/config/constants.cjs`)

```javascript
{
  PORT: 3001,
  DB_POLL_INTERVAL_MS: 5000,           // Inventory refresh rate
  HEARTBEAT_CHECK_INTERVAL_MS: 10000,  // Tap health check frequency
  HEARTBEAT_TIMEOUT_MS: 30000,         // Disconnect threshold
  DEFAULT_KEG_SIZE_ML: 20000           // Standard keg volume
}
```

### Frontend Constants (`frontend/src/constants.ts`)

```javascript
export const BACKEND_URL = 
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
```

## Running the System

### Development Mode

**Terminal 1 - Backend**:
```bash
node server.cjs
```

**Terminal 2 - Frontend**:
```bash
npm run dev
```

**Terminal 3 - Simulator**:
```bash
node simulators/dashboard.cjs --tap=tap-01 --beer="Hazy IPA"
```

Access UI at: http://localhost:5173

### Production Mode (Docker)

```bash
docker-compose up -d
```

Access UI at: http://localhost:8080  
Backend API: http://localhost:3001

### Multiple Tap Systems

Run multiple simulators simultaneously:

```bash
# Terminal 1
node simulators/dashboard.cjs --tap=tap-01 --beer="IPA" --kegs=keg-A:1000,keg-B:20000

# Terminal 2
node simulators/dashboard.cjs --tap=tap-02 --beer="Stout" --kegs=keg-X:15000,keg-Y:20000

# Terminal 3
node simulators/dashboard.cjs --tap=tap-03 --beer="Lager"
```

Backend automatically discovers new taps when they publish MQTT messages.

## Simulator Architecture

### Dashboard Coordinator (`dashboard.cjs`)
- Spawns 3 child processes: tap, valve, kegs
- Renders terminal UI using `blessed-contrib`
- Displays:
  - Tap UI state (animated)
  - Valve status (active keg, pouring)
  - Keg metrics (volume, temp, flow) × 3
  - System log (events, swaps, alerts)

### Tap Simulator (`sim_tap.cjs`)
- Publishes to `{tapId}/ui/display` every 1 second
- States: OFFLINE → IDLE → POURING → IDLE
- Interactive: Press ENTER to toggle pour

### Valve Simulator (`sim_valve.cjs`)
- Manages keg selection logic
- Auto-swap when active keg empties
- Priority: ACTIVE → STANDBY kegs by volume

### Keg Simulator (`sim_keg.cjs`)
- Publishes to `{tapId}/keg/{kegId}/status` every 1 second
- Volume physics:
  - Pour rate: 6-8 L/min
  - Temperature: 4.2°C beer, 12.0°C cellar
  - Weight sensor: volume + tare (200g)
- Events:
  - `KEG_EMPTY` when volume = 0
  - `KEG_LOW` when volume < 10%

## Heartbeat Mechanism

Prevents stale tap states when devices disconnect.

**Implementation**:
1. Every `tap_update` message resets `lastHeartbeat` timestamp
2. Every 10 seconds, server checks all taps
3. If `now - lastHeartbeat > 30000ms`, mark tap as disconnected
4. Emit `tap_status_changed` event to frontend

**Frontend behavior**:
- Disconnected taps show red status badge
- Dashboard displays "Offline" state
- No telemetry updates until reconnection

## Code Organization Patterns

### Backend
- **Controllers**: Handle business logic, call database methods
- **Services**: External integrations (MQTT, Socket.IO)
- **Repositories**: Database abstraction layer
- **Routes**: Map HTTP methods to controller functions

### Frontend
- **Components**: Presentational UI elements
- **Hooks**: Stateful data fetching logic
- **Services**: External integrations (Socket.IO, ML models)
- **Types**: Shared TypeScript interfaces

### Naming Conventions
- **Files**: camelCase.cjs (backend), PascalCase.tsx (React components)
- **Functions**: camelCase (both)
- **React Components**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Database columns**: snake_case

## Error Handling

### Backend
- MQTT errors: Log to console, continue operation
- Database errors: Return empty arrays/default values
- API errors: Send appropriate HTTP status codes

### Frontend
- Socket disconnection: Show connection status badge
- Failed API calls: Display toast notification
- Missing data: Render empty states with helpful messages

## Security Considerations

1. **CORS**: Enabled with wildcard origin (development only)
2. **Input Validation**: Basic sanitization in controllers
3. **SQL Injection**: Uses parameterized queries (SQLite3 built-in)
4. **Port Exposure**: Containers expose only necessary ports
5. **Secrets**: No hardcoded credentials (use environment variables)

## Performance Optimizations

1. **Database Polling**: Fixed 5-second interval (avoid excessive queries)
2. **Telemetry Delta**: Only save to DB when volume changes
3. **React Memoization**: `useMemo` for expensive calculations
4. **Vite Code Splitting**: Dynamic imports for route-based chunks
5. **Socket.IO Room Isolation**: Prevents broadcast storms

## Testing the System

### Manual Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend builds successfully
- [ ] Simulator dashboard renders
- [ ] MQTT messages publish to broker
- [ ] Socket.IO events reach frontend
- [ ] Tap card updates in real-time
- [ ] Pour event triggers volume decrease
- [ ] Keg auto-swap works when primary empties
- [ ] Efficiency calculation returns valid percentage
- [ ] Depletion estimate shows days remaining
- [ ] Analytics dashboard renders chart
- [ ] Settings modal saves MQTT broker URL
- [ ] Heartbeat timeout disconnects stale taps

### Common Issues

**Build fails with "Cannot resolve /index.tsx"**:
- Fix: Ensure `index.html` points to `/frontend/src/index.tsx`

**MQTT connection fails**:
- Check broker URL in settings
- Verify network connectivity
- Try local broker: `docker run -d -p 1883:1883 eclipse-mosquitto`

**Frontend shows no taps**:
- Ensure backend is running on port 3001
- Check browser console for Socket.IO connection errors
- Verify CORS settings

**Keg auto-swap not working**:
- Check valve simulator logs for keg states
- Verify at least one STANDBY keg exists
- Ensure primary keg volume reached 0

## Future Enhancement Ideas

1. **Authentication**: User login & role-based access
2. **Multi-tenant**: Separate databases per venue
3. **Mobile App**: React Native companion app
4. **Push Notifications**: Alerts via Firebase/OneSignal
5. **Advanced Analytics**: Anomaly detection, demand forecasting
6. **Hardware Integration**: Support for real IoT devices (ESP32, Raspberry Pi)
7. **Cloud Deployment**: AWS IoT Core, Azure IoT Hub
8. **Data Export**: CSV/JSON download for external analysis

## Maintenance

### Database Migrations
Currently uses auto-migration in `database.cjs:initDb()`. For production:
- Use versioned migration system (e.g., `node-migrate`)
- Backup database before schema changes
- Test migrations in staging environment

### Log Management
- Console logs only (no file-based logging)
- Production: Consider Winston or Pino for structured logs
- Docker: Logs accessible via `docker logs <container>`

### Dependency Updates
```bash
npm outdated
npm update
npm audit fix
```

### Backup Strategy
SQLite database location: `./backend/repositories/smartbar.db`

Backup command:
```bash
sqlite3 smartbar.db ".backup smartbar_backup.db"
```

Docker volume backup:
```bash
docker run --rm -v smartbar_data:/data -v $(pwd):/backup alpine tar czf /backup/smartbar_backup.tar.gz /data
```

---

**Last Updated**: January 2026  
**Maintained by**: Oliver Temple  
**License**: Not specified
