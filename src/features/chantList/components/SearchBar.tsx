import React from 'react'
import { TextField, InputAdornment, IconButton, useTheme, useMediaQuery } from '@mui/material'
import { Search, Close } from '@mui/icons-material'

interface SearchBarProps {
    searchTerm: string
    onSearchChange: (searchTerm: string) => void
    onClose?: () => void
    placeholder?: string
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange, onClose, placeholder = 'Search chants...' }) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    return (
        <TextField
            fullWidth
            variant="outlined"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus={isMobile} // Auto-focus on mobile when opened
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Search />
                    </InputAdornment>
                ),
                endAdornment: isMobile && onClose && (
                    <InputAdornment position="end">
                        <IconButton onClick={onClose} edge="end">
                            <Close />
                        </IconButton>
                    </InputAdornment>
                ),
            }}
            sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                },
            }}
        />
    )
}

export default SearchBar
