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
}

const QUERY_KEY_BASE = 'chants'
const PAGE_SIZE = 50

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
    }
}

export const useChants = (searchTerm: string = '', categoryIds: number[] = []) => {
    const queryClient = useQueryClient()
    const channelRef = useRef<RealtimeChannel | null>(null)

    // Include search term and categories in query key for proper caching
    const queryKey = [QUERY_KEY_BASE, searchTerm, categoryIds.sort().join(',')]

    const query = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam = 0 }) => fetchChantsPage({ pageParam, searchTerm, categoryIds }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
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
