
# SmartTap IoT Deployment Guide

This guide details how to set up the SmartTap system locally, including the MQTT Broker, Data Persistence (Backend), and the specifications for the IoT devices.

## 1. System Architecture

The system consists of three layers:
1.  **IoT Layer:** 3 separate devices per tap (Flowmeter, Scale/Temp, Valve Controller) publishing to MQTT.
2.  **Message Layer:** An MQTT Broker (Mosquitto) handling communication.
3.  **Application Layer:**
    *   **Frontend:** React Dashboard (Visualizes live data).
    *   **Backend:** Node.js Express server + SQLite (Logs data, serves history, persists configuration).

---

## 2. Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Mosquitto MQTT Broker

### Step 1: Install Dependencies
Navigate to the project root and install the required packages for the backend:

```bash
npm install express sqlite3 mqtt cors
```

### Step 2: Configure MQTT Broker (Mosquitto)
The backend uses TCP (port 1883) and the Frontend uses WebSockets (port 9001).

Create `mosquitto.conf`:
```conf
# Standard MQTT for IoT Devices & Backend
listener 1883
protocol mqtt
allow_anonymous true

# WebSockets for React Dashboard (Live View)
listener 9001
protocol websockets
allow_anonymous true
```
Run broker: `mosquitto -c mosquitto.conf`

### Step 3: Start the System

**Terminal 1: Backend (Data Logger & API)**
```bash
node server.js
```
*   Starts API on `http://localhost:3002`
*   Creates/Connects to `smarttap.db` (SQLite)
*   Connects to MQTT (TCP 1883) to log events

**Terminal 2: Frontend (Dashboard)**
```bash
npm run dev
```
*   Opens Dashboard on `http://localhost:3000`
*   It will auto-connect to the Backend API to load Tap Configurations.
*   Go to Settings -> Configure Broker to `ws://localhost:9001` for live animations.

---

## 3. Database Schema (SQLite)

The `server.js` automatically creates the database `smarttap.db` with the following schema:

**Table: `taps`**
Persists the configuration created in the "Stock" page.
*   `id` (TEXT PK)
*   `name`, `beer_name`, `beer_type`
*   `keg_size_liters`, `spare_kegs`
*   `price_per_pint`, `cost_per_keg`

**Table: `events`**
Logs every valid MQTT message for historical analysis.
*   `id` (INT PK)
*   `tap_id` (TEXT)
*   `device_type` (TEXT): 'flow', 'keg', 'valve'
*   `payload` (TEXT): The raw JSON string
*   `recorded_at`: Timestamp

---

## 4. IoT Device Specifications

Each "Tap" in the real world is a collection of 3 devices. They should publish to topics using the Tap ID defined in the Dashboard Stock page (e.g., `tap-001`).

### Device A: The Flow Meter (Tap Handle)
*   **Function:** Detects pouring.
*   **Topic:** `taps/{tap_id}/flow`
*   **Payload (JSON):**
    ```json
    {
      "flowRate": 0.8,        // Float (Liters/min). > 0 triggers animation.
      "totalPoured": 1450.5   // Float (Liters). Lifetime counter or Session counter.
    }
    ```

### Device B: The Keg Sensor (Base/Scale)
*   **Function:** Measures weight and temperature.
*   **Topic:** `taps/{tap_id}/keg`
*   **Payload (JSON):**
    ```json
    {
      "weight": 63.5,         // Float (kg). Raw scale reading (recommended key name: "weight").
      "temp": 3.8,            // Float (Celsius). Liquid/Probe temperature.
      "cellarTemp": 11.2,     // Float (Celsius). Ambient air temperature.
      "kegIndex": 0           // OPTIONAL Int: index of the keg this scale is under (0 = active, 1..n = reserves)
    }
    ```

    Notes:
    - The service normalizes `weight` -> `kegWeight` internally. If your device publishes `kegWeight` directly, that is accepted too.
    - Include `kegIndex` when your installation has multiple keg inputs per tap (scale per reserve), otherwise the system will assume the reading applies to the active keg.
    - All fields are optional; publish only what has changed. Units: weight in kg, temps in °C.

### Device C: The Valve Controller (Wall Box)
*   **Function:** Swaps keg lines and reports status.
*   **Topic:** `taps/{tap_id}/valve`
*   **Payload (JSON):**
    ```json
    {
      "status": "active",       // String: "open" | "closed" | "swapping"
      "activeKegIndex": 1,        // OPTIONAL Int: Which input line is currently open (0 = active)
      "spareKegs": 2              // OPTIONAL Int: How many full/reserve kegs are detected in the chain
    }
    ```

    Notes:
    - The server will use `activeKegIndex` to mark which keg entry in the Tap's `kegs` array is `active` and will sync top-level tap fields to that keg.
    - Provide `spareKegs` to update the UI spare-count; this is optional if the backend can infer reserves from configuration.
    - `status` values are normalized; `swapping` maps to the UI's `changing` state.

---

### Device: Full/Legacy Update (optional)
If a device publishes a full/legacy update to `taps/{tap_id}/update` or the service receives a JSON with many keys, the backend will accept it. Example:

```json
{
  "flowRate": 0.5,
  "totalPoured": 123.4,
  "kegWeight": 63.5,
  "beerTemp": 3.8,
  "cellarTemp": 11.2,
  "activeKegIndex": 0,
  "spareKegs": 2
}
```

Backward compatibility:
- Existing devices that continue to publish the older keys (`weight`, `temp`, `sparesRemaining`, etc.) will continue to work — the service normalizes common names.
- New optional fields to prefer: `kegIndex` (or `activeKegIndex`) and `spareKegs` to enable per-keg tracking.
