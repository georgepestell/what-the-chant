import React, { useState } from 'react'
import { Button, Menu, MenuItem, Avatar, Box, Typography, IconButton, Divider } from '@mui/material'
import { LazyAccountCircle, LazyLogin, LazyLogout } from '../../components/LazyIcons'
import { useAuth } from '../../contexts/AuthContext'
import { AuthDialog } from './AuthDialog'
import { ChangePasswordDialog } from './ChangePasswordDialog'
import { DeleteAccountDialog } from './DeleteAccountDialog'

export function UserProfile() {
    const { user, signOut } = useAuth()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [authDialogOpen, setAuthDialogOpen] = useState(false)
    const [changePasswordOpen, setChangePasswordOpen] = useState(false)
    const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const handleSignOut = async () => {
        await signOut()
        handleMenuClose()
    }

    if (!user) {
        return (
            <>
                <Button startIcon={<LazyLogin />} variant="outlined" onClick={() => setAuthDialogOpen(true)} sx={{ minWidth: 'auto' }}>
                    Sign In
                </Button>
                <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
            </>
        )
    }

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={anchorEl ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={anchorEl ? 'true' : undefined}
            >
                {user.user_metadata?.avatar_url ? (
                    <Avatar src={user.user_metadata.avatar_url} sx={{ width: 32, height: 32 }} />
                ) : (
                    <Avatar sx={{ width: 32, height: 32 }}>
                        <LazyAccountCircle />
                    </Avatar>
                )}
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Signed in as
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {user.email}
                    </Typography>
                </Box>
                <MenuItem
                    onClick={() => {
                        setChangePasswordOpen(true)
                        handleMenuClose()
                    }}
                >
                    Change Password
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setDeleteAccountOpen(true)
                        handleMenuClose()
                    }}
                    sx={{ color: 'error.main' }}
                >
                    Delete Account
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleSignOut}>
                    <LazyLogout fontSize="small" sx={{ mr: 2 }} />
                    Sign Out
                </MenuItem>
            </Menu>
            <AuthDialog open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
            <ChangePasswordDialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} />
            <DeleteAccountDialog open={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)} />
        </Box>
    )
}
