import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import TermsPage from './pages/TermsPage.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <TermsPage />
    </ErrorBoundary>
  </StrictMode>,
);
