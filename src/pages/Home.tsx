import React, { lazy, Suspense } from 'react'
import { Box, Typography, Skeleton, Paper } from '@mui/material'
import ChantSubmission from '../features/chantSubmission/ChantSubmission'
import { useAuth } from '../hooks/useAuth'
import type { Category } from '../App'

// Lazy load ChantList
const ChantList = lazy(() => import('../features/chantList/ChantList'))

// Skeleton component for loading chants
const ChantSkeleton = () => (
    <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Skeleton variant="text" width="80%" height={24} />
            <Skeleton variant="circular" width={24} height={24} />
        </Box>
        <Skeleton variant="text" width="90%" height={20} />
        <Skeleton variant="text" width="70%" height={20} />
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Skeleton variant="rounded" width={60} height={24} />
            <Skeleton variant="rounded" width={80} height={24} />
            <Skeleton variant="rounded" width={70} height={24} />
        </Box>
    </Paper>
)

const ChantListSkeleton = () => (
    <Box sx={{ mt: 2 }}>
        {/* Lock button skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Skeleton variant="rounded" width={120} height={36} />
        </Box>

        {/* Search bar skeleton - full width to match actual SearchBar */}
        <Skeleton variant="rounded" width="100%" height={56} sx={{ mb: 2 }} />

        {/* Category filter skeleton */}
        <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" width={120} height={32} sx={{ mb: 1 }} />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Skeleton variant="rounded" width={80} height={32} />
                <Skeleton variant="rounded" width={100} height={32} />
                <Skeleton variant="rounded" width={70} height={32} />
                <Skeleton variant="rounded" width={90} height={32} />
            </Box>
        </Box>

        {/* "All Chants" section title skeleton */}
        <Skeleton variant="text" width={120} height={40} sx={{ mb: 2 }} />

        {/* Chants skeleton */}
        <Box>
            <ChantSkeleton />
            <ChantSkeleton />
            <ChantSkeleton />
            <ChantSkeleton />
        </Box>
    </Box>
)

interface HomeProps {
    categories: Category[]
    onChantSubmitted: () => void
}

const Home: React.FC<HomeProps> = ({ categories, onChantSubmitted }) => {
    const { user } = useAuth()

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h4" component="h1" sx={{ fontFamily: 'BBH Sans Hegarty', textAlign: 'center' }}>
                What The Chant?
            </Typography>
            <Typography variant="subtitle1" component="p" sx={{ textAlign: 'center', marginBottom: '1rem' }}>
                Find the chants for your next demo
            </Typography>
            <Suspense fallback={<ChantListSkeleton />}>
                <ChantList categories={categories} onCategoriesChange={onChantSubmitted} />
            </Suspense>
            {user && <ChantSubmission availableCategories={categories} onChantSubmitted={onChantSubmitted} />}
        </Box>
    )
}

export default Home
