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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Box,
  Typography,
  Pagination,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import RoomIcon from '@mui/icons-material/Room';
import './global.css';

function MuseumsPage() {
  const [museums, setMuseums] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [museumToDelete, setMuseumToDelete] = useState(null);
  const [editMuseum, setEditMuseum] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', photo: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Search and pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const theme = useTheme();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/museums');
      setMuseums(res.data);
      setError('');
    } catch (error) {
      console.error('Error fetching museums:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Error fetching museums');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.status !== 'superadmin') {
      navigate('/rooms');
      return;
    }
    fetchData();
  }, [navigate]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleOpen = (museum = null) => {
    setEditMuseum(museum);
    setForm(
      museum
        ? {
            title: museum.title,
            description: museum.description,
            photo: museum.photo || '',
          }
        : { title: '', description: '', photo: '' }
    );
    setOpen(true);
    setError('');
    setSelectedFile(null);
  };

  const handleClose = () => {
    setOpen(false);
    setEditMuseum(null);
    setError('');
    setSelectedFile(null);
    setFormLoading(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      setError('Please fill in all required fields');
      return;
    }
    setFormLoading(true);
    try {
      let photoFilename = form.photo; // Use existing photo if not uploading new

      // Upload new photo if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('photo', selectedFile);

        const uploadRes = await api.post('/museums/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        photoFilename = uploadRes.data.filename;
      }

      const submitData = {
        ...form,
        photo: photoFilename,
      };

      if (editMuseum) {
        await api.put(`/museums/${editMuseum.id}`, submitData);
      } else {
        await api.post('/museums', submitData);
      }
      await fetchData();
      handleClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving museum');
      console.error('Error:', error);
      setFormLoading(false);
    }
  };

  const handleDeleteClick = (museum) => {
    setMuseumToDelete(museum);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/museums/${museumToDelete.id}`);
      await fetchData();
      setDeleteDialogOpen(false);
      setMuseumToDelete(null);
    } catch (error) {
      setError('Error deleting museum');
      console.error('Error:', error);
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setMuseumToDelete(null);
    setDeleteLoading(false);
  };

  const handleViewRooms = (museum) => {
    navigate(`/rooms?museum=${museum.id}&museumName=${encodeURIComponent(museum.title)}`);
  };

  // Filter museums by search
  const filteredMuseums = museums.filter((museum) =>
    museum.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  // Pagination logic
  const pageCount = Math.ceil(filteredMuseums.length / itemsPerPage);
  const paginatedMuseums = filteredMuseums.slice((page - 1) * itemsPerPage, page * itemsPerPage);

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
      {/* Header with Title, Search Bar, and Add Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2,
          flexWrap: { xs: 'wrap', md: 'nowrap' },
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            minWidth: 'fit-content',
            flexShrink: 0,
          }}
        >
          Museums Management
        </Typography>

        <TextField
          size="small"
          placeholder="Search by museum title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            flexGrow: 1,
            maxWidth: { xs: '100%', md: '400px' },
            mx: 2,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen()}
          sx={{
            minWidth: 'fit-content',
            flexShrink: 0,
          }}
          type="button"
        >
          Add Museum
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 650 }} aria-label="museums table">
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                {['ID', 'Title', 'Description', 'Photo', 'Actions'].map((headCell) => (
                  <TableCell key={headCell} sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
                    {headCell}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMuseums.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    {search ? `No museums found matching "${search}"` : 'No museums found.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMuseums.map((museum, index) => (
                  <TableRow
                    key={museum.id}
                    sx={{
                      backgroundColor: index % 2 === 0 ? theme.palette.background.default : '#f9f9f9',
                      '&:hover': { backgroundColor: theme.palette.action.hover },
                    }}
                  >
                    <TableCell>{museum.id}</TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {museum.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 250,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={museum.description}
                      >
                        {museum.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {museum.photo ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img
                            src={`https://nasro.expedgs-audioguide.duckdns.org/images/${museum.photo}`}
                            alt={`Museum ${museum.title}`}
                            style={{
                              width: 56,
                              height: 56,
                              objectFit: 'cover',
                              borderRadius: 6,
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setModalImageSrc(`https://nasro.expedgs-audioguide.duckdns.org/images/${museum.photo}`);
                              setImageModalOpen(true);
                            }}
                            type="button"
                          >
                            View
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No Photo
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          onClick={() => handleViewRooms(museum)}
                          startIcon={<RoomIcon />}
                          sx={{ minWidth: 'auto' }}
                          type="button"
                        >
                          Rooms
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => handleOpen(museum)} type="button">
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDeleteClick(museum)}
                          type="button"
                        >
                          Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* Pagination */}
      {!loading && pageCount > 1 && (
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

      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{editMuseum ? 'Edit Museum' : 'Add Museum'}</DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 3,
            }}
          >
            {/* Image Preview */}
            <Box sx={{ mb: 2 }}>
              {selectedFile ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  style={{
                    width: 140,
                    height: 140,
                    objectFit: 'cover',
                    borderRadius: 10,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                />
              ) : form.photo ? (
                <img
                  src={`https://nasro.expedgs-audioguide.duckdns.org/images/${form.photo}`}
                  alt="Current"
                  style={{
                    width: 140,
                    height: 140,
                    objectFit: 'cover',
                    borderRadius: 10,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 140,
                    height: 140,
                    borderRadius: 10,
                    border: `2px dashed ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.palette.text.disabled,
                    fontSize: 14,
                  }}
                >
                  No Image
                </Box>
              )}
            </Box>

            {/* File Upload Button */}
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="photo-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="photo-upload">
              <Button variant="outlined" component="span" sx={{ mb: 2 }} aria-label="Upload Museum Photo">
                {selectedFile ? 'Change Photo' : 'Upload Photo'}
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                Selected: {selectedFile.name}
              </Typography>
            )}
          </Box>

          <TextField
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            inputProps={{ maxLength: 255 }}
          />
          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={formLoading} type="button">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={formLoading} type="button">
            {editMuseum ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this museum?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleteLoading} type="button">
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm} disabled={deleteLoading} type="button">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onClose={() => setImageModalOpen(false)} maxWidth="md">
        <DialogContent
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 2,
          }}
        >
          <img
            src={modalImageSrc}
            alt="Museum"
            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MuseumsPage;