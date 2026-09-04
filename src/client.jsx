import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ClientDashboard from './pages/ClientDashboard.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ClientDashboard />
    </ErrorBoundary>
  </StrictMode>,
);
