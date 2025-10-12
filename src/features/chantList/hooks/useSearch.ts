import { useState } from 'react'

export const useSearch = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [showSearchBar, setShowSearchBar] = useState(false)

    const handleSearchChange = (term: string) => {
        setSearchTerm(term)
    }

    const toggleSearchBar = () => {
        setShowSearchBar(!showSearchBar)
        if (showSearchBar && searchTerm) {
            setSearchTerm('') // Clear search when hiding
        }
    }

    const hideSearchBar = () => {
        setShowSearchBar(false)
        setSearchTerm('')
    }

    return {
        searchTerm,
        showSearchBar,
        handleSearchChange,
        toggleSearchBar,
        hideSearchBar,
    }
}
