import React from 'react'
import { Paper, Box, Typography, Button, Chip } from '@mui/material'
import { Favorite, FavoriteBorder } from '@mui/icons-material'
import type { Chant } from '../types'

interface ChantCardProps {
    chant: Chant
    isFavorite: boolean
    onToggleFavorite: (chantId: number) => void
    isLocked: boolean
}

const ChantCard: React.FC<ChantCardProps> = ({ chant, isFavorite, onToggleFavorite, isLocked }) => {
    return (
        <Paper
            elevation={2}
            sx={{
                padding: '16px',
                marginBottom: '16px',
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ position: 'relative' }}>
                <Typography
                    variant="h6"
                    sx={{
                        textAlign: 'left',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        minWidth: 0,
                        flex: 1,
                        mr: 1,
                    }}
                >
                    {chant.title}
                </Typography>
                {!isLocked && (
                    <Button
                        variant="contained"
                        color={isFavorite ? 'secondary' : 'primary'}
                        size="small"
                        onClick={() => onToggleFavorite(chant.id)}
                        sx={{
                            minWidth: 'auto',
                            padding: '4px',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                        }}
                    >
                        {isFavorite ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                    </Button>
                )}
            </Box>
            <Box mt={1} display="flex" gap={1} flexWrap="wrap" alignItems="center">
                {chant.categories.map((category: string) => (
                    <Chip key={category} label={category} size="small" />
                ))}
            </Box>
        </Paper>
    )
}

export default ChantCard
