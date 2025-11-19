export enum BeerType {
  IPA = 'IPA',
  STOUT = 'Stout',
  LAGER = 'Lager',
  ALE = 'Ale',
  PILS = 'Pilsner',
  CIDER = 'Cider'
}

// The full application state for a Tap
export interface Tap {
  id: string;
  name: string;
  beerName: string;
  beerType: BeerType;
  kegSizeLiters: number;
  currentLevelLiters: number;
  totalConsumedLiters: number;
  temperature: number; // Celsius (Product Temp)
  isFlowing: boolean;
  lastKegSwap: string; // ISO Date
  status: 'active' | 'changing' | 'empty' | 'maintenance';
  
  // New fields for details view
  pricePerPint: number;
  costPerKeg: number;
  spareKegs: number; // Number of full kegs connected in the valve chain
  
  // Physical & Environmental
  kegWeightCurrent: number; // kg
  kegWeightEmpty: number;   // kg (Tare)
  cellarTemp: number;       // Celsius (Ambient)
}

// Represents an individual keg in a valve chain (active + reserves)
export interface Keg {
  id?: string;
  sizeLiters: number;
  weightCurrent: number; // kg (raw scale)
  weightEmpty: number;   // kg (tare)
  status: 'active' | 'reserve' | 'empty';
}

// Backwards-compat: Tap now also keeps a `kegs` array so the UI and services
// can work with individual keg metadata. Existing top-level weight fields are
// retained for compatibility and kept in sync by the service layer.
export interface TapWithKegs extends Tap {
  kegs: Keg[];
}

// The Payload expected from the IoT Device over MQTT
// Topic: taps/{tapId}/update
export interface IoTUpdatePayload {
  flowRate?: number;       // L/min (if > 0, isFlowing = true)
  totalPoured?: number;    // L (Session total)
  kegWeight?: number;      // kg (Raw scale reading)
  beerTemp?: number;       // Celsius
  cellarTemp?: number;     // Celsius
  valveStatus?: 'open' | 'closed' | 'swapping';
  // Optional metadata to indicate which keg is being reported (index in the `kegs` array)
  activeKegIndex?: number;
  kegIndex?: number;
  // Valve may report number of spare kegs available
  spareKegs?: number;
}

export interface ConsumptionDataPoint {
  time: string;
  usage: number; // Amount poured in this interval
}

export interface BeerStats {
  beerName: string;
  totalPintsSold: number;
  revenue: number;
  trend: 'up' | 'down' | 'stable';
}

export interface GeminiRecommendation {
  summary: string;
  orderList: string[];
  trendAnalysis: string;
}