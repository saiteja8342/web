import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ClientDashboard from './pages/ClientDashboard.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClientDashboard />
  </StrictMode>,
);
