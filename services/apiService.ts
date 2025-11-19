
import { Tap } from '../types';

// Use 127.0.0.1 to avoid Node 17+ localhost IPv6 resolution issues
const API_URL = 'http://127.0.0.1:3002/api';

export const apiService = {
  // Fetch configured taps from DB
  async getTaps(): Promise<Tap[]> {
    try {
      const res = await fetch(`${API_URL}/taps`);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      console.debug('apiService.getTaps ->', data);
      return data;
    } catch (error) {
      // Re-throw to let App.tsx handle the fallback logic
      throw error;
    }
  },

  // Save a new tap configuration
  async saveTap(tap: Tap): Promise<void> {
    try {
      await fetch(`${API_URL}/taps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tap)
      });
    } catch (error) {
      console.error("Failed to save tap:", error);
      throw error;
    }
  },

  async deleteTap(id: string): Promise<void> {
    try {
      await fetch(`${API_URL}/taps/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete tap:', error);
      throw error;
    }
  },

  // Fetch history for charts
  async getHistory(period: string): Promise<{time: string, usage: number}[]> {
    try {
        const res = await fetch(`${API_URL}/history?period=${period}`);
        if (!res.ok) throw new Error('Failed to fetch history');
        return await res.json();
    } catch (error) {
        console.warn("API unavailable for history");
        return [];
    }
  }
};
