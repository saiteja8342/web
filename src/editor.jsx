import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import EditorDashboard from './pages/EditorDashboard.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EditorDashboard />
  </StrictMode>,
);
