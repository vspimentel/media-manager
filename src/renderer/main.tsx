import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';
import './css/index.css';

createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);