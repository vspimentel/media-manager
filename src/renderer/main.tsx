import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import React from 'react';
import { HashRouter } from "react-router";
import './css/index.css';
import { AppContextProvider } from '#contexts/app-context';

const queryClient = new QueryClient();

createRoot(document.getElementById('root') as HTMLElement).render(
    <QueryClientProvider client={queryClient}>
        <AppContextProvider>
            <React.StrictMode>
                <HashRouter>
                    <App />
                </HashRouter>
            </React.StrictMode>
        </AppContextProvider>
    </QueryClientProvider>
);