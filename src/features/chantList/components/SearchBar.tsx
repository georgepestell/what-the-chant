import React from 'react'
import { TextField, InputAdornment } from '@mui/material'
import { Search } from '@mui/icons-material'

interface SearchBarProps {
    searchTerm: string
    onSearchChange: (searchTerm: string) => void
    placeholder?: string
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange, placeholder = 'Search chants...' }) => {
    return (
        <TextField
            fullWidth
            variant="outlined"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Search />
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
