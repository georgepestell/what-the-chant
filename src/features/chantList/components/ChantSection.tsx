import React from 'react'
import { Box, Typography } from '@mui/material'
import ChantCard from './ChantCard'

interface ChantSectionProps {
    title: string
    chants: { id: number; text: string; categories?: string[] }[]
    favoriteChants: number[]
    onToggleFavorite: (chantId: number) => void
    onDelete?: (chantId: number) => void
    onEdit?: (chantId: number) => void
    showEmptyMessage?: boolean
    isLocked: boolean
    isAdmin?: boolean
}

const ChantSection: React.FC<ChantSectionProps> = ({
    title,
    chants,
    favoriteChants,
    onToggleFavorite,
    onDelete,
    onEdit,
    showEmptyMessage = false,
    isLocked = false,
    isAdmin = false,
}) => {
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
                              onDelete={onDelete}
                              onEdit={onEdit}
                              isLocked={isLocked}
                              isAdmin={isAdmin}
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
