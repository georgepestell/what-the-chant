import React, { useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, Box, Alert, IconButton } from '@mui/material'
import { SimpleClose } from '../../components/LazyIcons'
import { useAuth } from '../../hooks/useAuth'

interface DeleteAccountDialogProps {
    open: boolean
    onClose: () => void
}

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({ open, onClose }) => {
    const { user, deleteAccount } = useAuth()
    const [confirmText, setConfirmText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const expectedText = 'DELETE MY ACCOUNT'
    const isConfirmValid = confirmText === expectedText

    const handleClose = () => {
        if (!loading) {
            setConfirmText('')
            setError(null)
            onClose()
        }
    }

    const handleDeleteAccount = async () => {
        if (!isConfirmValid) return

        setLoading(true)
        setError(null)

        try {
            await deleteAccount()
            handleClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete account')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" color="error">
                    Delete Account
                </Typography>
                <IconButton onClick={handleClose} disabled={loading}>
                    <SimpleClose />
                </IconButton>
            </DialogTitle>

            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                        This action cannot be undone. This will permanently delete your account and remove all your data.
                    </Typography>

                    <Alert severity="error" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                            <strong>Warning:</strong> Deleting your account will:
                        </Typography>
                        <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 16 }}>
                            <li>Permanently delete all your submitted chants</li>
                            <li>Remove your favorites and preferences</li>
                            <li>Delete your account information</li>
                        </ul>
                    </Alert>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Your email: <strong>{user?.email}</strong>
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Please type <strong>{expectedText}</strong> to confirm:
                    </Typography>

                    <TextField
                        fullWidth
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={expectedText}
                        variant="outlined"
                        disabled={loading}
                        error={confirmText.length > 0 && !isConfirmValid}
                        helperText={confirmText.length > 0 && !isConfirmValid ? 'Text must match exactly' : ''}
                    />
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button variant="contained" color="error" onClick={handleDeleteAccount} disabled={!isConfirmValid || loading}>
                    {loading ? 'Deleting...' : 'Delete Account'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
