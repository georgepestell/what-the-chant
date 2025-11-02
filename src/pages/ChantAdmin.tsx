import React, { useEffect, useState } from 'react'
import {
    Box,
    Typography,
    Paper,
    Chip,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
} from '@mui/material'
import { Edit, Add } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Category } from '../App'

type ChantSubmission = {
    id: number
    user_id: string
    chant: {
        text: string
        existingCategoryIds: number[]
        newCategoryNames: string[]
    }
    status: string
    created_at: string
}

interface ChantAdminProps {
    categories: Category[]
    onCategoriesChanged?: () => void
}

const ChantAdmin: React.FC<ChantAdminProps> = ({ categories, onCategoriesChanged }) => {
    const { isAdmin } = useAuth()
    const navigate = useNavigate()
    const [submissions, setSubmissions] = useState<ChantSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingSubmission, setEditingSubmission] = useState<ChantSubmission | null>(null)
    const [editedText, setEditedText] = useState('')
    const [editedExistingCategories, setEditedExistingCategories] = useState<number[]>([])
    const [editedNewCategories, setEditedNewCategories] = useState<string[]>([])
    const [newCategoryInput, setNewCategoryInput] = useState('')

    useEffect(() => {
        if (!isAdmin) {
            navigate('/')
            return
        }

        const fetchSubmissions = async () => {
            try {
                const { data, error } = await supabase
                    .from('chant_submissions')
                    .select('*')
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false })

                if (error) throw error
                setSubmissions(data || [])
            } catch (error) {
                console.error('Error fetching submissions:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSubmissions()
    }, [isAdmin, navigate])

    const handleOpenEdit = (submission: ChantSubmission) => {
        setEditingSubmission(submission)
        setEditedText(submission.chant.text)
        setEditedExistingCategories(submission.chant.existingCategoryIds)
        setEditedNewCategories(submission.chant.newCategoryNames)
        setNewCategoryInput('')
        setEditDialogOpen(true)
    }

    const handleCloseEdit = () => {
        setEditDialogOpen(false)
        setEditingSubmission(null)
        setEditedText('')
        setEditedExistingCategories([])
        setEditedNewCategories([])
        setNewCategoryInput('')
    }

    const handleSaveEdit = async () => {
        if (!editingSubmission) return

        try {
            // Update the submission in the database
            const { error } = await supabase
                .from('chant_submissions')
                .update({
                    chant: {
                        text: editedText,
                        existingCategoryIds: editedExistingCategories,
                        newCategoryNames: editedNewCategories,
                    },
                })
                .eq('id', editingSubmission.id)

            if (error) throw error

            // Update the submission in local state with edited values
            setSubmissions((prev) =>
                prev.map((s) =>
                    s.id === editingSubmission.id
                        ? {
                              ...s,
                              chant: {
                                  text: editedText,
                                  existingCategoryIds: editedExistingCategories,
                                  newCategoryNames: editedNewCategories,
                              },
                          }
                        : s,
                ),
            )
            handleCloseEdit()
        } catch (error) {
            console.error('Error saving submission edit:', error)
            alert('Failed to save changes. Please try again.')
        }
    }

    const handleToggleExistingCategory = (categoryId: number) => {
        setEditedExistingCategories((prev) => (prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]))
    }

    const handleAddNewCategory = () => {
        const trimmed = newCategoryInput.trim().toLowerCase()
        if (trimmed && !editedNewCategories.includes(trimmed)) {
            setEditedNewCategories([...editedNewCategories, trimmed])
            setNewCategoryInput('')
        }
    }

    const handleRemoveNewCategory = (categoryName: string) => {
        setEditedNewCategories((prev) => prev.filter((name) => name !== categoryName))
    }

    const handleApprove = async (submission: ChantSubmission) => {
        try {
            // Use a transaction-like approach by doing all operations before updating status
            // Step 1: Insert the chant
            const { data: chantData, error: chantError } = await supabase
                .from('chants')
                .insert({
                    text: submission.chant.text,
                })
                .select('id')
                .single()

            if (chantError || !chantData) {
                throw chantError || new Error('Failed to create chant')
            }

            const chantId = chantData.id

            // Step 2: Create any new categories
            const newCategoryIds: number[] = []
            if (submission.chant.newCategoryNames.length > 0) {
                const { data: newCatData, error: newCatError } = await supabase
                    .from('categories')
                    .insert(submission.chant.newCategoryNames.map((name) => ({ name: name.toLowerCase() })))
                    .select('id')

                if (newCatError) {
                    throw newCatError
                }

                if (newCatData) {
                    newCategoryIds.push(...newCatData.map((cat) => cat.id))
                }
            }

            // Step 3: Link chant to categories
            const allCategoryIds = [...submission.chant.existingCategoryIds, ...newCategoryIds]
            if (allCategoryIds.length > 0) {
                const { error: linkError } = await supabase
                    .from('chant_categories')
                    .insert(allCategoryIds.map((category_id) => ({ chant_id: chantId, category_id })))

                if (linkError) {
                    throw linkError
                }
            }

            // Step 4: Only update submission status after all operations succeed
            const { error: updateError } = await supabase.from('chant_submissions').update({ status: 'accepted' }).eq('id', submission.id)

            if (updateError) {
                throw updateError
            }

            // Update local state
            setSubmissions((prev) => prev.filter((s) => s.id !== submission.id))

            // Refresh categories if new ones were created
            if (submission.chant.newCategoryNames.length > 0) {
                onCategoriesChanged?.()
            }
        } catch (error) {
            console.error('Error approving submission:', error)
            alert('Failed to approve submission. Please try again.')
        }
    }

    const handleReject = async (submissionId: number) => {
        try {
            const { error } = await supabase.from('chant_submissions').update({ status: 'rejected' }).eq('id', submissionId)

            if (error) throw error

            setSubmissions((prev) => prev.filter((s) => s.id !== submissionId))
        } catch (error) {
            console.error('Error rejecting submission:', error)
            alert('Failed to reject submission. Please try again.')
        }
    }

    const getCategoryName = (categoryId: number): string => {
        return categories.find((cat) => cat.id === categoryId)?.name.toLowerCase() || 'Unknown'
    }

    if (!isAdmin) {
        return null
    }

    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Loading submissions...</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="h5" sx={{ mb: 3, fontFamily: 'BBH Sans Hegarty' }}>
                Chant Submissions ({submissions.length})
            </Typography>

            {submissions.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">No pending submissions</Typography>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {submissions.map((submission) => (
                        <Paper key={submission.id} sx={{ p: 3 }}>
                            <Typography
                                variant="body1"
                                sx={{
                                    mb: 2,
                                    whiteSpace: 'pre-wrap',
                                    fontWeight: 500,
                                }}
                            >
                                {submission.chant.text}
                            </Typography>

                            {/* Categories */}
                            {(submission.chant.existingCategoryIds.length > 0 || submission.chant.newCategoryNames.length > 0) && (
                                <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {submission.chant.existingCategoryIds.map((categoryId) => (
                                        <Chip key={categoryId} label={getCategoryName(categoryId)} size="small" />
                                    ))}
                                    {submission.chant.newCategoryNames.map((name) => (
                                        <Chip
                                            key={name.toLowerCase()}
                                            label={name.toLowerCase()}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Submitted: {new Date(submission.created_at).toLocaleString()}
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <IconButton size="small" onClick={() => handleOpenEdit(submission)} color="primary">
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <Button variant="outlined" color="error" size="small" onClick={() => handleReject(submission.id)}>
                                        Reject
                                    </Button>
                                    <Button variant="contained" color="success" size="small" onClick={() => handleApprove(submission)}>
                                        Approve
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    ))}
                </Stack>
            )}

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={handleCloseEdit} maxWidth="md" fullWidth>
                <DialogTitle>Edit Submission</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Chant Text"
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        sx={{ mt: 2, mb: 3 }}
                    />

                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Existing Categories
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                        {categories.map((category) => (
                            <Chip
                                key={category.id}
                                label={category.name.toLowerCase()}
                                color={editedExistingCategories.includes(category.id) ? 'primary' : 'default'}
                                onClick={() => handleToggleExistingCategory(category.id)}
                                clickable
                            />
                        ))}
                    </Box>

                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        New Categories
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {editedNewCategories.map((name) => (
                            <Chip
                                key={name.toLowerCase()}
                                label={name.toLowerCase()}
                                color="primary"
                                variant="outlined"
                                onDelete={() => handleRemoveNewCategory(name.toLowerCase())}
                            />
                        ))}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Add New Category"
                            value={newCategoryInput.toLowerCase()}
                            onChange={(e) => setNewCategoryInput(e.target.value.toLowerCase())}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleAddNewCategory()
                                }
                            }}
                        />
                        <IconButton color="primary" onClick={handleAddNewCategory}>
                            <Add />
                        </IconButton>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEdit}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained">
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default ChantAdmin
