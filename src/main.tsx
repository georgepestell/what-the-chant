import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient, restoreCachePromise } from './lib/queryClient'

// Wait for cache to restore before rendering, but don't block on errors
restoreCachePromise
    .catch((error) => {
        console.warn('Failed to restore query cache from IndexedDB:', error)
    })
    .finally(() => {
        createRoot(document.getElementById('root')!).render(
            <StrictMode>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </QueryClientProvider>
            </StrictMode>,
        )
    })
