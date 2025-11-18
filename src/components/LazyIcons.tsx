import React, { lazy, Suspense } from 'react'
import { SvgIcon, type SvgIconProps } from '@mui/material'

// Simple fallback icon component
const FallbackIcon: React.FC<SvgIconProps> = (props) => (
    <SvgIcon {...props}>
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    </SvgIcon>
)

// Lazy load icon function
const createLazyIcon = (iconName: string) => {
    const LazyIcon = lazy(() =>
        import('@mui/icons-material').then((module) => ({
            default: (module as Record<string, React.ComponentType<SvgIconProps>>)[iconName] || FallbackIcon,
        })),
    )

    return (props: SvgIconProps) => (
        <Suspense fallback={<FallbackIcon {...props} />}>
            <LazyIcon {...props} />
        </Suspense>
    )
}

// Pre-create commonly used icons for better performance
export const LazyFavorite = createLazyIcon('Favorite')
export const LazyFavoriteBorder = createLazyIcon('FavoriteBorder')
export const LazyDelete = createLazyIcon('Delete')
export const LazyEdit = createLazyIcon('Edit')
export const LazyAdd = createLazyIcon('Add')
export const LazySearch = createLazyIcon('Search')
export const LazyClose = createLazyIcon('Close')
export const LazyLock = createLazyIcon('Lock')
export const LazyLockOpen = createLazyIcon('LockOpen')
export const LazyExpandMore = createLazyIcon('ExpandMore')
export const LazyExpandLess = createLazyIcon('ExpandLess')
export const LazyAccountCircle = createLazyIcon('AccountCircle')
export const LazyLogin = createLazyIcon('Login')
export const LazyLogout = createLazyIcon('Logout')
export const LazySend = createLazyIcon('Send')

// Alternative: Simple SVG replacements for critical icons (even faster)
export const SimpleFavorite: React.FC<SvgIconProps> = (props) => (
    <SvgIcon {...props}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </SvgIcon>
)

export const SimpleFavoriteBorder: React.FC<SvgIconProps> = (props) => (
    <SvgIcon {...props}>
        <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
    </SvgIcon>
)

export const SimpleSearch: React.FC<SvgIconProps> = (props) => (
    <SvgIcon {...props}>
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </SvgIcon>
)

export const SimpleAdd: React.FC<SvgIconProps> = (props) => (
    <SvgIcon {...props}>
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </SvgIcon>
)

export const SimpleClose: React.FC<SvgIconProps> = (props) => (
    <SvgIcon {...props}>
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </SvgIcon>
)
