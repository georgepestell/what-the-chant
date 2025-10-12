import { createTheme } from '@mui/material/styles'

const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#d32f2f',
        },
        secondary: {
            main: '#212121',
        },
        background: {
            default: '#ffffff',
            paper: '#f5f5f5',
        },
        text: {
            primary: '#000000',
            secondary: '#4f4f4f',
        },
        error: {
            main: '#b71c1c',
        },
        warning: {
            main: '#ff9800',
        },
        info: {
            main: '#0288d1',
        },
        success: {
            main: '#388e3c',
        },
    },
    typography: {
        fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
        h1: {
            fontFamily: 'BBH Sans Hegarty',
            fontWeight: 400,
            fontSize: '3.2em',
            lineHeight: 1.1,
        },
        h2: {
            fontFamily: 'BBH Sans Hegarty',
            fontWeight: 400,
        },
        h3: {
            fontFamily: 'BBH Sans Hegarty',
            fontWeight: 400,
        },
        button: {
            fontWeight: 500,
            borderRadius: '8px',
            padding: '0.6em 1.2em',
            fontSize: '1em',
            textTransform: 'none',
        },
        body1: {
            lineHeight: 1.5,
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    margin: 0,
                    display: 'flex',
                    placeItems: 'center',
                    minWidth: '320px',
                    minHeight: '100vh',
                    color: '#000000',
                    backgroundColor: '#ffffff',
                    fontSynthesis: 'none',
                    textRendering: 'optimizeLegibility',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                },
                a: {
                    fontWeight: 500,
                    color: '#1976d2',
                    textDecoration: 'inherit',
                    '&:hover': {
                        color: '#1565c0',
                    },
                },
                button: {
                    backgroundColor: '#f5f5f5',
                    cursor: 'pointer',
                    transition: 'border-color 0.25s',
                    '&:hover': {
                        borderColor: '#1976d2',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    color: '#FFFFFF', // Default button text color for light theme
                },
            },
        },
    },
})

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#d32f2f',
        },
        secondary: {
            main: '#212121',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
        text: {
            primary: '#ffffff',
            secondary: '#b0b0b0',
        },
        error: {
            main: '#b71c1c',
        },
        warning: {
            main: '#ff9800',
        },
        info: {
            main: '#0288d1',
        },
        success: {
            main: '#388e3c',
        },
    },
    typography: {
        fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
        h1: {
            fontFamily: 'BBH Sans Hegarty',
            fontWeight: 400,
            fontSize: '3.2em',
            lineHeight: 1.1,
        },
        h2: {
            fontFamily: 'BBH Sans Hegarty',
            fontWeight: 400,
        },
        h3: {
            fontFamily: 'BBH Sans Hegarty',
            fontWeight: 400,
        },
        button: {
            fontWeight: 500,
            borderRadius: '8px',
            padding: '0.6em 1.2em',
            fontSize: '1em',
            textTransform: 'none',
        },
        body1: {
            lineHeight: 1.5,
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    margin: 0,
                    display: 'flex',
                    placeItems: 'center',
                    minWidth: '320px',
                    minHeight: '100vh',
                    color: '#ffffff',
                    backgroundColor: '#121212',
                    fontSynthesis: 'none',
                    textRendering: 'optimizeLegibility',
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                },
                a: {
                    fontWeight: 500,
                    color: '#90caf9',
                    textDecoration: 'inherit',
                    '&:hover': {
                        color: '#64b5f6',
                    },
                },
                button: {
                    backgroundColor: '#1e1e1e',
                    cursor: 'pointer',
                    transition: 'border-color 0.25s',
                    '&:hover': {
                        borderColor: '#90caf9',
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    color: '#ffffff', // Default button text color for dark theme
                },
            },
        },
    },
})

export { lightTheme, darkTheme }
