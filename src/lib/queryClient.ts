import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient, type Persister } from '@tanstack/react-query-persist-client'
import { get, set, del } from 'idb-keyval'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            staleTime: 1000 * 60 * 5, // 5 minutes (default, overridden by specific queries)
        },
    },
})

// Create a proper async persister for IndexedDB
const persister: Persister = {
    persistClient: async (client) => {
        await set('REACT_QUERY_OFFLINE_CACHE', client)
    },
    restoreClient: async () => {
        return await get('REACT_QUERY_OFFLINE_CACHE')
    },
    removeClient: async () => {
        await del('REACT_QUERY_OFFLINE_CACHE')
    },
}

// Set up persistence - this starts auto-persisting
persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
})

// Export a promise to restore the cache on startup
export const restoreCachePromise = persister.restoreClient().then((cache) => {
    if (cache) {
        queryClient.setQueryData(['restored'], cache)
    }
})
