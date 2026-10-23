import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'
import { useEffect, useRef } from 'react'

// Types
type Chant = { id: number; text: string; updated_at: string }
type ChantCategory = { id: number; chant_id: number; category_id: number }

interface ChantsPageData {
    chants: Chant[]
    chantCategories: ChantCategory[]
    nextCursor: number | null
    hasMore: boolean
    lastSync?: string
}

const QUERY_KEY_BASE = 'chants'
const PAGE_SIZE = 50

// Check for incremental updates based on last sync time
const checkForUpdates = async (lastSync?: string) => {
    if (!lastSync) return null

    const { data: updatedChants, error } = await supabase
        .from('chants')
        .select('*')
        .gt('updated_at', lastSync)
        .order('updated_at', { ascending: false })

    if (error) throw error

    if (!updatedChants || updatedChants.length === 0) return null

    const chantIds = updatedChants.map((c: Chant) => c.id)
    const { data: categories } = await supabase.from('chant_categories').select('*').in('chant_id', chantIds)

    return {
        chants: updatedChants,
        chantCategories: categories || [],
        lastSync: new Date().toISOString(),
    }
}

// Fetch chants with pagination (for both browsing and searching)
const fetchChantsPage = async ({
    pageParam = 0,
    searchTerm = '',
    categoryIds = [],
}: {
    pageParam?: number
    searchTerm?: string
    categoryIds?: number[]
}): Promise<ChantsPageData> => {
    const from = pageParam
    const to = from + PAGE_SIZE - 1

    let query = supabase.from('chants').select('*', { count: 'exact' }).order('updated_at', { ascending: false })

    // Apply search filter if specified
    if (searchTerm.trim()) {
        query = query.ilike('text', `%${searchTerm}%`)
    }

    // Apply category filter if specified
    if (categoryIds.length > 0) {
        const { data: categoryChants } = await supabase.from('chant_categories').select('chant_id').in('category_id', categoryIds)

        const allowedChantIds = categoryChants?.map((cc) => cc.chant_id) || []
        if (allowedChantIds.length > 0) {
            query = query.in('id', allowedChantIds)
        } else {
            // No chants match the category filter
            return {
                chants: [],
                chantCategories: [],
                nextCursor: null,
                hasMore: false,
            }
        }
    }

    const { data: chants, error: chantsError } = await query.range(from, to)

    if (chantsError) throw chantsError

    const chantIds = chants?.map((c: Chant) => c.id) || []

    let chantCategories: ChantCategory[] = []
    if (chantIds.length > 0) {
        const { data: categories, error: categoriesError } = await supabase.from('chant_categories').select('*').in('chant_id', chantIds)

        if (categoriesError) throw categoriesError
        chantCategories = categories || []
    }

    const hasMore = chants.length === PAGE_SIZE
    const nextCursor = hasMore ? to + 1 : null

    return {
        chants: chants || [],
        chantCategories,
        nextCursor,
        hasMore,
        lastSync: new Date().toISOString(),
    }
}

