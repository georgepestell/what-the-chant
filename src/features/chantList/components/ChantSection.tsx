import React from 'react'
import { Box, Typography } from '@mui/material'
import ChantCard from './ChantCard'
import type { Chant } from '../types'

interface ChantSectionProps {
    title: string
    chants: Chant[]
    favoriteChants: number[]
    onToggleFavorite: (chantId: number) => void
    showEmptyMessage?: boolean
}

const ChantSection: React.FC<ChantSectionProps> = ({ title, chants, favoriteChants, onToggleFavorite, showEmptyMessage = false }) => {
    if (chants.length === 0 && !showEmptyMessage) {
        return null
    }

    return (
        <Box mb={4}>
            <Typography variant="h5" mb={2} color={title.includes('Favorites') ? 'secondary' : 'primary'}>
                {title}
            </Typography>
            <Box>
                {chants.length > 0
                    ? chants.map((chant) => (
                          <ChantCard
                              key={chant.id}
                              chant={chant}
                              isFavorite={favoriteChants.includes(chant.id)}
                              onToggleFavorite={onToggleFavorite}
                          />
                      ))
                    : showEmptyMessage && (
                          <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                              No chants to display
                          </Typography>
                      )}
            </Box>
        </Box>
    )
}

export default ChantSection
