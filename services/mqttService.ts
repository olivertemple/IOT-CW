import mqtt from 'mqtt';
import { Tap, IoTUpdatePayload, Keg } from '../types';

// Beer density constant to calculate liters from weight
const BEER_DENSITY = 1.03; 
// Updated pattern to catch sub-topics: taps/{tapId}/{deviceType}
// Example: taps/tap-001/flow, taps/tap-001/keg, taps/tap-001/valve
const TOPIC_PATTERN = 'taps/+/+'; 

export class MqttService {
  client: mqtt.MqttClient | null = null;
  onMessageCallback: ((tapId: string, data: Partial<IoTUpdatePayload>) => void) | null = null;
  onStatusChange: ((isConnected: boolean) => void) | null = null;

  connect(brokerUrl: string, onMessage: (tapId: string, data: Partial<IoTUpdatePayload>) => void, onStatus: (s: boolean) => void) {
    this.onMessageCallback = onMessage;
    this.onStatusChange = onStatus;

    console.log(`Connecting to MQTT Broker: ${brokerUrl}`);
    
    // Determine protocol based on URL or default to WS for browsers
    this.client = mqtt.connect(brokerUrl, {
      keepalive: 30,
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
    });

    this.client.on('connect', () => {
      console.log('MQTT Connected');
      this.onStatusChange?.(true);
      
      // Subscribe to wildcard topic for all taps and all sub-devices
      this.client?.subscribe(TOPIC_PATTERN, (err) => {
        if (err) {
          console.error('Subscription error:', err);
        } else {
          console.log(`Subscribed to ${TOPIC_PATTERN}`);
        }
      });
    });

    this.client.on('error', (err) => {
      console.error('MQTT Error:', err);
      this.onStatusChange?.(false);
    });

    this.client.on('offline', () => {
      console.log('MQTT Offline');
      this.onStatusChange?.(false);
    });

    this.client.on('message', (topic, message) => {
      try {
        // Parse Topic Structure: taps/{tapId}/{deviceType}
        // e.g. taps/tap-001/flow
        const parts = topic.split('/');
        if (parts.length >= 3) {
           const tapId = parts[1]; 
           const deviceType = parts[2]; // 'flow', 'keg', 'valve', or 'update' (legacy)
           
           const payloadString = message.toString();
           const rawData = JSON.parse(payloadString);
           
           // Normalize payload based on device type
           const normalizedPayload: Partial<IoTUpdatePayload> = {};

           if (deviceType === 'flow') {
             normalizedPayload.flowRate = rawData.flowRate;
             normalizedPayload.totalPoured = rawData.totalPoured;
           } else if (deviceType === 'keg') {
             normalizedPayload.kegWeight = rawData.weight; // Map 'weight' to 'kegWeight'
             normalizedPayload.beerTemp = rawData.temp;
             normalizedPayload.cellarTemp = rawData.cellarTemp;
           } else if (deviceType === 'valve') {
             normalizedPayload.valveStatus = rawData.status;
             // Valve might report active keg index or spares count
           } else {
             // Legacy/Full update
             Object.assign(normalizedPayload, rawData);
           }
           
           if (this.onMessageCallback) {
             this.onMessageCallback(tapId, normalizedPayload);
           }
        }
      } catch (e) {
        console.error('Failed to parse MQTT message', e);
      }
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }
}

export const mqttService = new MqttService();

// Helper to merge incoming MQTT data with existing Tap state
export const mergeMqttData = (currentTap: Tap, payload: Partial<IoTUpdatePayload>): Tap => {
  const updates: Partial<Tap> = {};

  // If this Tap contains a `kegs` array, prefer updating individual keg entries.
  const hasKegs = Array.isArray((currentTap as any).kegs);

  // 1. Handle Keg/Weight Updates (support per-keg index)
  if (payload.kegWeight !== undefined) {
    // Default target keg index: explicit `kegIndex` -> `activeKegIndex` -> first active -> 0
    let targetIndex = payload.kegIndex ?? payload.activeKegIndex;
    if (hasKegs) {
      const kegs: Keg[] = (currentTap as any).kegs;
      if (targetIndex === undefined || targetIndex === null) {
        const active = kegs.findIndex(k => k.status === 'active');
        targetIndex = active >= 0 ? active : 0;
      }

      // Ensure target exists
      if (kegs[targetIndex]) {
        const keg = { ...kegs[targetIndex], weightCurrent: payload.kegWeight } as Keg;
        // Determine implied liters for that keg
        const netWeight = Math.max(0, keg.weightCurrent - keg.weightEmpty);
        const impliedLiters = Number((netWeight / BEER_DENSITY).toFixed(1));

        // Update keg status if empty
        if (impliedLiters <= 0.5) keg.status = 'empty';

        // Patch the kegs array
        const newKegs = [...kegs];
        newKegs[targetIndex] = keg;
        (updates as any).kegs = newKegs;

        // If this keg is the active one, keep top-level compatibility fields in sync
        const activeIdx = payload.activeKegIndex ?? kegs.findIndex(k => k.status === 'active');
        if (activeIdx === targetIndex) {
          updates.kegWeightCurrent = keg.weightCurrent;
          updates.kegWeightEmpty = keg.weightEmpty;
          updates.currentLevelLiters = impliedLiters;
        }
      }
    } else {
      // No kegs array: legacy behaviour
      updates.kegWeightCurrent = payload.kegWeight;
      const netWeight = Math.max(0, payload.kegWeight - currentTap.kegWeightEmpty);
      updates.currentLevelLiters = Number((netWeight / BEER_DENSITY).toFixed(1));
    }
  }

  // 2. Handle Flow Updates
  if (payload.flowRate !== undefined) {
    updates.isFlowing = payload.flowRate > 0;
  }
  if (payload.totalPoured !== undefined) {
    updates.totalConsumedLiters = payload.totalPoured;
  }

  // 3. Handle Temperature Updates
  if (payload.beerTemp !== undefined) updates.temperature = payload.beerTemp;
  if (payload.cellarTemp !== undefined) updates.cellarTemp = payload.cellarTemp;

  // 4. Handle Valve/Status Updates
  if (payload.valveStatus) {
    if (payload.valveStatus === 'swapping') {
      updates.status = 'changing';
    } else if (payload.valveStatus === 'closed' && (updates.currentLevelLiters || currentTap.currentLevelLiters) <= 0.5) {
      updates.status = 'empty';
    } else if ((updates.currentLevelLiters || currentTap.currentLevelLiters) > 0.5 && currentTap.status === 'empty') {
      updates.status = 'active';
    }
  }

  // 5. Handle valve metadata: activeKegIndex and spareKegs
  if (payload.activeKegIndex !== undefined && hasKegs) {
    const kegs: Keg[] = (currentTap as any).kegs;
    const newKegs = kegs.map((k, i) => ({ ...k, status: i === payload.activeKegIndex ? 'active' : (k.status === 'empty' ? 'empty' : 'reserve') }));
    (updates as any).kegs = newKegs;

    // Sync top-level fields to the newly active keg
    const active = newKegs[payload.activeKegIndex];
    if (active) {
      updates.kegWeightCurrent = active.weightCurrent;
      updates.kegWeightEmpty = active.weightEmpty;
      const net = Math.max(0, active.weightCurrent - active.weightEmpty);
      updates.currentLevelLiters = Number((net / BEER_DENSITY).toFixed(1));
    }
  }

  if (payload.spareKegs !== undefined) {
    updates.spareKegs = payload.spareKegs;
  }

  return { ...currentTap, ...updates };
};