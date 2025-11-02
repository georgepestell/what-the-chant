import React from 'react'
import { Paper, Box, Typography, Button, Chip, IconButton } from '@mui/material'
import { Favorite, FavoriteBorder, Delete, Edit } from '@mui/icons-material'

interface ChantCardProps {
    chant: { id: number; text: string; categories?: string[] }
    isFavorite: boolean
    onToggleFavorite: (chantId: number) => void
    onDelete?: (chantId: number) => void
    onEdit?: (chantId: number) => void
    isLocked: boolean
    isAdmin?: boolean
}

const ChantCard: React.FC<ChantCardProps> = ({ chant, isFavorite, onToggleFavorite, onDelete, onEdit, isLocked, isAdmin }) => {
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
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ position: 'relative' }}>
                <Typography
                    variant="h6"
                    sx={{
                        textAlign: 'left',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        minWidth: 0,
                        flex: 1,
                        pr: isLocked ? 0 : isAdmin ? '118px' : '34px', // Adjust for edit + delete + favorite buttons if admin
                        lineHeight: 1.4,
                    }}
                >
                    {chant.text}
                </Typography>
                {!isLocked && (
                    <Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 0.5 }}>
                        {isAdmin && onEdit && (
                            <IconButton
                                color="primary"
                                size="small"
                                onClick={() => onEdit(chant.id)}
                                sx={{
                                    padding: '4px',
                                }}
                            >
                                <Edit fontSize="small" />
                            </IconButton>
                        )}
                        {isAdmin && onDelete && (
                            <IconButton
                                color="error"
                                size="small"
                                onClick={() => onDelete(chant.id)}
                                sx={{
                                    padding: '4px',
                                }}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        )}
                        <Button
                            variant="contained"
                            color={isFavorite ? 'secondary' : 'primary'}
                            size="small"
                            onClick={() => onToggleFavorite(chant.id)}
                            sx={{
                                minWidth: 'auto',
                                padding: '4px',
                            }}
                        >
                            {isFavorite ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
                        </Button>
                    </Box>
                )}
            </Box>
            {chant.categories && chant.categories.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {chant.categories.map((category) => (
                        <Chip key={category} label={category} size="small" variant="outlined" />
                    ))}
                </Box>
            )}
        </Paper>
    )
}

export default ChantCard
