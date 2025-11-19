import { Tap, BeerType } from '../types';

// Beer density approx 1.03 kg/L
const BEER_DENSITY = 1.03; 
const KEG_50L_TARE = 13.5; // Standard stainless steel 50L keg tare
const KEG_30L_TARE = 9.0;  // Standard stainless steel 30L keg tare

// Initial Mock Data
export const INITIAL_TAPS: Tap[] = [
  {
    id: 'tap-001',
    name: 'Tap 1 (Main Bar)',
    beerName: 'Cosmic IPA',
    beerType: BeerType.IPA,
    kegSizeLiters: 50,
    currentLevelLiters: 42.5,
    totalConsumedLiters: 1205,
    temperature: 4.2,
    cellarTemp: 11.2,
    isFlowing: false,
    lastKegSwap: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'active',
    pricePerPint: 6.50,
    costPerKeg: 120,
    spareKegs: 2,
    kegWeightEmpty: KEG_50L_TARE,
    kegWeightCurrent: KEG_50L_TARE + (42.5 * BEER_DENSITY),
    kegs: [
      { sizeLiters: 50, weightEmpty: KEG_50L_TARE, weightCurrent: KEG_50L_TARE + (42.5 * BEER_DENSITY), status: 'active' },
      { sizeLiters: 50, weightEmpty: KEG_50L_TARE, weightCurrent: KEG_50L_TARE + (50 * BEER_DENSITY), status: 'reserve' },
      { sizeLiters: 50, weightEmpty: KEG_50L_TARE, weightCurrent: KEG_50L_TARE + (50 * BEER_DENSITY), status: 'reserve' }
    ]
  },
  {
    id: 'tap-002',
    name: 'Tap 2 (Main Bar)',
    beerName: 'Midnight Stout',
    beerType: BeerType.STOUT,
    kegSizeLiters: 30,
    currentLevelLiters: 5.2, // Low!
    totalConsumedLiters: 850,
    temperature: 6.5,
    cellarTemp: 11.5,
    isFlowing: false,
    lastKegSwap: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'active',
    pricePerPint: 7.00,
    costPerKeg: 140,
    spareKegs: 0, // No backup!
    kegWeightEmpty: KEG_30L_TARE,
    kegWeightCurrent: KEG_30L_TARE + (5.2 * BEER_DENSITY),
    kegs: [
      { sizeLiters: 30, weightEmpty: KEG_30L_TARE, weightCurrent: KEG_30L_TARE + (5.2 * BEER_DENSITY), status: 'active' }
    ]
  },
  {
    id: 'tap-003',
    name: 'Tap 3 (Garden)',
    beerName: 'Summer Lager',
    beerType: BeerType.LAGER,
    kegSizeLiters: 50,
    currentLevelLiters: 48.0,
    totalConsumedLiters: 2100,
    temperature: 3.8,
    cellarTemp: 10.8,
    isFlowing: false,
    lastKegSwap: new Date().toISOString(),
    status: 'active',
    pricePerPint: 5.50,
    costPerKeg: 100,
    spareKegs: 3,
    kegWeightEmpty: KEG_50L_TARE,
    kegWeightCurrent: KEG_50L_TARE + (48.0 * BEER_DENSITY),
    kegs: [
      { sizeLiters: 50, weightEmpty: KEG_50L_TARE, weightCurrent: KEG_50L_TARE + (48.0 * BEER_DENSITY), status: 'active' },
      { sizeLiters: 50, weightEmpty: KEG_50L_TARE, weightCurrent: KEG_50L_TARE + (50 * BEER_DENSITY), status: 'reserve' },
      { sizeLiters: 50, weightEmpty: KEG_50L_TARE, weightCurrent: KEG_50L_TARE + (50 * BEER_DENSITY), status: 'reserve' },
      { sizeLiters: 50, weightEmpty: KEG_50L_TARE, weightCurrent: KEG_50L_TARE + (50 * BEER_DENSITY), status: 'reserve' }
    ]
  },
  {
    id: 'tap-004',
    name: 'Tap 4 (Garden)',
    beerName: 'Golden Ale',
    beerType: BeerType.ALE,
    kegSizeLiters: 50,
    currentLevelLiters: 0.5, // Critical
    totalConsumedLiters: 150,
    temperature: 4.5,
    cellarTemp: 11.0,
    isFlowing: false,
    lastKegSwap: new Date(Date.now() - 86400000 * 10).toISOString(),
    status: 'active',
    pricePerPint: 6.00,
    costPerKeg: 110,
    spareKegs: 1,
    kegWeightEmpty: KEG_50L_TARE,
    kegWeightCurrent: KEG_50L_TARE + (0.5 * BEER_DENSITY),
    kegs: [
      { sizeLiters: 50, weightEmpty: KEG_50L_TARE, weightCurrent: KEG_50L_TARE + (0.5 * BEER_DENSITY), status: 'active' },
      { sizeLiters: 50, weightEmpty: KEG_50L_TARE, weightCurrent: KEG_50L_TARE + (50 * BEER_DENSITY), status: 'reserve' }
    ]
  }
];

