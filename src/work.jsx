import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import WorkPage from './pages/WorkPage.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <WorkPage />
    </ErrorBoundary>
  </StrictMode>,
);
