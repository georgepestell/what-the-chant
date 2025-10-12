import React from 'react'
import { Fab, useMediaQuery, useTheme } from '@mui/material'
import { Search } from '@mui/icons-material'

interface FloatingSearchButtonProps {
    onClick: () => void
    show: boolean
}

const FloatingSearchButton: React.FC<FloatingSearchButtonProps> = ({ onClick, show }) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    if (!isMobile || !show) return null

    return (
        <Fab
            color="primary"
            onClick={onClick}
            sx={{
                position: 'fixed',
                bottom: 16,
                right: 16,
                zIndex: 1000,
            }}
        >
            <Search />
        </Fab>
    )
}

export default FloatingSearchButton