// Simulation Logic
export const simulateFlow = (taps: Tap[]): Tap[] => {
  return taps.map(tap => {
    // Random chance for a tap to be "pouring" right now
    const isPouring = Math.random() > 0.7; 
    let flowAmount = 0;
    
    if (isPouring && tap.status === 'active') {
      // Pour between 0.05 and 0.2 liters (approx a sip to a good gulp per tick)
      flowAmount = 0.05 + Math.random() * 0.15;
    }

    let newLevel = tap.currentLevelLiters - flowAmount;
    let newStatus = tap.status;
    let lastSwap = tap.lastKegSwap;
    let spareKegs = tap.spareKegs;

    // Auto-Swap Logic (The Valve Box Simulation)
    if (newLevel <= 0) {
      if (tap.status !== 'changing') {
        // Start Swap
        newStatus = 'changing';
        newLevel = 0;
      } else {
        // Simulate swap delay (randomly finishes)
        if (Math.random() > 0.5) {
          if (spareKegs > 0) {
            newStatus = 'active';
            newLevel = tap.kegSizeLiters; // Fresh Keg
            lastSwap = new Date().toISOString();
            spareKegs = spareKegs - 1;
          } else {
            newStatus = 'empty'; // No spares left
          }
        }
      }
    } else if (newLevel < tap.kegSizeLiters && tap.status === 'changing' && spareKegs > 0) {
        // Recovery
        newStatus = 'active';
    }

    // Temperature fluctuation
    const tempFluctuation = (Math.random() - 0.5) * 0.1;
    // Cellar temp drift (slower)
    const cellarFluctuation = (Math.random() - 0.5) * 0.02;

    // Recalculate Weight and, if present, decrement the active keg's weight
    let newWeight = tap.kegWeightEmpty + (Math.max(0, newLevel) * BEER_DENSITY);
    let newKegs = (tap as any).kegs ? [...(tap as any).kegs] : undefined;
    if (newKegs && newKegs.length) {
      const activeIdx = newKegs.findIndex((k: any) => k.status === 'active');
      const targetIdx = activeIdx >= 0 ? activeIdx : 0;
      const kgConsumed = flowAmount * BEER_DENSITY;
      const updatedKeg = { ...newKegs[targetIdx] };
      updatedKeg.weightCurrent = Number(Math.max(updatedKeg.weightEmpty, (updatedKeg.weightCurrent - kgConsumed)).toFixed(2));
      const implied = (updatedKeg.weightCurrent - updatedKeg.weightEmpty) / BEER_DENSITY;
      if (implied <= 0.01) updatedKeg.status = 'empty';
      newKegs[targetIdx] = updatedKeg;
      newWeight = updatedKeg.weightCurrent;
    }

    // Auto-swap: if active keg is empty and reserves exist, promote next reserve
    if (newKegs && newKegs.length) {
      const activeIdx = newKegs.findIndex((k: any) => k.status === 'active');
      const active = activeIdx >= 0 ? newKegs[activeIdx] : null;
      if (active && ((active.weightCurrent - active.weightEmpty) / BEER_DENSITY) <= 0.1) {
        if (spareKegs > 0) {
          const nextReserve = newKegs.findIndex((k: any) => k.status === 'reserve');
          if (nextReserve >= 0) {
            newKegs[nextReserve] = { ...newKegs[nextReserve], status: 'active' };
            newKegs[activeIdx] = { ...newKegs[activeIdx], status: 'empty' };
            spareKegs = Math.max(0, spareKegs - 1);
            newStatus = 'active';
            lastSwap = new Date().toISOString();
          } else {
            newStatus = 'empty';
          }
        } else {
          newStatus = 'empty';
        }
      }
    }

    const result: any = {
      ...tap,
      currentLevelLiters: Math.max(0, newLevel),
      totalConsumedLiters: tap.totalConsumedLiters + flowAmount,
      isFlowing: isPouring,
      temperature: Number((tap.temperature + tempFluctuation).toFixed(1)),
      cellarTemp: Number((tap.cellarTemp + cellarFluctuation).toFixed(1)),
      status: newStatus,
      lastKegSwap: lastSwap,
      spareKegs: spareKegs,
      kegWeightCurrent: Number(newWeight.toFixed(2))
    };

    if (newKegs) result.kegs = newKegs;

    return result;
  });
};

export const getTrendData = (period: 'day' | 'week' | 'month' | 'year') => {
    // Mock generator based on period
    if (period === 'day') {
        return [
            { time: '12pm', usage: 45 }, { time: '2pm', usage: 30 }, { time: '4pm', usage: 85 },
            { time: '6pm', usage: 120 }, { time: '8pm', usage: 150 }, { time: '10pm', usage: 90 },
        ];
    }
    if (period === 'week') {
        return [
            { time: 'Mon', usage: 320 }, { time: 'Tue', usage: 280 }, { time: 'Wed', usage: 450 },
            { time: 'Thu', usage: 520 }, { time: 'Fri', usage: 890 }, { time: 'Sat', usage: 950 }, { time: 'Sun', usage: 600 },
        ];
    }
    if (period === 'month') {
        return [
            { time: 'Week 1', usage: 2400 }, { time: 'Week 2', usage: 2100 }, 
            { time: 'Week 3', usage: 2800 }, { time: 'Week 4', usage: 3100 },
        ];
    }
    // Year
    return [
        { time: 'Jan', usage: 8500 }, { time: 'Feb', usage: 7200 }, { time: 'Mar', usage: 9100 },
        { time: 'Apr', usage: 8800 }, { time: 'May', usage: 9500 }, { time: 'Jun', usage: 10200 },
        { time: 'Jul', usage: 11500 }, { time: 'Aug', usage: 11000 }, { time: 'Sep', usage: 9800 },
        { time: 'Oct', usage: 9200 }, { time: 'Nov', usage: 8500 }, { time: 'Dec', usage: 12000 },
    ];
};