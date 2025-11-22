import React, { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Chip, IconButton, Button, Typography } from '@mui/material'
import Add from '@mui/icons-material/Add'
import type { Category } from '../../../App'

interface EditChantDialogProps {
    open: boolean
    chantId: number
    initialText: string
    initialCategories: string[]
    availableCategories: Category[]
    onClose: () => void
    onSave: (chantId: number, text: string, categoryIds: number[], newCategories: string[]) => void
}

const EditChantDialog: React.FC<EditChantDialogProps> = ({
    open,
    chantId,
    initialText,
    initialCategories,
    availableCategories,
    onClose,
    onSave,
}) => {
    const [editedText, setEditedText] = useState('')
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
    const [newCategoryInput, setNewCategoryInput] = useState('')
    const [localNewCategories, setLocalNewCategories] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            setEditedText(initialText)
            // Map category names to IDs
            const categoryIds = initialCategories
                .map((name) => availableCategories.find((cat) => cat.name === name)?.id)
                .filter((id): id is number => id !== undefined)
            setSelectedCategoryIds(categoryIds)
            setLocalNewCategories([])
            setNewCategoryInput('')
        }
    }, [open, initialText, initialCategories, availableCategories])

    const handleToggleCategory = (categoryId: number) => {
        setSelectedCategoryIds((prev) => (prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]))
    }

    const handleAddNewCategory = () => {
        const trimmed = newCategoryInput.trim().toLowerCase()
        const allCategoryNames = [...availableCategories.map((c) => c.name), ...localNewCategories]
        if (trimmed && !allCategoryNames.includes(trimmed)) {
            setLocalNewCategories([...localNewCategories, trimmed])
            setNewCategoryInput('')
        }
    }

    const handleRemoveNewCategory = (categoryName: string) => {
        setLocalNewCategories((prev) => prev.filter((name) => name !== categoryName))
    }

    const handleSave = () => {
        onSave(chantId, editedText, selectedCategoryIds, localNewCategories)
        onClose()
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Edit Chant</DialogTitle>
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
                    Categories
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {availableCategories.map((category) => (
                        <Chip
                            key={category.id}
                            label={category.name.toLowerCase()}
                            color={selectedCategoryIds.includes(category.id) ? 'primary' : 'default'}
                            onClick={() => handleToggleCategory(category.id)}
                            clickable
                        />
                    ))}
                </Box>

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    New Categories
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {localNewCategories.map((name) => (
                        <Chip key={name} label={name} color="primary" variant="outlined" onDelete={() => handleRemoveNewCategory(name)} />
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

                {localNewCategories.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Note: New categories will be created when you save.
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default EditChantDialog
