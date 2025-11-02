import React, { useState } from 'react'
import {
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    OutlinedInput,
    Alert,
    Snackbar,
    Divider,
} from '@mui/material'
import { Add, Send } from '@mui/icons-material'

interface ChantSubmissionProps {
    availableCategories: string[]
}

const ChantSubmission: React.FC<ChantSubmissionProps> = ({ availableCategories }) => {
    const [chantText, setChantText] = useState('')
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [newCategory, setNewCategory] = useState('')
    const [newCategories, setNewCategories] = useState<string[]>([])
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

    const handleCategoryChange = (event: { target: { value: string | string[] } }) => {
        const value = event.target.value
        setSelectedCategories(typeof value === 'string' ? value.split(',') : value)
    }

    const addNewCategory = () => {
        if (newCategory.trim() && !newCategories.includes(newCategory.trim()) && !availableCategories.includes(newCategory.trim())) {
            setNewCategories([...newCategories, newCategory.trim()])
            setNewCategory('')
        }
    }

    const removeNewCategory = (categoryToRemove: string) => {
        setNewCategories(newCategories.filter((cat) => cat !== categoryToRemove))
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

        setIsSubmitting(true)

        try {
            // Format the message for the existing Lambda endpoint
            const message = `
New Chant Submission:

📝 CHANT TEXT:
${chantText.trim()}

🏷️ EXISTING CATEGORIES:
${selectedCategories.length > 0 ? selectedCategories.join(', ') : 'None selected'}

🆕 NEW CATEGORIES:
${newCategories.length > 0 ? newCategories.join(', ') : 'None added'}

⏰ SUBMITTED AT:
${new Date().toLocaleString()}
            `.trim()

            const response = await fetch('https://cmuhiwgi05.execute-api.eu-north-1.amazonaws.com/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: 'What The Chant User',
                    email: 'chant-submissions@whatthechant.app',
                    message: message,
                }),
            })

            if (response.ok) {
                setNotification({
                    open: true,
                    message: 'Chant submitted successfully!',
                    severity: 'success',
                })

                // Reset form
                setChantText('')
                setSelectedCategories([])
                setNewCategories([])
            } else {
                throw new Error('Failed to submit chant')
            }
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
            <Typography variant="h5" gutterBottom sx={{ fontFamily: 'BBH Sans Hegarty' }}>
                Submit a New Chant
            </Typography>

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
                sx={{ mb: 3 }}
            />

            {/* Existing Categories Selection */}
            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Select Categories</InputLabel>
                <Select
                    multiple
                    value={selectedCategories}
                    onChange={handleCategoryChange}
                    input={<OutlinedInput label="Select Categories" />}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                            ))}
                        </Box>
                    )}
                >
                    {availableCategories
                        .filter((cat) => cat !== 'All')
                        .map((category) => (
                            <MenuItem key={category} value={category}>
                                {category}
                            </MenuItem>
                        ))}
                </Select>
            </FormControl>

            {/* New Category Input */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                    fullWidth
                    label="Add New Category"
                    placeholder="Enter a new category..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            addNewCategory()
                        }
                    }}
                />
                <Button
                    variant="outlined"
                    onClick={addNewCategory}
                    disabled={!newCategory.trim()}
                    startIcon={<Add />}
                    sx={{ minWidth: '120px' }}
                >
                    Add
                </Button>
            </Box>

            {/* New Categories Display */}
            {newCategories.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        New Categories:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {newCategories.map((category) => (
                            <Chip
                                key={category}
                                label={category}
                                onDelete={() => removeNewCategory(category)}
                                color="primary"
                                variant="outlined"
                            />
                        ))}
                    </Box>
                </Box>
            )}

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
