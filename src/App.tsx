import './App.css'

import { useState } from 'react'
import { Container, ThemeProvider, CssBaseline, Typography, useMediaQuery, Button } from '@mui/material'
import { lightTheme, darkTheme } from './theme/theme'
import ChantList from './features/chantList/ChantList'
import ChantSubmission from './features/chantSubmission/ChantSubmission'
import { CATEGORIES } from './features/chantList/data/mockData'

function App() {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
    const [isDarkMode, setIsDarkMode] = useState(prefersDarkMode)

    const toggleTheme = () => {
        setIsDarkMode((prevMode) => !prevMode)
    }

    return (
        <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Button variant="contained" onClick={toggleTheme} style={{ marginTop: '1rem' }}>
                Switch to {isDarkMode ? 'Light' : 'Dark'} Mode
            </Button>
            <Container
                maxWidth={false}
                sx={{
                    maxWidth: '900px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    padding: {
                        xs: '1rem 0.5rem', // Reduced horizontal padding on mobile
                        sm: '2rem', // Keep original padding on larger screens
                    },
                    margin: '0 auto',
                    boxSizing: 'border-box',
                    backgroundColor: (theme) => theme.palette.background.default,
                    color: (theme) => theme.palette.text.primary,
                }}
            >
                <Typography variant="h4" component="h1" sx={{ fontFamily: 'BBH Sans Hegarty', textAlign: 'center' }}>
                    What The Chant?
                </Typography>
                <Typography variant="subtitle1" component="p" sx={{ textAlign: 'center', marginBottom: '1rem' }}>
                    Find the chants for your next demo
                </Typography>
                <ChantList />
                <ChantSubmission availableCategories={CATEGORIES} />
            </Container>
        </ThemeProvider>
    )
}

export default App
