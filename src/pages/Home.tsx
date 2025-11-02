import React from 'react'
import { Box, Typography } from '@mui/material'
import ChantList from '../features/chantList/ChantList'
import ChantSubmission from '../features/chantSubmission/ChantSubmission'
import { useAuth } from '../contexts/AuthContext'
import type { Category } from '../App'

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
            <ChantList categories={categories} onCategoriesChange={onChantSubmitted} />
            {user && <ChantSubmission availableCategories={categories} onChantSubmitted={onChantSubmitted} />}
        </Box>
    )
}

export default Home
