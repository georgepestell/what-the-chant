import { useState, useEffect } from 'react'

const FAVORITES_KEY = 'chantList-favorites'

export const useFavorites = (initialFavorites: number[] = []) => {
    const [favoriteChants, setFavoriteChants] = useState<number[]>(() => {
        // Initialize from localStorage or use initialFavorites as fallback
        try {
            const stored = localStorage.getItem(FAVORITES_KEY)
            return stored ? JSON.parse(stored) : initialFavorites
        } catch (error) {
            console.warn('Failed to load favorites from localStorage:', error)
            return initialFavorites
        }
    })

    // Save to localStorage whenever favorites change
    useEffect(() => {
        try {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteChants))
        } catch (error) {
            console.warn('Failed to save favorites to localStorage:', error)
        }
    }, [favoriteChants])

    const handleToggleFavorite = (chantId: number) => {
        setFavoriteChants((prev) => (prev.includes(chantId) ? prev.filter((id) => id !== chantId) : [...prev, chantId]))
    }

    const isFavorite = (chantId: number) => favoriteChants.includes(chantId)

    return {
        favoriteChants,
        handleToggleFavorite,
        isFavorite,
    }
}
