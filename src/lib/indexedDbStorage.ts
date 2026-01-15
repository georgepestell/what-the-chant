import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface ChantsDB extends DBSchema {
    queryCache: {
        key: string
        value: {
            state: {
                data: unknown
                dataUpdatedAt: number
            }
        }
    }
}

const DB_NAME = 'chants-query-cache'
const STORE_NAME = 'queryCache'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<ChantsDB>> | null = null

const getDB = () => {
    if (!dbPromise) {
        dbPromise = openDB<ChantsDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME)
                }
            },
        })
    }
    return dbPromise
}

export const indexedDbStorage = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            const db = await getDB()
            const value = await db.get(STORE_NAME, key)
            return value ? JSON.stringify(value) : null
        } catch (error) {
            console.error('IndexedDB getItem error:', error)
            return null
        }
    },
    setItem: async (key: string, value: string): Promise<void> => {
        try {
            const db = await getDB()
            await db.put(STORE_NAME, JSON.parse(value), key)
        } catch (error) {
            console.error('IndexedDB setItem error:', error)
        }
    },
    removeItem: async (key: string): Promise<void> => {
        try {
            const db = await getDB()
            await db.delete(STORE_NAME, key)
        } catch (error) {
            console.error('IndexedDB removeItem error:', error)
        }
    },
}
