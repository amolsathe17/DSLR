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
