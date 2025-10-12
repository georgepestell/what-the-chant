import React from 'react'
import { Box, Divider, useTheme, useMediaQuery } from '@mui/material'
import CategoryFilter from './components/CategoryFilter'
import SearchBar from './components/SearchBar'
import FloatingSearchButton from './components/FloatingSearchButton'
import LockButton from './components/LockButton'
import ChantSection from './components/ChantSection'
import { useCategoryFilter } from './hooks/useCategoryFilter'
import { useFavorites } from './hooks/useFavorites'
import { useSearch } from './hooks/useSearch'
import { useLock } from './hooks/useLock'
import { filterChantsByCategory, getFavoriteChants, filterChantsBySearch } from './utils/chantUtils'
import { CATEGORIES, MOCK_CHANTS } from './data/mockData'

const ChantList: React.FC = () => {
    const { selectedCategories, handleCategorySelect } = useCategoryFilter()
    const { favoriteChants, handleToggleFavorite } = useFavorites()
    const { searchTerm, showSearchBar, handleSearchChange, toggleSearchBar, hideSearchBar } = useSearch()
    const { isLocked, toggleLock } = useLock()

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    // Filter by category first, then by search term
    const categoryFilteredChants = filterChantsByCategory(MOCK_CHANTS, selectedCategories)
    const filteredChants = filterChantsBySearch(categoryFilteredChants, searchTerm)
    const favoriteChantsList = getFavoriteChants(MOCK_CHANTS, favoriteChants)

    // Show search bar if: not mobile OR (mobile AND showSearchBar is true) OR searchTerm is not empty
    const shouldShowSearchBar = !isMobile || showSearchBar || searchTerm.trim() !== ''

    // Show floating button on mobile when search bar is hidden and no search term
    const shouldShowFloatingButton = isMobile && !showSearchBar && searchTerm.trim() === ''

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
                        isLocked={isLocked}
                    />
                    <Divider sx={{ my: 3 }} />
                </>
            )}

            {/* Lock Button - appears below favorites or at top if no favorites */}
            <LockButton isLocked={isLocked} onToggleLock={toggleLock} />

            {/* Search Bar - Above categories on desktop, conditional on mobile */}
            {!isLocked && shouldShowSearchBar && (
                <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    onClose={isMobile ? hideSearchBar : undefined}
                    placeholder="Search chants within selected categories..."
                />
            )}

            {/* All Chants Section - Hidden when locked */}
            {!isLocked && (
                <>
                    <Box
                        sx={{
                            position: searchTerm.trim() !== '' ? 'sticky' : 'static',
                            top: 0,
                            zIndex: 1,
                            backgroundColor: 'background.default',
                            padding: '1rem 0',
                        }}
                    >
                        <CategoryFilter
                            categories={CATEGORIES}
                            selectedCategories={selectedCategories}
                            onCategorySelect={handleCategorySelect}
                        />
                        {/* Sticky search bar when there's a search term */}
                        {searchTerm.trim() !== '' && !shouldShowSearchBar && (
                            <SearchBar
                                searchTerm={searchTerm}
                                onSearchChange={handleSearchChange}
                                onClose={isMobile ? hideSearchBar : undefined}
                                placeholder="Search chants within selected categories..."
                            />
                        )}
                    </Box>
                    <ChantSection
                        title="All Chants"
                        chants={filteredChants}
                        favoriteChants={favoriteChants}
                        onToggleFavorite={handleToggleFavorite}
                        showEmptyMessage={true}
                        isLocked={isLocked}
                    />

                    {/* Floating Search Button for Mobile */}
                    <FloatingSearchButton onClick={toggleSearchBar} show={shouldShowFloatingButton} />
                </>
            )}
        </Box>
    )
}

export default ChantList
