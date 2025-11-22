import React, { useState } from 'react'
import { Paper, TextField, Button, Typography, Box, Chip, Alert, Snackbar, Divider } from '@mui/material'
import Add from '@mui/icons-material/Add'
import Send from '@mui/icons-material/Send'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../App'

interface ChantSubmissionProps {
    availableCategories: Category[]
    onChantSubmitted?: () => void
}

const ChantSubmission: React.FC<ChantSubmissionProps> = ({ availableCategories, onChantSubmitted }) => {
    const { user, isAdmin } = useAuth()
    const [chantText, setChantText] = useState('')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [newCategory, setNewCategory] = useState('')
    const [localCategories, setLocalCategories] = useState<string[]>([]) // Categories added locally but not yet in DB
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [notification, setNotification] = useState<{
        open: boolean
        message: string
        severity: 'success' | 'error'
    }>({
        open: false,
        message: '',
        severity: 'success',
    })

    // Combine available categories from DB with locally added ones
    const availableCategoryNames = availableCategories.map((cat) => cat.name)
    const allCategories = [...availableCategoryNames, ...localCategories]

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((cat) => cat !== category) : [...prev, category]))
    }

    const addNewCategory = () => {
        const trimmed = newCategory.trim().toLowerCase()
        if (trimmed && !allCategories.includes(trimmed)) {
            // Add to local categories list (not selected by default)
            setLocalCategories([...localCategories, trimmed])
            setNewCategory('')
        }
    }

    const handleSubmit = async () => {
        if (!chantText.trim()) {
            setNotification({
                open: true,
                message: 'Please enter a chant text',
                severity: 'error',
            })
            return
        }

        if (!user?.id) {
            setNotification({
                open: true,
                message: 'You must be logged in to submit a chant',
                severity: 'error',
            })
            return
        }

        setIsSubmitting(true)

        try {
            if (isAdmin) {
                // Admin flow: Insert directly to chants table
                const existingCategories = selectedCategories.filter((cat) => availableCategoryNames.includes(cat))
                const newCategories = selectedCategories.filter((cat) => !availableCategoryNames.includes(cat))

                // Step 1: Insert the chant and get its ID
                const { data: chantData, error: chantError } = await supabase
                    .from('chants')
                    .insert({
                        text: chantText.trim(),
                    })
                    .select('id')
                    .single()

                if (chantError || !chantData) {
                    throw chantError || new Error('Failed to create chant')
                }

                const chantId = chantData.id

                // Step 2: Create any new categories
                const newCategoryIds: number[] = []
                if (newCategories.length > 0) {
                    const { data: newCatData, error: newCatError } = await supabase
                        .from('categories')
                        .insert(newCategories.map((name) => ({ name })))
                        .select('id')

                    if (newCatError) {
                        throw newCatError
                    }

                    if (newCatData) {
                        newCategoryIds.push(...newCatData.map((cat) => cat.id))
                    }
                }

                // Step 3: Get IDs of existing categories from passed data
                const existingCategoryIds = availableCategories.filter((cat) => existingCategories.includes(cat.name)).map((cat) => cat.id)

                // Step 4: Link chant to categories
                const allCategoryIds = [...existingCategoryIds, ...newCategoryIds]
                if (allCategoryIds.length > 0) {
                    const { error: linkError } = await supabase
                        .from('chant_categories')
                        .insert(allCategoryIds.map((category_id) => ({ chant_id: chantId, category_id })))

                    if (linkError) {
                        throw linkError
                    }
                }

                setNotification({
                    open: true,
                    message: 'Chant submitted successfully!',
                    severity: 'success',
                })

                // Notify parent to refresh chants
                onChantSubmitted?.()
            } else {
                // Non-admin flow: Submit to chant_submissions table
                const existingCategories = selectedCategories.filter((cat) => availableCategoryNames.includes(cat))
                const newCategories = selectedCategories.filter((cat) => !availableCategoryNames.includes(cat))

                // Get IDs of existing categories
                const existingCategoryIds = availableCategories.filter((cat) => existingCategories.includes(cat.name)).map((cat) => cat.id)

                // Create JSON object with all submission data
                const chantData = {
                    text: chantText.trim(),
                    existingCategoryIds,
                    newCategoryNames: newCategories,
                }

                // Insert to chant_submissions
                const { error: submissionError } = await supabase.from('chant_submissions').insert({
                    user_id: user.id,
                    chant: chantData,
                    status: 'pending',
                })

                if (submissionError) {
                    throw submissionError
                }

                setNotification({
                    open: true,
                    message: 'Chant submitted for review!',
                    severity: 'success',
                })
            }

            // Reset form
            setChantText('')
            setSelectedCategories([])
            setLocalCategories([]) // Clear local categories after submission
        } catch (error) {
            console.error('Error submitting chant:', error)
            setNotification({
                open: true,
                message: 'Failed to submit chant. Please try again.',
                severity: 'error',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCloseNotification = () => {
        setNotification({ ...notification, open: false })
    }

    return (
        <Paper
            elevation={3}
            sx={{
                padding: 3,
                marginTop: 4,
                backgroundColor: 'background.paper',
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontFamily: 'BBH Sans Hegarty' }}>
                    Submit a New Chant
                </Typography>
                {user && <Chip label="Authenticated" color="success" size="small" variant="outlined" />}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Help us grow our collection! Submit your chant ideas and we'll review them for inclusion.
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {/* Chant Text Input */}
            <TextField
                fullWidth
                multiline
                rows={4}
                label="Chant Text"
                placeholder="Enter your chant here..."
                value={chantText}
                onChange={(e) => setChantText(e.target.value)}
                required
                sx={{ mb: 3 }}
            />

            {/* Categories Section */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Select Categories (optional)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {allCategories.map((category) => (
                    <Chip
                        key={category.toLowerCase()}
                        label={category.toLowerCase()}
                        color={selectedCategories.includes(category.toLowerCase()) ? 'primary' : 'default'}
                        onClick={() => handleCategoryToggle(category.toLowerCase())}
                        clickable
                    />
                ))}
            </Box>

            {/* New Category Input with Plus Button */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <TextField
                    fullWidth
                    size="small"
                    label="Add New Category"
                    placeholder="Enter a new category..."
                    value={newCategory.toLowerCase()}
                    onChange={(e) => setNewCategory(e.target.value.toLowerCase())}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            addNewCategory()
                        }
                    }}
                />
                <Button variant="contained" onClick={addNewCategory} disabled={!newCategory.trim()} sx={{ minWidth: '56px', px: 2 }}>
                    <Add />
                </Button>
            </Box>

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !chantText.trim()}
                    startIcon={<Send />}
                    sx={{
                        minWidth: '150px',
                        textTransform: 'none',
                    }}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Chant'}
                </Button>
            </Box>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseNotification} severity={notification.severity}>
                    {notification.message}
                </Alert>
            </Snackbar>
        </Paper>
    )
}

export default ChantSubmission
