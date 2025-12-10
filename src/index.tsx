import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';
import { AppProvider } from './contexts/AppContext';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
