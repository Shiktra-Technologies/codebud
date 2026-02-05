import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import reportWebVitals from './reportWebVitals';

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  // Suppress React development overlay for known benign errors
  if (event.error && event.error.message) {
    console.warn('Global error caught:', event.error.message);
  } else if (event.message) {
    console.warn('Global error caught:', event.message);
  }
  // Prevent the error from showing in the React error overlay in development
  if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT')) {
    event.preventDefault();
  }
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason);
  // Prevent the error from showing in the React error overlay
  event.preventDefault();
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
