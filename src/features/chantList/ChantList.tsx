import React, { useEffect, useState } from 'react'
import { Box, Divider, useTheme, useMediaQuery } from '@mui/material'
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
import { getFavoriteChants, filterChantsBySearch } from './utils/chantUtils'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Category } from '../../App'

// Types for Supabase data
type Chant = { id: number; text: string }
type ChantCategory = { id: number; chant_id: number; category_id: number }
type ChantWithCategories = Chant & { categories: string[] }
type CachedChant = Chant & { cachedAt: number }
type CachedChantCategory = ChantCategory & { cachedAt: number }

// Cache expiry time in milliseconds (e.g., 5 minutes)
const CACHE_EXPIRY_MS = 30 * 60 * 1000

interface ChantListProps {
    categories: Category[]
    onCategoriesChange?: () => void
}

const ChantList: React.FC<ChantListProps> = ({ categories, onCategoriesChange }) => {
    const { selectedCategories, handleCategorySelect } = useCategoryFilter()
    const { favoriteChants, handleToggleFavorite } = useFavorites()
    const { searchTerm, showSearchBar, handleSearchChange, toggleSearchBar, hideSearchBar } = useSearch()
    const { isLocked, toggleLock } = useLock()
    const { isAdmin } = useAuth()

    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    // Supabase state
    const [chants, setChants] = useState<Chant[]>([])
    const [chantCategories, setChantCategories] = useState<ChantCategory[]>([])
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingChantId, setEditingChantId] = useState<number | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const now = Date.now()

                // Load cached data from localStorage
                const cachedChantsStr = localStorage.getItem('chants')
                const cachedChantCategoriesStr = localStorage.getItem('chantCategories')

                const cachedChants: CachedChant[] = cachedChantsStr ? JSON.parse(cachedChantsStr) : []
                const cachedChantCategories: CachedChantCategory[] = cachedChantCategoriesStr ? JSON.parse(cachedChantCategoriesStr) : []

                // Filter out expired chants
                const validChants = cachedChants.filter((chant) => now - chant.cachedAt < CACHE_EXPIRY_MS)
                const expiredChants = cachedChants.filter((chant) => now - chant.cachedAt >= CACHE_EXPIRY_MS)

                // Get IDs of expired chants
                const expiredChantIds = new Set(expiredChants.map((c) => c.id))

                // Filter out chant_categories for expired chants
                const validChantCategories = cachedChantCategories.filter((cc) => !expiredChantIds.has(cc.chant_id))

                // Fetch fresh data for expired chants
                let refetchedChants: Chant[] = []
                let refetchedChantCategories: ChantCategory[] = []

                if (expiredChantIds.size > 0) {
                    const { data: chantsData } = await supabase.from('chants').select('*').in('id', Array.from(expiredChantIds))

                    refetchedChants = chantsData || []

                    if (refetchedChants.length > 0) {
                        const refetchedChantIds = refetchedChants.map((c) => c.id)
                        const { data: categoriesData } = await supabase
                            .from('chant_categories')
                            .select('*')
                            .in('chant_id', refetchedChantIds)
                        refetchedChantCategories = categoriesData || []
                    }
                }

                // Fetch any new chants (with ID greater than max cached ID)
                const maxChantId = cachedChants.length > 0 ? Math.max(...cachedChants.map((c) => c.id)) : 0
                const { data: newChantsData } = await supabase
                    .from('chants')
                    .select('*')
                    .gt('id', maxChantId)
                    .order('id', { ascending: true })

                let newChantCategories: ChantCategory[] = []
                if (newChantsData && newChantsData.length > 0) {
                    const newChantIds = newChantsData.map((c) => c.id)
                    const { data: categoriesData } = await supabase.from('chant_categories').select('*').in('chant_id', newChantIds)
                    newChantCategories = categoriesData || []
                }

                // Add timestamps to newly fetched data
                const timestampedRefetched: CachedChant[] = refetchedChants.map((chant) => ({ ...chant, cachedAt: now }))
                const timestampedNew: CachedChant[] = (newChantsData || []).map((chant) => ({ ...chant, cachedAt: now }))
                const timestampedRefetchedCategories: CachedChantCategory[] = refetchedChantCategories.map((cc) => ({
                    ...cc,
                    cachedAt: now,
                }))
                const timestampedNewCategories: CachedChantCategory[] = newChantCategories.map((cc) => ({ ...cc, cachedAt: now }))

                // Merge all data
                const allCachedChants = [...validChants, ...timestampedRefetched, ...timestampedNew]
                const allCachedChantCategories = [...validChantCategories, ...timestampedRefetchedCategories, ...timestampedNewCategories]

                // Remove timestamps for state (keep clean data)
                const allChants: Chant[] = allCachedChants.map(({ cachedAt: _cachedAt, ...chant }) => chant)
                const allChantCategories: ChantCategory[] = allCachedChantCategories.map(({ cachedAt: _cachedAt, ...cc }) => cc)

                // Update state
                setChants(allChants)
                setChantCategories(allChantCategories)

                // Update localStorage with timestamped data
                localStorage.setItem('chants', JSON.stringify(allCachedChants))
                localStorage.setItem('chantCategories', JSON.stringify(allCachedChantCategories))
            } catch (error) {
                console.error('Error fetching chants:', error)
            }
        }
        fetchData()
    }, [])

    // Handle delete chant
    const handleDeleteChant = async (chantId: number) => {
        const { error } = await supabase.from('chants').delete().eq('id', chantId)
        if (error) {
            console.error('Error deleting chant:', error)
            return
        }
        // Update local state and cache to remove the deleted chant
        setChants((prevChants) => {
            const updated = prevChants.filter((chant) => chant.id !== chantId)
            // Update cache with timestamps
            const cachedChantsStr = localStorage.getItem('chants')
            const cachedChants: CachedChant[] = cachedChantsStr ? JSON.parse(cachedChantsStr) : []
            const updatedCache = cachedChants.filter((chant) => chant.id !== chantId)
            localStorage.setItem('chants', JSON.stringify(updatedCache))
            return updated
        })
        setChantCategories((prevCC) => {
            const updated = prevCC.filter((cc) => cc.chant_id !== chantId)
            // Update cache with timestamps
            const cachedCategoriesStr = localStorage.getItem('chantCategories')
            const cachedCategories: CachedChantCategory[] = cachedCategoriesStr ? JSON.parse(cachedCategoriesStr) : []
            const updatedCache = cachedCategories.filter((cc) => cc.chant_id !== chantId)
            localStorage.setItem('chantCategories', JSON.stringify(updatedCache))
            return updated
        })
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
            // Update chant text
            const { error: chantError } = await supabase.from('chants').update({ text }).eq('id', chantId)

            if (chantError) throw chantError

            // Create new categories and get their IDs
            const newCategoryIds: number[] = []
            for (const categoryName of newCategories) {
                const lowerCaseName = categoryName.toLowerCase()

                // Check if category already exists
                const { data: existingCategory } = await supabase.from('categories').select('id').eq('name', lowerCaseName).single()

                if (existingCategory) {
                    // Use existing category
                    newCategoryIds.push(existingCategory.id)
                } else {
                    // Create new category
                    const { data, error } = await supabase.from('categories').insert({ name: lowerCaseName }).select('id').single()

                    if (error) throw error
                    if (data) {
                        newCategoryIds.push(data.id)
                    }
                }
            }

            // Combine existing and new category IDs
            const allCategoryIds = [...categoryIds, ...newCategoryIds]

            // Delete existing category links
            const { error: deleteError } = await supabase.from('chant_categories').delete().eq('chant_id', chantId)

            if (deleteError) throw deleteError

            // Insert new category links
            if (allCategoryIds.length > 0) {
                const { error: linkError } = await supabase
                    .from('chant_categories')
                    .insert(allCategoryIds.map((category_id) => ({ chant_id: chantId, category_id })))

                if (linkError) throw linkError
            }

            const now = Date.now()

            // Update local state for chants
            setChants((prevChants) => {
                const updated = prevChants.map((chant) => (chant.id === chantId ? { ...chant, text } : chant))
                // Update cache with timestamps
                const cachedChantsStr = localStorage.getItem('chants')
                const cachedChants: CachedChant[] = cachedChantsStr ? JSON.parse(cachedChantsStr) : []
                const updatedCache = cachedChants.map((chant) => (chant.id === chantId ? { ...chant, text, cachedAt: now } : chant))
                localStorage.setItem('chants', JSON.stringify(updatedCache))
                return updated
            })

            // Update local state for chant categories
            const newChantCategories = [
                ...chantCategories.filter((cc) => cc.chant_id !== chantId),
                ...allCategoryIds.map((category_id, index) => ({ id: now + index, chant_id: chantId, category_id })),
            ]
            console.log('Updating chantCategories state to:', newChantCategories)
            setChantCategories(newChantCategories)

            // Update cache with timestamps
            const cachedCategoriesStr = localStorage.getItem('chantCategories')
            const cachedCategories: CachedChantCategory[] = cachedCategoriesStr ? JSON.parse(cachedCategoriesStr) : []
            const updatedCache = [
                ...cachedCategories.filter((cc) => cc.chant_id !== chantId),
                ...allCategoryIds.map((category_id, index) => ({ id: now + index, chant_id: chantId, category_id, cachedAt: now })),
            ]
            console.log('Updating localStorage chantCategories to:', updatedCache)
            localStorage.setItem('chantCategories', JSON.stringify(updatedCache))

            // Refresh categories from parent if new ones were created
            if (newCategories.length > 0) {
                console.log('Refreshing parent categories')
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

    // Filter chants by selected categories
    const getChantsByCategories = (chants: Chant[], selectedCategories: number[]) => {
        if (!selectedCategories.length) return chants
        const chantIds = chantCategories.filter((cc) => selectedCategories.includes(cc.category_id)).map((cc) => cc.chant_id)
        const chantIdsSet = new Set(chantIds)
        return chants.filter((c) => chantIdsSet.has(c.id))
    }

    // Filter by category first, then by search term
    const categoryFilteredChants = getChantsByCategories(chants, selectedCategories)
    const filteredChants = filterChantsBySearch(categoryFilteredChants, searchTerm)
    const favoriteChantsList = getFavoriteChants(chants, favoriteChants)

    // Add categories to chants for display
    const filteredChantsWithCategories = addCategoriesToChants(filteredChants)
    const favoriteChantsWithCategories = addCategoriesToChants(favoriteChantsList)

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
                        chants={favoriteChantsWithCategories}
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
                            categories={categories}
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
                        chants={filteredChantsWithCategories}
                        favoriteChants={favoriteChants}
                        onToggleFavorite={handleToggleFavorite}
                        onDelete={handleDeleteChant}
                        onEdit={handleEditChant}
                        showEmptyMessage={true}
                        isLocked={isLocked}
                        isAdmin={isAdmin}
                    />

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
