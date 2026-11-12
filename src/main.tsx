import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './styles.css';
import App from './App';
import { initPwa } from './pwa/init';

const container = document.getElementById('root');
if (!container) throw new Error('Root element missing');

// Register the generated service worker (no-op during unit tests).
initPwa();

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
