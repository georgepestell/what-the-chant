import { useState } from 'react'

export const useSearch = () => {
    const [searchTerm, setSearchTerm] = useState('')

    const handleSearchChange = (term: string) => {
        setSearchTerm(term)
    }

    return {
        searchTerm,
        handleSearchChange,
    }
}
