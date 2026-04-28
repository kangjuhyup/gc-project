import { StrictMode } from 'react';
import { Logging } from '@kangjuhyup/rvlog-react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/app/App';
import { AppProviders } from '@/app/AppProviders';
import { AuthProvider } from '@/features/auth/AuthProvider';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Logging component="App">
      <AppProviders>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </AppProviders>
    </Logging>
  </StrictMode>,
);
