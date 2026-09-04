import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import EditorDashboard from './pages/EditorDashboard.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <EditorDashboard />
    </ErrorBoundary>
  </StrictMode>,
);
