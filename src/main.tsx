import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import { AuthProvider } from '@/features/auth';
import '@/features/auth/auth.css';
import { ConfirmacaoProvider } from '@/shared/hooks/useConfirmacao';
import '@/shared/shared.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ConfirmacaoProvider>
        <App />
      </ConfirmacaoProvider>
    </AuthProvider>
  </React.StrictMode>,
);
