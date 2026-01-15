import { useState, useEffect } from 'react'

const DEBOUNCE_DELAY = 500 // milliseconds

export const useSearch = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [showSearchBar, setShowSearchBar] = useState(false)

    // Debounce the search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, DEBOUNCE_DELAY)

        return () => {
            clearTimeout(timer)
        }
    }, [searchTerm])

    const handleSearchChange = (term: string) => {
        setSearchTerm(term)
    }

    const toggleSearchBar = () => {
        setShowSearchBar(!showSearchBar)
        if (showSearchBar && searchTerm) {
            setSearchTerm('') // Clear search when hiding
            setDebouncedSearchTerm('')
        }
    }

    const hideSearchBar = () => {
        setShowSearchBar(false)
        setSearchTerm('')
        setDebouncedSearchTerm('')
    }

    return {
        searchTerm,
        debouncedSearchTerm,
        showSearchBar,
        handleSearchChange,
        toggleSearchBar,
        hideSearchBar,
    }
}
