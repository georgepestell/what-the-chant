import React from 'react'
import { Box, Divider } from '@mui/material'
import CategoryFilter from './components/CategoryFilter'
import SearchBar from './components/SearchBar'
import ChantSection from './components/ChantSection'
import { useCategoryFilter } from './hooks/useCategoryFilter'
import { useFavorites } from './hooks/useFavorites'
import { useSearch } from './hooks/useSearch'
import { filterChantsByCategory, getFavoriteChants, filterChantsBySearch } from './utils/chantUtils'
import { CATEGORIES, MOCK_CHANTS } from './data/mockData'

const ChantList: React.FC = () => {
    const { selectedCategories, handleCategorySelect } = useCategoryFilter()
    const { favoriteChants, handleToggleFavorite } = useFavorites()
    const { searchTerm, handleSearchChange } = useSearch()

    // Filter by category first, then by search term
    const categoryFilteredChants = filterChantsByCategory(MOCK_CHANTS, selectedCategories)
    const filteredChants = filterChantsBySearch(categoryFilteredChants, searchTerm)
    const favoriteChantsList = getFavoriteChants(MOCK_CHANTS, favoriteChants)

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
            }}
        >
            {/* Favorites Section */}
            {favoriteChantsList.length > 0 && (
                <>
                    <ChantSection
                        title="Favourites"
                        chants={favoriteChantsList}
                        favoriteChants={favoriteChants}
                        onToggleFavorite={handleToggleFavorite}
                    />
                    <Divider sx={{ my: 3 }} />
                </>
            )}

            {/* All Chants Section */}
            <Box sx={{ position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'background.default', padding: '1rem 0' }}>
                <CategoryFilter categories={CATEGORIES} selectedCategories={selectedCategories} onCategorySelect={handleCategorySelect} />
                <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    placeholder="Search chants within selected categories..."
                />
            </Box>
            <ChantSection
                title="All Chants"
                chants={filteredChants}
                favoriteChants={favoriteChants}
                onToggleFavorite={handleToggleFavorite}
                showEmptyMessage={true}
            />
        </Box>
    )
}

export default ChantList
