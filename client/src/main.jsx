// Safely wrap localStorage to prevent crashes when tracking prevention is active
try {
  const testKey = '__storage_test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch (e) {
  console.warn("Storage access is blocked by browser tracking prevention. Initializing safe in-memory fallback storage.");
  const mockStorage = {
    _data: {},
    setItem(id, val) { this._data[id] = String(val); },
    getItem(id) { return this._data.hasOwnProperty(id) ? this._data[id] : null; },
    removeItem(id) { delete this._data[id]; },
    clear() { this._data = {}; },
    key(i) { return Object.keys(this._data)[i] || null; },
    get length() { return Object.keys(this._data).length; }
  };
  try {
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true
    });
  } catch (err) {
    console.error("Failed to redefine localStorage:", err);
  }
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Auto-reload the page if a dynamic import fails (e.g., when new builds update asset hashes)
window.addEventListener('vite:preloadError', (event) => {
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
