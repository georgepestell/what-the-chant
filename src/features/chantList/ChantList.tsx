import React, { useEffect, useState, useCallback, useRef } from 'react'
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
type Chant = { id: number; text: string; updated_at: string }
type ChantCategory = { id: number; chant_id: number; category_id: number }
type ChantWithCategories = Chant & { categories: string[] }
type CachedChant = Chant & { cachedAt: number }
type CachedChantCategory = ChantCategory & { cachedAt: number }

// Enhanced cache structure with metadata
interface CacheMetadata {
    lastSync: number
    chants: CachedChant[]
    chantCategories: CachedChantCategory[]
}

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
    const [isLoading, setIsLoading] = useState(true)

    // Guard to prevent duplicate fetches (React StrictMode causes double mounting in dev)
    const fetchGuard = useRef(false)

    // Helper function for cache updates
    const updateLocalCache = useCallback((cache: CacheMetadata) => {
        const now = Date.now()
        const updatedCache = { ...cache, lastSync: now }
        localStorage.setItem('chantCache', JSON.stringify(updatedCache))
        return updatedCache
    }, [])

    // Initial data fetch and real-time setup
    useEffect(() => {
        // Move handleRealtimeChantUpdate inside useEffect to prevent recreating subscription
        const handleRealtimeChantUpdate = async (payload: any) => {
            const now = Date.now()
            console.log('Real-time chant update:', payload)

            if (payload.eventType === 'INSERT') {
                const newChant: Chant = payload.new
                setChants((prev) => [...prev, newChant])

                // Fetch categories for new chant
                const { data: newChantCategories } = await supabase.from('chant_categories').select('*').eq('chant_id', newChant.id)

                if (newChantCategories) {
                    setChantCategories((prev) => [...prev, ...newChantCategories])
                }

                // Update cache
                const cacheStr = localStorage.getItem('chantCache')
                const cache: CacheMetadata = cacheStr ? JSON.parse(cacheStr) : { lastSync: 0, chants: [], chantCategories: [] }
                cache.chants.push({ ...newChant, cachedAt: now })
                if (newChantCategories) {
                    cache.chantCategories.push(...newChantCategories.map((cc) => ({ ...cc, cachedAt: now })))
                }
                updateLocalCache(cache)
            } else if (payload.eventType === 'UPDATE') {
                const updatedChant: Chant = payload.new
                setChants((prev) => prev.map((c) => (c.id === updatedChant.id ? updatedChant : c)))

                // Fetch updated categories for this chant
                const { data: updatedChantCategories } = await supabase.from('chant_categories').select('*').eq('chant_id', updatedChant.id)

                // Update chant categories (remove old ones for this chant, add new ones)
                setChantCategories((prev) => [...prev.filter((cc) => cc.chant_id !== updatedChant.id), ...(updatedChantCategories || [])])

                // Update cache
                const cacheStr = localStorage.getItem('chantCache')
                const cache: CacheMetadata = cacheStr ? JSON.parse(cacheStr) : { lastSync: 0, chants: [], chantCategories: [] }
                cache.chants = cache.chants.map((c) => (c.id === updatedChant.id ? { ...updatedChant, cachedAt: now } : c))
                cache.chantCategories = [
                    ...cache.chantCategories.filter((cc) => cc.chant_id !== updatedChant.id),
                    ...(updatedChantCategories || []).map((cc) => ({ ...cc, cachedAt: now })),
                ]
                updateLocalCache(cache)
            } else if (payload.eventType === 'DELETE') {
                const deletedChantId = payload.old.id
                setChants((prev) => prev.filter((c) => c.id !== deletedChantId))
                setChantCategories((prev) => prev.filter((cc) => cc.chant_id !== deletedChantId))

                // Update cache
                const cacheStr = localStorage.getItem('chantCache')
                const cache: CacheMetadata = cacheStr ? JSON.parse(cacheStr) : { lastSync: 0, chants: [], chantCategories: [] }
                cache.chants = cache.chants.filter((c) => c.id !== deletedChantId)
                cache.chantCategories = cache.chantCategories.filter((cc) => cc.chant_id !== deletedChantId)
                updateLocalCache(cache)
            }
        }

        const fetchIncrementalData = async () => {
            // Prevent duplicate fetches (React StrictMode double mounting)
            if (fetchGuard.current) {
                console.log('🛑 Fetch already in progress, skipping duplicate call')
                return
            }

            fetchGuard.current = true
            console.log('🚀 Starting initial chant fetch')

            try {
                const now = Date.now()

                // Load cache metadata
                const cacheStr = localStorage.getItem('chantCache')
                const cache: CacheMetadata = cacheStr
                    ? JSON.parse(cacheStr)
                    : {
                          lastSync: 0,
                          chants: [],
                          chantCategories: [],
                      }

                // Filter out expired cached items
                const validChants = cache.chants.filter((chant) => now - chant.cachedAt < CACHE_EXPIRY_MS)
                const validChantCategories = cache.chantCategories.filter((cc) => now - cc.cachedAt < CACHE_EXPIRY_MS)

                // Get last sync time for incremental updates
                const lastSyncDate = new Date(cache.lastSync).toISOString()

                // Fetch only chants updated since last sync
                const { data: updatedChants } = await supabase
                    .from('chants')
                    .select('*')
                    .gte('updated_at', lastSyncDate)
                    .order('updated_at', { ascending: true })

                const updatedChantIds = updatedChants?.map((c) => c.id) || []

                // Fetch categories for updated chants
                let updatedChantCategories: ChantCategory[] = []
                if (updatedChantIds.length > 0) {
                    const { data: categoriesData } = await supabase.from('chant_categories').select('*').in('chant_id', updatedChantIds)
                    updatedChantCategories = categoriesData || []
                }

                // Merge data: Keep valid cache + add/update new data
                const chantMap = new Map(validChants.map((c) => [c.id, c]))
                const updatedChantsWithCache: CachedChant[] = (updatedChants || []).map((chant) => ({
                    ...chant,
                    cachedAt: now,
                }))

                // Update map with new/updated chants
                updatedChantsWithCache.forEach((chant) => {
                    chantMap.set(chant.id, chant)
                })

                // Remove categories for updated chants and add new ones
                const updatedChantIdSet = new Set(updatedChantIds)
                const filteredValidCategories = validChantCategories.filter((cc) => !updatedChantIdSet.has(cc.chant_id))
                const newCategoriesWithCache: CachedChantCategory[] = updatedChantCategories.map((cc) => ({
                    ...cc,
                    cachedAt: now,
                }))

                const finalChants = Array.from(chantMap.values())
                const finalChantCategories = [...filteredValidCategories, ...newCategoriesWithCache]

                // Update state
                const cleanChants: Chant[] = finalChants.map(({ cachedAt, ...chant }) => chant)
                const cleanChantCategories: ChantCategory[] = finalChantCategories.map(({ cachedAt, ...cc }) => cc)

                setChants(cleanChants)
                setChantCategories(cleanChantCategories)

                // Update cache
                const updatedCache: CacheMetadata = {
                    lastSync: now,
                    chants: finalChants,
                    chantCategories: finalChantCategories,
                }
                localStorage.setItem('chantCache', JSON.stringify(updatedCache))
            } catch (error) {
                console.error('Error fetching chants:', error)
            } finally {
                setIsLoading(false)
                fetchGuard.current = false
                console.log('✅ Initial chant fetch completed')
            }
        }

        // Set up real-time subscription
        const chantsSubscription = supabase
            .channel('chants-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chants' }, handleRealtimeChantUpdate)
            .subscribe()

        // Initial fetch
        fetchIncrementalData()

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(chantsSubscription)
        }
    }, [updateLocalCache])

    // Handle delete chant with optimistic updates
    const handleDeleteChant = async (chantId: number) => {
        if (!confirm('Are you sure you want to delete this chant? This action cannot be undone.')) {
            return
        }

        // Store original data for potential rollback
        const originalChant = chants.find((c) => c.id === chantId)
        const originalCategories = chantCategories.filter((cc) => cc.chant_id === chantId)

        // Optimistic update - remove from UI immediately
        setChants((prev) => prev.filter((c) => c.id !== chantId))
        setChantCategories((prev) => prev.filter((cc) => cc.chant_id !== chantId))

        try {
            const { error } = await supabase.from('chants').delete().eq('id', chantId)
            if (error) throw error

            // Update cache
            const cacheStr = localStorage.getItem('chantCache')
            const cache: CacheMetadata = cacheStr ? JSON.parse(cacheStr) : { lastSync: 0, chants: [], chantCategories: [] }

            cache.chants = cache.chants.filter((c) => c.id !== chantId)
            cache.chantCategories = cache.chantCategories.filter((cc) => cc.chant_id !== chantId)
            cache.lastSync = Date.now()

            localStorage.setItem('chantCache', JSON.stringify(cache))
        } catch (error) {
            console.error('Error deleting chant:', error)

            // Rollback optimistic update on error
            if (originalChant) {
                setChants((prev) => [...prev, originalChant])
                setChantCategories((prev) => [...prev, ...originalCategories])
            }
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
        const now = Date.now()
        const updatedAt = new Date().toISOString()

        // Optimistic update - update UI immediately
        const optimisticChant = chants.find((c) => c.id === chantId)
        if (optimisticChant) {
            setChants((prev) => prev.map((c) => (c.id === chantId ? { ...c, text, updated_at: updatedAt } : c)))
        }

        try {
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

            // Update chant text and trigger updated_at update (this will trigger real-time update)
            const { error: chantError } = await supabase.from('chants').update({ text, updated_at: updatedAt }).eq('id', chantId)

            if (chantError) throw chantError

            // Update local chant categories state optimistically
            const newChantCategories = [
                ...chantCategories.filter((cc) => cc.chant_id !== chantId),
                ...allCategoryIds.map((category_id, index) => ({ id: now + index, chant_id: chantId, category_id })),
            ]
            setChantCategories(newChantCategories)

            // Update cache optimistically
            const cacheStr = localStorage.getItem('chantCache')
            const cache: CacheMetadata = cacheStr ? JSON.parse(cacheStr) : { lastSync: 0, chants: [], chantCategories: [] }

            // Update chant in cache
            cache.chants = cache.chants.map((c) => (c.id === chantId ? { ...c, text, updated_at: updatedAt, cachedAt: now } : c))

            // Update categories in cache
            cache.chantCategories = [
                ...cache.chantCategories.filter((cc) => cc.chant_id !== chantId),
                ...allCategoryIds.map((category_id, index) => ({
                    id: now + index,
                    chant_id: chantId,
                    category_id,
                    cachedAt: now,
                })),
            ]

            cache.lastSync = now
            localStorage.setItem('chantCache', JSON.stringify(cache))

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

            // Revert optimistic update on error
            if (optimisticChant) {
                setChants((prev) => prev.map((c) => (c.id === chantId ? optimisticChant : c)))
            }
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
                        showEmptyMessage={!isLoading}
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
