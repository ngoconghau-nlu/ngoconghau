import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for offline caching and instant updates
registerSW({
  immediate: true,
  onNeedRefresh() {
    // Automatically reload to get the latest version if needed
  },
  onOfflineReady() {
    console.log('[PWA] Ứng dụng đã sẵn sàng hoạt động ngoại tuyến (Offline ready)');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