export const useChants = (searchTerm: string = '', categoryIds: number[] = []) => {
    const queryClient = useQueryClient()
    const channelRef = useRef<RealtimeChannel | null>(null)

    // Include search term and categories in query key for proper caching
    const queryKey = [QUERY_KEY_BASE, searchTerm, categoryIds.sort().join(',')]

    const query = useInfiniteQuery({
        queryKey,
        queryFn: async ({ pageParam = 0 }) => {
            // Normal pagination fetch for search/filter or subsequent pages
            if (pageParam !== 0 || searchTerm || categoryIds.length > 0) {
                return fetchChantsPage({ pageParam, searchTerm, categoryIds })
            }

            // For first page without search/filter, check cache first
            const cachedData = queryClient.getQueryData<{ pages: ChantsPageData[] }>(queryKey)

            // If we have cached data, check for incremental updates
            if (cachedData?.pages?.[0]?.lastSync) {
                const lastSync = cachedData.pages[0]?.lastSync
                const updates = await checkForUpdates(lastSync)

                // If we have updates, merge them with cached data
                if (updates && updates.chants.length > 0) {
                    const existingChants = cachedData.pages.flatMap((p) => p.chants)
                    const existingCategories = cachedData.pages.flatMap((p) => p.chantCategories)

                    // Create a map of existing chants by ID
                    const chantMap = new Map(existingChants.map((c) => [c.id, c]))

                    // Update or add new chants
                    updates.chants.forEach((chant) => {
                        chantMap.set(chant.id, chant)
                    })

                    // Update categories - remove old ones for updated chants, add new
                    const updatedChantIds = new Set(updates.chants.map((c) => c.id))
                    const filteredCategories = existingCategories.filter((cc) => !updatedChantIds.has(cc.chant_id))

                    const allChants = Array.from(chantMap.values()).sort(
                        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
                    )
                    const allCategories = [...filteredCategories, ...updates.chantCategories]

                    // Rebuild pages with updated data
                    const newPages: ChantsPageData[] = []
                    for (let i = 0; i < allChants.length; i += PAGE_SIZE) {
                        const pageChants = allChants.slice(i, i + PAGE_SIZE)
                        const pageChantIds = new Set(pageChants.map((c) => c.id))
                        const pageCategories = allCategories.filter((cc) => pageChantIds.has(cc.chant_id))

                        newPages.push({
                            chants: pageChants,
                            chantCategories: pageCategories,
                            nextCursor: i + PAGE_SIZE < allChants.length ? i + PAGE_SIZE : null,
                            hasMore: i + PAGE_SIZE < allChants.length,
                            lastSync: updates.lastSync,
                        })
                    }

                    // Update the cache with merged data
                    queryClient.setQueryData(queryKey, {
                        pages: newPages,
                        pageParams: newPages.map((_, idx) => idx * PAGE_SIZE),
                    })

                    // Return the first page
                    return (
                        newPages[0] || {
                            chants: [],
                            chantCategories: [],
                            nextCursor: null,
                            hasMore: false,
                            lastSync: updates.lastSync,
                        }
                    )
                }

                // No updates, return cached first page without making any network call
                return cachedData.pages[0]
            }

            // No cache, do initial fetch
            return fetchChantsPage({ pageParam, searchTerm, categoryIds })
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: Infinity, // Never consider data stale - we handle updates manually
        gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    })

    // Set up realtime subscription
    useEffect(() => {
        const handleRealtimeUpdate = async (_payload: { eventType: 'INSERT' | 'UPDATE' | 'DELETE'; new: Chant; old: { id: number } }) => {
            // Invalidate all chant queries to refetch
            // This ensures search results stay up to date
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_BASE] })
        }

        if (!channelRef.current) {
            channelRef.current = (supabase.channel('chants-realtime') as RealtimeChannel)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'chants' } as never, handleRealtimeUpdate as never)
                .subscribe()
        }

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current)
                channelRef.current = null
            }
        }
    }, [queryClient])

    return query
}

export const useDeleteChant = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (chantId: number) => {
            const { error } = await supabase.from('chants').delete().eq('id', chantId)
            if (error) throw error
            return chantId
        },
        onSuccess: () => {
            // Invalidate all chant queries to refetch
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_BASE] })
        },
        onError: (err) => {
            console.error('Error deleting chant:', err)
        },
    })
}

export const useUpdateChant = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({
            chantId,
            text,
            categoryIds,
            newCategories,
        }: {
            chantId: number
            text: string
            categoryIds: number[]
            newCategories: string[]
        }) => {
            // Update chant text
            const { error: updateError } = await supabase
                .from('chants')
                .update({ text, updated_at: new Date().toISOString() })
                .eq('id', chantId)

            if (updateError) throw updateError

            // Handle new categories
            if (newCategories.length > 0) {
                const { data: insertedCategories, error: categoryInsertError } = await supabase
                    .from('categories')
                    .insert(newCategories.map((name) => ({ name })))
                    .select()

                if (categoryInsertError) throw categoryInsertError

                if (insertedCategories) {
                    categoryIds.push(...insertedCategories.map((c: { id: number }) => c.id))
                }
            }

            // Delete existing chant categories
            const { error: deleteError } = await supabase.from('chant_categories').delete().eq('chant_id', chantId)

            if (deleteError) throw deleteError

            // Insert new chant categories
            if (categoryIds.length > 0) {
                const { error: insertError } = await supabase
                    .from('chant_categories')
                    .insert(categoryIds.map((categoryId) => ({ chant_id: chantId, category_id: categoryId })))

                if (insertError) throw insertError
            }

            return { chantId, text, categoryIds }
        },
        onSuccess: () => {
            // Invalidate all chant queries to refetch
            queryClient.invalidateQueries({ queryKey: [QUERY_KEY_BASE] })
        },
        onError: (err) => {
            console.error('Error updating chant:', err)
        },
    })
}
