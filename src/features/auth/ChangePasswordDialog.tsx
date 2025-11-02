import React, { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, TextField, Button, Box, Typography, Alert, IconButton } from '@mui/material'
import { Close } from '@mui/icons-material'
import { supabase } from '../../lib/supabase'

interface ChangePasswordDialogProps {
    open: boolean
    onClose: () => void
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ open, onClose }) => {
    const [newPassword, setNewPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) {
                setError(error.message)
            } else {
                setSuccess('Password updated successfully!')
                setNewPassword('')
            }
        } catch {
            setError('Failed to update password.')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setNewPassword('')
        setError(null)
        setSuccess(null)
        onClose()
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Change Password</Typography>
                    <IconButton onClick={handleClose}>
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}
                <form onSubmit={handleChangePassword}>
                    <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        margin="normal"
                        required
                    />
                    <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3 }}>
                        {loading ? 'Updating...' : 'Change Password'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
