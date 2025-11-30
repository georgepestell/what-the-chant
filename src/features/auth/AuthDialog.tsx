import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Dialog, DialogTitle, DialogContent, TextField, Button, Box, Typography, Alert, IconButton } from '@mui/material'
import Close from '@mui/icons-material/Close'
import { useAuth } from '../../hooks/useAuth'

interface AuthDialogProps {
    open: boolean
    onClose: () => void
}

export const AuthDialog: React.FC<AuthDialogProps> = ({ open, onClose }) => {
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const { signIn, signUp } = useAuth()

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Please enter your email to reset your password.')
            return
        }
        setLoading(true)
        setError(null)
        setSuccess(null)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email)
            if (error) {
                setError(error.message)
            } else {
                setSuccess('Password reset email sent! Check your inbox.')
            }
        } catch {
            setError('Failed to send password reset email.')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password || (isSignUp && !displayName)) {
            setError('Please fill in all fields')
            return
        }

        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            let result
            if (isSignUp) {
                result = await signUp(email, password, { displayName })
                if (!result.error) {
                    setSuccess('Account created! Check your email to verify your account.')
                    setEmail('')
                    setPassword('')
                    setDisplayName('')
                    setIsSignUp(false)
                }
            } else {
                result = await signIn(email, password)
                if (!result.error) {
                    onClose()
                }
            }

            if (result.error) {
                setError(result.error.message)
            }
        } catch (err) {
            console.error('Auth error:', err)
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setEmail('')
        setPassword('')
        setDisplayName('')
        setError(null)
        setSuccess(null)
        setIsSignUp(false)
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{isSignUp ? 'Create Account' : 'Sign In'}</Typography>
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

                <form onSubmit={handleSubmit}>
                    {isSignUp && (
                        <TextField
                            fullWidth
                            label="Display Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            margin="normal"
                            required
                        />
                    )}
                    <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        required
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        required
                    />

                    {!isSignUp && (
                        <Box textAlign="right" sx={{ mt: 1 }}>
                            <Button variant="text" size="small" onClick={handleForgotPassword} disabled={loading}>
                                Forgot Password?
                            </Button>
                        </Box>
                    )}

                    <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, mb: 2 }}>
                        {(() => {
                            if (loading) return 'Loading...'
                            return isSignUp ? 'Create Account' : 'Sign In'
                        })()}
                    </Button>
                </form>

                <Box textAlign="center" sx={{ mt: 2 }}>
                    <Button variant="text" onClick={() => setIsSignUp(!isSignUp)} disabled={loading}>
                        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    )
}
