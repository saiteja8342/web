import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AboutPage from './pages/AboutPage.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AboutPage />
    </ErrorBoundary>
  </StrictMode>,
);
