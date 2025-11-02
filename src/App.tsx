import './App.css'

import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Container, ThemeProvider, CssBaseline, useMediaQuery, Button, Box, Chip, Tabs, Tab } from '@mui/material'
import { lightTheme, darkTheme } from './theme/theme'
import { useAuth } from './contexts/AuthContext'
import { UserProfile } from './features/auth/UserProfile'
import Home from './pages/Home'
import ChantAdmin from './pages/ChantAdmin'
import CategoryAdmin from './pages/CategoryAdmin'
import { supabase } from './lib/supabase'

export type Category = { id: number; name: string }

function App() {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
    const [isDarkMode, setIsDarkMode] = useState(prefersDarkMode)
    const { isAdmin } = useAuth()
    const [categories, setCategories] = useState<Category[]>([])
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        const fetchCategories = async () => {
            const { data } = await supabase.from('categories').select('id, name')
            setCategories(data || [])
        }
        fetchCategories()
    }, [refreshKey])

    const toggleTheme = () => {
        setIsDarkMode((prevMode) => !prevMode)
    }

    const handleChantSubmitted = useCallback(() => {
        setRefreshKey((prev) => prev + 1)
    }, [])

    return (
        <Router>
            <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
                <CssBaseline />
                <AppContent
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
                    isAdmin={isAdmin}
                    categories={categories}
                    refreshKey={refreshKey}
                    handleChantSubmitted={handleChantSubmitted}
                />
            </ThemeProvider>
        </Router>
    )
}

interface AppContentProps {
    isDarkMode: boolean
    toggleTheme: () => void
    isAdmin: boolean
    categories: Category[]
    refreshKey: number
    handleChantSubmitted: () => void
}

const AppContent: React.FC<AppContentProps> = ({ isDarkMode, toggleTheme, isAdmin, categories, refreshKey, handleChantSubmitted }) => {
    const location = useLocation()
    const currentTab = location.pathname === '/submissions' ? 1 : location.pathname === '/categories' ? 2 : 0

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button variant="contained" onClick={toggleTheme}>
                        Switch to {isDarkMode ? 'Light' : 'Dark'} Mode
                    </Button>
                    {isAdmin && <Chip label="Admin" color="error" variant="filled" size="medium" />}
                </Box>
                <UserProfile />
            </Box>

            {isAdmin && (
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tabs value={currentTab} aria-label="navigation tabs">
                        <Tab label="Chants" component={Link} to="/" />
                        <Tab label="Submissions" component={Link} to="/submissions" />
                        <Tab label="Categories" component={Link} to="/categories" />
                    </Tabs>
                </Box>
            )}

            <Container
                maxWidth={false}
                sx={{
                    maxWidth: '900px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    padding: {
                        xs: '1rem 0.5rem',
                        sm: '2rem',
                    },
                    margin: '0 auto',
                    boxSizing: 'border-box',
                    backgroundColor: (theme) => theme.palette.background.default,
                    color: (theme) => theme.palette.text.primary,
                }}
            >
                <Routes>
                    <Route path="/" element={<Home key={refreshKey} categories={categories} onChantSubmitted={handleChantSubmitted} />} />
                    <Route
                        path="/submissions"
                        element={<ChantAdmin categories={categories} onCategoriesChanged={handleChantSubmitted} />}
                    />
                    <Route
                        path="/categories"
                        element={<CategoryAdmin categories={categories} onCategoriesChanged={handleChantSubmitted} />}
                    />
                </Routes>
            </Container>
        </>
    )
}

export default App
