import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Pagination,
  InputAdornment,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    status: '',
    password: '',
    museum_title: '',
    museum_description: '',
    museum_photo: null,
  });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.status !== 'superadmin') {
      navigate('/rooms');
      return;
    }

    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Error fetching users');
      if (err.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const openAddForm = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      status: '',
      password: '',
      museum_title: '',
      museum_description: '',
      museum_photo: null,
    });
    setPhotoPreview(null);
    setFormOpen(true);
  };

  const openEditForm = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      status: user.status || '',
      password: '',
      museum_title: user.museum?.title || '',
      museum_description: user.museum?.description || '',
      museum_photo: null, // reset to null, only set file if user uploads new one
    });
    setPhotoPreview(
      user.museum?.photo
        ? `https://nasro.expedgs-audioguide.duckdns.org/images/${user.museum.photo}`
        : null
    );
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormLoading(false);
    setPhotoPreview(null);
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'museum_photo') {
      const file = files[0];
      setFormData((prev) => ({ ...prev, museum_photo: file }));
      setPhotoPreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const uploadPhoto = async () => {
    if (!formData.museum_photo) return '';
    const photoData = new FormData();
    photoData.append('photo', formData.museum_photo);
    const photoRes = await api.post('/register/upload-photo', photoData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (photoRes.data.success) {
      return photoRes.data.filename;
    } else {
      throw new Error('Failed to upload photo');
    }
  };

  const submitForm = async () => {
    setFormLoading(true);
    setError('');
    try {
      let photoFilename = '';
      if (formData.museum_photo) {
        photoFilename = await uploadPhoto();
      } else if (selectedUser && selectedUser.museum?.photo) {
        photoFilename = selectedUser.museum.photo; // keep existing photo if not changed
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        status: formData.status,
        museum: {
          title: formData.museum_title,
          description: formData.museum_description,
          photo: photoFilename,
        },
      };

      if (!selectedUser) {
        // Creating new user requires password
        if (!formData.password) {
          setError('Password is required for new user');
          setFormLoading(false);
          return;
        }
        payload.password = formData.password;
        const res = await api.post('/users', payload);
        setUsers((prev) => [...prev, res.data]);
      } else {
        // Update user
        if (formData.password) {
          payload.password = formData.password;
        }
        const res = await api.put(`/users/${selectedUser.id}`, payload);
        setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? res.data : u)));
      }
      closeForm();
    } catch (err) {
      console.error('Error saving user:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save user');
      setFormLoading(false);
    }
  };

  // Delete handlers
  const openDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteOpen(false);
    setDeleteLoading(false);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/users/${selectedUser.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      closeDeleteDialog();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user');
      setDeleteLoading(false);
    }
  };

  // Filter users by search term (name)
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  // Pagination logic
  const pageCount = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div
      style={{
        marginLeft: 0,
        padding: 16,
        [theme.breakpoints.up('md')]: {
          marginLeft: 260,
          padding: 32,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          Users Management
        </Typography>

        <TextField
          size="small"
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 300, mr: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        <Button variant="contained" onClick={openAddForm}>
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table sx={{ minWidth: 650 }} aria-label="users table">
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
              {['ID', 'Name', 'Email', 'Status', 'Museum', 'Actions'].map((headCell) => (
                <TableCell
                  key={headCell}
                  sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}
                >
                  {headCell}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user, index) => (
                <TableRow
                  key={user.id}
                  sx={{
                    backgroundColor: index % 2 === 0 ? theme.palette.background.default : '#f9f9f9',
                    '&:hover': { backgroundColor: theme.palette.action.hover },
                  }}
                >
                  <TableCell>{user.id}</TableCell>
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {user.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.status}</TableCell>
                  <TableCell>{user.museum?.title || 'No museum'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button size="small" variant="outlined" onClick={() => openEditForm(user)}>
                        Edit
                      </Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => openDeleteDialog(user)}>
                        Delete
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* User Form Modal */}
      <Dialog open={formOpen} onClose={closeForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add User'}
          <IconButton
            aria-label="close"
            onClick={closeForm}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            margin="dense"
            label="Name"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleFormChange}
          />
          <TextField
            margin="dense"
            label="Email"
            name="email"
            fullWidth
            value={formData.email}
            onChange={handleFormChange}
          />
          {!selectedUser && (
            <TextField
              margin="dense"
              label="Password"
              name="password"
              type="password"
              fullWidth
              value={formData.password}
              onChange={handleFormChange}
            />
          )}
          <TextField
            margin="dense"
            label="Status"
            name="status"
            fullWidth
            value={formData.status}
            onChange={handleFormChange}
          />
          <TextField
            margin="dense"
            label="Museum Title"
            name="museum_title"
            fullWidth
            value={formData.museum_title}
            onChange={handleFormChange}
          />
          <TextField
            margin="dense"
            label="Museum Description"
            name="museum_description"
            fullWidth
            multiline
            rows={3}
            value={formData.museum_description}
            onChange={handleFormChange}
          />
          <Button variant="contained" component="label" fullWidth sx={{ mt: 2 }}>
            Upload Museum Photo
            <input type="file" name="museum_photo" accept="image/*" hidden onChange={handleFormChange} />
          </Button>
          {photoPreview && (
            <Box mt={2} textAlign="center">
              <img src={photoPreview} alt="Museum Preview" style={{ maxWidth: '100%', maxHeight: 200 }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeForm} disabled={formLoading}>
            Cancel
          </Button>
          <Button onClick={submitForm} variant="contained" disabled={formLoading}>
            {formLoading ? 'Saving...' : selectedUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user{' '}
            <strong>{selectedUser?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default UsersPage;