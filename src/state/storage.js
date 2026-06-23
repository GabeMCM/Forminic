import { STORAGE_KEYS } from './storage.tokens.js';

export const storage = {
  get(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? stored : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors safely
    }
  },
  
  getJSON(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage errors safely
    }
  }
};
