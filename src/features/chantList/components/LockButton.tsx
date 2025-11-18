import React from 'react'
import { Button, Box } from '@mui/material'
import { LazyLock, LazyLockOpen } from '../../../components/LazyIcons'

interface LockButtonProps {
    isLocked: boolean
    onToggleLock: () => void
}

const LockButton: React.FC<LockButtonProps> = ({ isLocked, onToggleLock }) => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button
                variant={isLocked ? 'contained' : 'outlined'}
                color={isLocked ? 'error' : 'primary'}
                startIcon={isLocked ? <LazyLock /> : <LazyLockOpen />}
                onClick={onToggleLock}
                sx={{
                    textTransform: 'none',
                    minWidth: 120,
                }}
            >
                {isLocked ? 'Locked' : 'Lock Favourites'}
            </Button>
        </Box>
    )
}

export default LockButton
