import React, { useState } from 'react'
import { Chip, Box, Button } from '@mui/material'
import { ExpandMore, ExpandLess } from '@mui/icons-material'

interface CategoryFilterProps {
    categories: string[]
    selectedCategories: string[]
    onCategorySelect: (category: string) => void
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, selectedCategories, onCategorySelect }) => {
    const [showAll, setShowAll] = useState(false)

    // Sort categories: selected ones first, then alphabetically
    const sortedCategories = React.useMemo(() => {
        const selected = categories.filter((cat) => selectedCategories.includes(cat))
        const unselected = categories.filter((cat) => !selectedCategories.includes(cat)).sort()
        return [...selected, ...unselected]
    }, [categories, selectedCategories])

    // Show only first line of categories when collapsed (approximately 3-4 categories for one row)
    const displayedCategories = showAll ? sortedCategories : sortedCategories.slice(0, 4)

    return (
        <Box mb={2}>
            <Box
                display="flex"
                gap={1}
                flexWrap="wrap"
                mb={1}
                sx={{
                    // Limit height to approximately one row when collapsed
                    maxHeight: showAll ? 'none' : '40px',
                    overflow: 'hidden',
                }}
            >
                {displayedCategories.map((category) => (
                    <Chip
                        key={category}
                        label={category}
                        color={selectedCategories.includes(category) ? 'primary' : 'default'}
                        onClick={() => onCategorySelect(category)}
                    />
                ))}
            </Box>
            {categories.length > 4 && (
                <Button
                    style={{ color: '#000000' }}
                    size="small"
                    onClick={() => setShowAll(!showAll)}
                    startIcon={showAll ? <ExpandLess /> : <ExpandMore />}
                    sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                >
                    {showAll ? 'Show Less' : `Show All (${categories.length - 4} more)`}
                </Button>
            )}
        </Box>
    )
}

export default CategoryFilter
