import { useState } from 'react'

export const useCategoryFilter = (initialCategories: number[] = []) => {
    const [selectedCategories, setSelectedCategories] = useState<number[]>(initialCategories)

    const handleCategorySelect = (categoryId: number) => {
        setSelectedCategories((prev) => {
            const newCategories = prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
            return newCategories
        })
    }

    return {
        selectedCategories,
        handleCategorySelect,
    }
}
