import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AdminLoginPage from './pages/AdminLoginPage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminLoginPage />
  </StrictMode>,
);
