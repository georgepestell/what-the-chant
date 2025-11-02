import React, { useState } from 'react'
import {
    Box,
    Typography,
    Paper,
    Stack,
    TextField,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material'
import { Edit, Delete, Add } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Category } from '../App'

interface CategoryAdminProps {
    categories: Category[]
    onCategoriesChanged: () => void
}

const CategoryAdmin: React.FC<CategoryAdminProps> = ({ categories, onCategoriesChanged }) => {
    const { isAdmin } = useAuth()
    const navigate = useNavigate()
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [editedName, setEditedName] = useState('')
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')

    if (!isAdmin) {
        navigate('/')
        return null
    }

    const handleOpenEdit = (category: Category) => {
        setEditingCategory(category)
        setEditedName(category.name.toLowerCase())
        setEditDialogOpen(true)
    }

    const handleCloseEdit = () => {
        setEditDialogOpen(false)
        setEditingCategory(null)
        setEditedName('')
    }

    const handleSaveEdit = async () => {
        if (!editingCategory || !editedName.trim()) return

        try {
            const { error } = await supabase
                .from('categories')
                .update({ name: editedName.trim().toLowerCase() })
                .eq('id', editingCategory.id)

            if (error) throw error

            onCategoriesChanged()
            handleCloseEdit()
        } catch (error) {
            console.error('Error updating category:', error)
            alert('Failed to update category. Please try again.')
        }
    }

    const handleDelete = async (categoryId: number) => {
        if (!confirm('Are you sure you want to delete this category? This will remove it from all chants.')) {
            return
        }

        try {
            // Delete the category
            const { error: categoryError } = await supabase.from('categories').delete().eq('id', categoryId)
            if (categoryError) throw categoryError

            onCategoriesChanged()
        } catch (error) {
            console.error('Error deleting category:', error)
            alert('Failed to delete category. Please try again.')
        }
    }

    const handleOpenAdd = () => {
        setNewCategoryName('')
        setAddDialogOpen(true)
    }

    const handleCloseAdd = () => {
        setAddDialogOpen(false)
        setNewCategoryName('')
    }

    const handleSaveAdd = async () => {
        if (!newCategoryName.trim()) return

        try {
            const { error } = await supabase.from('categories').insert({ name: newCategoryName.trim().toLowerCase() })

            if (error) throw error

            onCategoriesChanged()
            handleCloseAdd()
        } catch (error) {
            console.error('Error adding category:', error)
            alert('Failed to add category. Please try again.')
        }
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontFamily: 'BBH Sans Hegarty' }}>
                    Manage Categories ({categories.length})
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
                    Add Category
                </Button>
            </Box>

            <Stack spacing={2}>
                {categories.map((category) => (
                    <Paper key={category.id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1">{category.name.toLowerCase()}</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton size="small" onClick={() => handleOpenEdit(category)} color="primary">
                                <Edit fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDelete(category.id)} color="error">
                                <Delete fontSize="small" />
                            </IconButton>
                        </Box>
                    </Paper>
                ))}
            </Stack>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Category Name"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value.toLowerCase())}
                        sx={{ mt: 2 }}
                        autoFocus
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEdit}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Dialog */}
            <Dialog open={addDialogOpen} onClose={handleCloseAdd} maxWidth="sm" fullWidth>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Category Name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value.toLowerCase())}
                        sx={{ mt: 2 }}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSaveAdd()
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAdd}>Cancel</Button>
                    <Button onClick={handleSaveAdd} variant="contained">
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default CategoryAdmin
