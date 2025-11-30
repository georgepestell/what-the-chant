import type { Chant } from '../types'

// Get favorite chants by id
export const getFavoriteChants = (chants: Chant[], favoriteIds: number[]): Chant[] => {
    return chants.filter((chant) => favoriteIds.includes(chant.id))
}

// Simple fuzzy search implementation
export const fuzzySearch = (text: string, searchTerm: string): boolean => {
    if (!searchTerm.trim()) return true

    const textLower = text.toLowerCase()
    const searchLower = searchTerm.toLowerCase().trim()

    // Exact match or substring match
    if (textLower.includes(searchLower)) return true

    // Fuzzy match - check if all characters of search term appear in order
    let searchIndex = 0
    for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
        if (textLower[i] === searchLower[searchIndex]) {
            searchIndex++
        }
    }
    return searchIndex === searchLower.length
}

export const filterChantsBySearch = (chants: Chant[], searchTerm: string): Chant[] => {
    if (!searchTerm.trim()) return chants
    return chants.filter((chant) => fuzzySearch(chant.text, searchTerm))
}
