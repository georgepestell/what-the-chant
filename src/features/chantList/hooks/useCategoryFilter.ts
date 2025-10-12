import { useState } from 'react'
import type { CategoryFilter } from '../types'

export const useCategoryFilter = (initialCategories: CategoryFilter = ['All']) => {
    const [selectedCategories, setSelectedCategories] = useState<CategoryFilter>(initialCategories)

    const handleCategorySelect = (category: string) => {
        if (category === 'All') {
            setSelectedCategories(['All'])
        } else {
            setSelectedCategories((prev) => {
                const newCategories = prev.includes(category)
                    ? prev.filter((c) => c !== category)
                    : [...prev.filter((c) => c !== 'All'), category]
                return newCategories.length === 0 ? ['All'] : newCategories
            })
        }
    }

    return {
        selectedCategories,
        handleCategorySelect,
    }
}
