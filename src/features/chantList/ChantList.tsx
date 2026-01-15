import React, { useState } from 'react'
import { Box, Divider, useTheme, useMediaQuery, CircularProgress, Typography } from '@mui/material'
import CategoryFilter from './components/CategoryFilter'
import SearchBar from './components/SearchBar'
import FloatingSearchButton from './components/FloatingSearchButton'
import LockButton from './components/LockButton'
import ChantSection from './components/ChantSection'
import EditChantDialog from './components/EditChantDialog'
import { useCategoryFilter } from './hooks/useCategoryFilter'
import { useFavorites } from './hooks/useFavorites'
import { useSearch } from './hooks/useSearch'
import { useLock } from './hooks/useLock'
import { useChants, useDeleteChant, useUpdateChant } from './hooks/useChantQueries'
import { getFavoriteChants } from './utils/chantUtils'
import { useAuth } from '../../hooks/useAuth'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver'
import type { Category } from '../../App'

// Types for Supabase data
type Chant = { id: number; text: string; updated_at: string }
type ChantWithCategories = Chant & { categories: string[] }

interface ChantListProps {
    categories: Category[]
    onCategoriesChange?: () => void
}

const ChantList: React.FC<ChantListProps> = ({ categories, onCategoriesChange }) => {
    const { selectedCategories, handleCategorySelect } = useCategoryFilter()
    const { favoriteChants, handleToggleFavorite } = useFavorites()
    const { searchTerm, debouncedSearchTerm, showSearchBar, handleSearchChange, toggleSearchBar, hideSearchBar } = useSearch()
    const { isLocked, toggleLock } = useLock()
    const { isAdmin } = useAuth()

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    // React Query hooks with infinite scroll - pass debounced search and categories for server-side filtering
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useChants(debouncedSearchTerm, selectedCategories)
    const deleteChantMutation = useDeleteChant()
    const updateChantMutation = useUpdateChant()

    // Flatten paginated data
    const chants = data?.pages.flatMap((page) => page.chants) || []
    const chantCategories = data?.pages.flatMap((page) => page.chantCategories) || []

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingChantId, setEditingChantId] = useState<number | null>(null)

    // Intersection observer for infinite scroll
    const loadMoreRef = useIntersectionObserver({
        onIntersect: () => {
            if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
            }
        },
        enabled: !isLocked && hasNextPage !== false,
    })

    // Handle delete chant
    const handleDeleteChant = async (chantId: number) => {
        if (!confirm('Are you sure you want to delete this chant? This action cannot be undone.')) {
            return
        }

        try {
            await deleteChantMutation.mutateAsync(chantId)
        } catch (error) {
            console.error('Error deleting chant:', error)
            alert('Failed to delete chant. Please try again.')
        }
    }

    // Handle edit chant
    const handleEditChant = (chantId: number) => {
        setEditingChantId(chantId)
        setEditDialogOpen(true)
    }

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false)
        setEditingChantId(null)
    }

    const handleSaveEdit = async (chantId: number, text: string, categoryIds: number[], newCategories: string[]) => {
        try {
            await updateChantMutation.mutateAsync({
                chantId,
                text,
                categoryIds,
                newCategories,
            })

            // Refresh categories from parent if new ones were created
            if (newCategories.length > 0) {
                onCategoriesChange?.()
            }

            // Close the edit dialog
            setEditDialogOpen(false)
            setEditingChantId(null)
        } catch (error) {
            console.error('Error updating chant:', error)
            alert('Failed to update chant. Please try again.')
        }
    }

    // Helper to add categories to chants
    const addCategoriesToChants = (chants: Chant[]): ChantWithCategories[] => {
        return chants.map((chant) => {
            const categoryIds = chantCategories.filter((cc) => cc.chant_id === chant.id).map((cc) => cc.category_id)
            const categoryNames = categories.filter((cat) => categoryIds.includes(cat.id)).map((cat) => cat.name)
            return { ...chant, categories: categoryNames }
        })
    }

    // Chants are already filtered by server (search + categories), just add category names
    const chantsWithCategories = addCategoriesToChants(chants)
    const favoriteChantsList = getFavoriteChants(chantsWithCategories, favoriteChants)

    // Show search bar if: not mobile OR (mobile AND showSearchBar is true) OR searchTerm is not empty
    const shouldShowSearchBar = !isMobile || showSearchBar || searchTerm.trim() !== ''

    // Show floating button on mobile when search bar is hidden and no search term
    const shouldShowFloatingButton = isMobile && !showSearchBar && searchTerm.trim() === ''

    // Check if we're waiting for debounced search
    const isSearchPending = searchTerm !== debouncedSearchTerm

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
                        onDelete={handleDeleteChant}
                        onEdit={handleEditChant}
                        isLocked={isLocked}
                        isAdmin={isAdmin}
                    />
                    <Divider sx={{ my: 3 }} />
                </>
            )}

            {/* Lock Button - appears below favorites or at top if no favorites */}
            <LockButton isLocked={isLocked} onToggleLock={toggleLock} />

            {/* Search Bar - Above categories on desktop, conditional on mobile */}
            {!isLocked && shouldShowSearchBar && (
                <Box sx={{ position: 'relative' }}>
                    <SearchBar
                        searchTerm={searchTerm}
                        onSearchChange={handleSearchChange}
                        onClose={isMobile ? hideSearchBar : undefined}
                        placeholder="Search chants within selected categories..."
                    />
                    {isSearchPending && (
                        <Box
                            sx={{
                                position: 'absolute',
                                right: 48,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <CircularProgress size={20} />
                        </Box>
                    )}
                </Box>
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
                            categories={categories}
                            selectedCategories={selectedCategories}
                            onCategorySelect={handleCategorySelect}
                        />
                        {/* Sticky search bar when there's a search term */}
                        {searchTerm.trim() !== '' && !shouldShowSearchBar && (
                            <Box sx={{ position: 'relative' }}>
                                <SearchBar
                                    searchTerm={searchTerm}
                                    onSearchChange={handleSearchChange}
                                    onClose={isMobile ? hideSearchBar : undefined}
                                    placeholder="Search chants within selected categories..."
                                />
                                {isSearchPending && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            right: 48,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <CircularProgress size={20} />
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                    <ChantSection
                        title="All Chants"
                        chants={chantsWithCategories}
                        favoriteChants={favoriteChants}
                        onToggleFavorite={handleToggleFavorite}
                        onDelete={handleDeleteChant}
                        onEdit={handleEditChant}
                        showEmptyMessage={!isLoading && !isSearchPending}
                        isLocked={isLocked}
                        isAdmin={isAdmin}
                    />

                    {/* Infinite scroll loader */}
                    {!isLocked && hasNextPage && (
                        <Box
                            ref={loadMoreRef}
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 3,
                            }}
                        >
                            {isFetchingNextPage && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <CircularProgress size={24} />
                                    <Typography variant="body2" color="text.secondary">
                                        Loading more chants...
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Floating Search Button for Mobile */}
                    <FloatingSearchButton onClick={toggleSearchBar} show={shouldShowFloatingButton} />
                </>
            )}

            {/* Edit Dialog */}
            {editingChantId !== null && (
                <EditChantDialog
                    open={editDialogOpen}
                    chantId={editingChantId}
                    initialText={chants.find((c) => c.id === editingChantId)?.text || ''}
                    initialCategories={addCategoriesToChants([chants.find((c) => c.id === editingChantId)!])[0]?.categories || []}
                    availableCategories={categories}
                    onClose={handleCloseEditDialog}
                    onSave={handleSaveEdit}
                />
            )}
        </Box>
    )
}

export default ChantList
