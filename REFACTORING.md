# Codebase Refactoring Documentation

## Overview
This document describes the refactored architecture of the SmartTap IoT system. The codebase has been reorganized into a clean, modular structure for better maintainability and scalability.

## Project Structure

```
IOT-CW/
├── backend/                    # Backend server code
│   ├── config/                 # Configuration constants
│   │   └── constants.cjs      # Backend configuration values
│   ├── controllers/           # API route controllers
│   │   ├── configController.cjs
│   │   ├── inventoryController.cjs
│   │   └── tapController.cjs
│   ├── repositories/          # Data access layer
│   │   └── database.cjs       # SQLite database operations
│   ├── routes/                # API route definitions
│   │   └── api.cjs           # All API endpoints
│   └── services/              # Business logic services
│       ├── mqttService.cjs   # MQTT broker communication
│       └── socketHandler.cjs # WebSocket event handling
│
├── frontend/                   # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # Reusable UI components
│   │   │   │   ├── AlertToast.tsx
│   │   │   │   ├── NavIcon.tsx
│   │   │   │   ├── SettingsModal.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── tap/           # Tap-specific components
│   │   │   │   ├── DashboardView.tsx
│   │   │   │   ├── TapCard.tsx
│   │   │   │   └── TapsOverview.tsx
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── InventoryManager.tsx
│   │   │   └── LiveTapView.tsx
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useAlerts.ts
│   │   │   ├── useHistoryData.ts
│   │   │   ├── useInventoryData.ts
│   │   │   └── useTapData.ts
│   │   ├── services/          # External service integrations
│   │   │   ├── geminiService.ts
│   │   │   └── socket.ts
│   │   ├── utils/             # Utility functions
│   │   ├── types/             # TypeScript type definitions
│   │   ├── constants.ts       # Frontend constants
│   │   ├── types.ts           # Shared types
│   │   └── App.tsx            # Main application component
│   ├── index.html
│   ├── index.css
│   └── vite.config.ts
│
├── simulators/                 # IoT device simulators
│   ├── dashboard.cjs          # Tap system dashboard
│   ├── sim_keg.cjs            # Keg simulator
│   ├── sim_tap.cjs            # Tap simulator
│   ├── sim_valve.cjs          # Valve simulator
│   └── backfill.cjs           # Data backfill utility
│
├── server.cjs                 # Backend entry point
├── index.tsx                  # Frontend entry point
├── index.html                 # HTML entry point
├── index.css                  # Global styles
├── docker-compose.yml         # Docker orchestration
├── Dockerfile.backend         # Backend container definition
└── Dockerfile.frontend        # Frontend container definition
```

## Key Improvements

### Backend Refactoring

#### 1. **Separation of Concerns**
- **Controllers**: Handle HTTP request/response logic
- **Services**: Implement business logic (MQTT, Socket.IO)
- **Repositories**: Manage data persistence
- **Routes**: Define API endpoints centrally

#### 2. **Modular Architecture**
```javascript
// Before: Everything in server.cjs (340 lines)
// After: Organized into focused modules

// Config
const { PORT, HEARTBEAT_TIMEOUT_MS } = require('./backend/config/constants.cjs');

// Services
const mqttService = new MqttService(db, tapStates, io, lastTelemetry);
const socketHandler = new SocketHandler(io, tapStates, db);

// Controllers
const tapController = new TapController(tapStates, db, io);
const inventoryController = new InventoryController(db);

// Routes
setupRoutes(app, { configController, tapController, inventoryController });
```

#### 3. **Benefits**
- **Testability**: Each module can be tested independently
- **Maintainability**: Clear responsibility for each file
- **Scalability**: Easy to add new features without touching existing code
- **Reusability**: Services and controllers can be reused

### Frontend Refactoring

#### 1. **Component Hierarchy**
```
App.tsx (Main container - 160 lines, down from 665)
├── Sidebar (Navigation)
├── AlertToast (Notifications)
├── SettingsModal (Configuration)
└── Views
    ├── TapsOverview (All taps grid)
    ├── DashboardView (Single tap details)
    ├── InventoryManager (Stock management)
    └── AnalyticsDashboard (Analytics)
```

#### 2. **Custom Hooks**
Extracted state management logic into reusable hooks:

- **useSocketConnection**: Manages WebSocket connection
- **useTapData**: Handles tap state and updates
- **useInventoryData**: Manages inventory data
- **useHistoryData**: Manages history data
- **useAlerts**: Handles alert notifications

#### 3. **Component Design**
- **Common Components**: Reusable UI elements (Sidebar, NavIcon, AlertToast)
- **Domain Components**: Business-specific components (TapCard, DashboardView)
- **Smart vs Presentational**: Separation of logic and presentation

#### 4. **Benefits**
- **Reduced Complexity**: Main App.tsx is now clean and focused
- **Reusability**: Components and hooks can be used across the app
- **Type Safety**: Better TypeScript support with clear interfaces
- **Developer Experience**: Easier to locate and modify features

### Simulator Organization

Moved all simulator code to `simulators/` directory:
- Clean separation from application code
- Easy to find and manage IoT device simulations
- Updated paths in README.md

## Docker Configuration

### Backend Dockerfile
- Multi-stage build for optimized image size
- Persistent database volume
- SQLite CLI included for debugging

### Frontend Dockerfile
- Multi-stage build: Node.js build → Nginx production
- Optimized for production serving
- Environment variable support for backend URL

### Docker Compose
No changes needed - works with new structure due to complete file copying

## Running the Application

### Development Mode

```bash
# Backend
node server.cjs

# Frontend
npm run dev

# Simulator
node simulators/dashboard.cjs --tap=tap-01
```

### Production Mode (Docker)

```bash
# Build all services
docker compose build

# Run all services
docker compose up -d

# Access
# Frontend: http://localhost:8080
# Backend: http://localhost:3001
```

## Migration Guide

If you have existing code that imports from old paths:

### Backend
```javascript
// Old
const db = require('./database.cjs');

// New
const db = require('./backend/repositories/database.cjs');
```

### Frontend
```typescript
// Old
import { BACKEND_URL } from './constants';

// New  
import { BACKEND_URL } from './constants'; // Still works from frontend/src/
```

### Simulators
```bash
# Old
node dashboard.cjs --tap=tap-01

# New
node simulators/dashboard.cjs --tap=tap-01
```

## Code Quality Improvements

1. **Reduced File Sizes**: Main files now under 200 lines
2. **Clear Naming**: Descriptive file and function names
3. **Single Responsibility**: Each file has one clear purpose
4. **Easy Navigation**: Organized folder structure
5. **Better Imports**: Clear dependency graph

## Testing Strategy

The refactored structure supports better testing:

- **Unit Tests**: Test controllers, services independently
- **Integration Tests**: Test API endpoints
- **Component Tests**: Test React components in isolation
- **E2E Tests**: Test full user workflows

## Future Enhancements

The new structure makes these easier to implement:

1. **Authentication Service**: Add to `backend/services/`
2. **API Versioning**: Add `backend/routes/v1/`, `v2/`
3. **Feature Modules**: Group related components/hooks
4. **State Management**: Add Redux/Zustand in `frontend/src/store/`
5. **Middleware**: Add `backend/middleware/` for auth, logging
6. **API Documentation**: Generate from controller annotations

## Backward Compatibility

- Docker Compose configuration unchanged
- Database schema unchanged
- API endpoints unchanged
- MQTT topics unchanged
- Environment variables unchanged

## Summary

The refactoring maintains 100% functional compatibility while significantly improving code organization, maintainability, and developer experience. All existing features work as before, but the codebase is now structured for long-term growth and team collaboration.
