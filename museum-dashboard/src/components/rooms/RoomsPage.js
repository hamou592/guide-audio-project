import React, { useEffect, useState } from 'react';
import api from '../../api';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Box,
  Typography,
  Chip,
  Pagination,
  CircularProgress,
  InputAdornment,
  Autocomplete
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';

function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [museums, setMuseums] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [editRoom, setEditRoom] = useState(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    museum_id: '',
    photo: ''
  });

  // Search, filter, and pagination
  const [search, setSearch] = useState('');
  const [museumFilter, setMuseumFilter] = useState(null); // now an object or null
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch rooms and museums (museums only for superadmin)
  const fetchData = async () => {
    try {
      setLoading(true);
      let roomsRes, museumsRes;
      if (user.status === 'superadmin') {
        [roomsRes, museumsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/museums')
        ]);
        setMuseums(museumsRes.data);
      } else {
        roomsRes = await api.get('/rooms');
        setMuseums([]); // No museums for admin
      }
      setRooms(roomsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();

      // Check for URL parameters to pre-filter by museum
      const urlParams = new URLSearchParams(location.search);
      const museumId = urlParams.get('museum');
      const museumName = urlParams.get('museumName');

      if (museumId && user?.status === 'superadmin') {
        // Find museum object by id
        const foundMuseum = museums.find(m => m.id.toString() === museumId);
        if (foundMuseum) {
          setMuseumFilter(foundMuseum);
        } else {
          // If museums not loaded yet, set id only, will update after fetch
          setMuseumFilter({ id: museumId, title: museumName || '' });
        }
      }
    }
    // eslint-disable-next-line
  }, [user, location.search, museums.length]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [search, museumFilter]);

  const handleOpen = (room = null) => {
    setEditRoom(room);
    setForm(room ? {
      title: room.title,
      description: room.description,
      museum_id: room.museum_id,
      photo: room.photo || ''
    } : {
      title: '',
      description: '',
      museum_id: user.status === 'admin' ? user.museum_id : '',
      photo: ''
    });
    setSelectedFile(null);
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setEditRoom(null);
    setError('');
    setSelectedFile(null);
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!form.title || !form.description || !form.museum_id) {
        setError('Please fill in all required fields');
        return;
      }

      let photoFilename = form.photo;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('photo', selectedFile);

        const uploadRes = await api.post('/rooms/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        photoFilename = uploadRes.data.filename;
      }

      const submitData = {
        ...form,
        photo: photoFilename
      };

      if (editRoom) {
        await api.put(`/rooms/${editRoom.id}`, submitData);
      } else {
        await api.post('/rooms', submitData);
      }
      await fetchData();
      handleClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving room');
      console.error('Error:', error);
    }
  };

  const handleDeleteClick = (room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/rooms/${roomToDelete.id}`);
      await fetchData();
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    } catch (error) {
      setError('Error deleting room');
      console.error('Error:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRoomToDelete(null);
  };

  const handleViewImage = (photo) => {
    setModalImageSrc(`https://nasro.expedgs-audioguide.duckdns.org/images/${photo}`);
    setImageModalOpen(true);
  };

  // Navigate to objects page filtered by room
  const handleViewObjects = (room) => {
    navigate(`/objects?room=${room.id}&roomName=${encodeURIComponent(room.title)}`);
  };

  const theme = useTheme();

  // Filter and search logic
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.title.toLowerCase().includes(search.trim().toLowerCase());
    const matchesMuseum = !museumFilter || museumFilter === '' || room.museum_id.toString() === museumFilter.id?.toString() || room.museum_id.toString() === museumFilter.toString();
    return matchesSearch && matchesMuseum;
  });

  // Pagination logic
  const pageCount = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = filteredRooms.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Get current museum name for display
  const currentMuseumName = museumFilter?.title || (museumFilter ? museums.find(m => m.id.toString() === museumFilter.toString())?.title : null);

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
      {/* Header with Title, Search, Filter, and Add Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2,
          flexWrap: { xs: 'wrap', lg: 'nowrap' },
        }}
      >
        {/* Title */}
        <Box sx={{ minWidth: 'fit-content', flexShrink: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            Rooms Management
          </Typography>
          {currentMuseumName && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
              Filtered by: {currentMuseumName}
            </Typography>
          )}
        </Box>

        {/* Search and Filter Container */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexGrow: 1,
            maxWidth: { xs: '100%', lg: '600px' },
            alignItems: 'center',
          }}
        >
          {/* Search Bar */}
          <TextField
            size="small"
            placeholder="Search by room title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          {/* Museum Filter - Autocomplete for superadmin */}
          {user?.status === 'superadmin' && (
            <Autocomplete
              size="small"
              options={museums}
              getOptionLabel={(option) => option.title || ''}
              value={museumFilter}
              onChange={(_, newValue) => setMuseumFilter(newValue)}
              sx={{ minWidth: 200 }}
              renderInput={(params) => (
                <TextField {...params} label="Filter by Museum" variant="outlined" />
              )}
              clearOnEscape
              isOptionEqualToValue={(option, value) => option.id === value.id}
              freeSolo={false}
            />
          )}
        </Box>

        {/* Add Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen()}
          sx={{
            minWidth: 'fit-content',
            flexShrink: 0,
          }}
        >
          Add Room
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 650 }} aria-label="rooms table">
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Description</TableCell>
                {user?.status === 'superadmin' && (
                  <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Museum</TableCell>
                )}
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Photo</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={user?.status === 'superadmin' ? 6 : 5} align="center">
                    {search || museumFilter
                      ? `No rooms found matching your criteria`
                      : 'No rooms found.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRooms.map((room, index) => (
                  <TableRow
                    key={room.id}
                    sx={{
                      backgroundColor: index % 2 === 0 ? theme.palette.background.default : '#f9f9f9',
                      '&:hover': { backgroundColor: theme.palette.action.hover },
                    }}
                  >
                    <TableCell>{room.id}</TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {room.title}
                      </Typography>
                    </TableCell>
                    <TableCell
                      title={room.description}
                      sx={{
                        maxWidth: 250,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {room.description}
                    </TableCell>

                    {user?.status === 'superadmin' && (
                      <TableCell>
                        <Chip
                          label={museums.find((m) => m.id === room.museum_id)?.title || 'N/A'}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                    )}

                    <TableCell>
                      {room.photo ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img
                            src={`https://nasro.expedgs-audioguide.duckdns.org/images/${room.photo}`}
                            alt="Room"
                            style={{
                              width: 56,
                              height: 56,
                              objectFit: 'cover',
                              borderRadius: 6,
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          />
                          <Button size="small" variant="outlined" onClick={() => handleViewImage(room.photo)}>
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
                          onClick={() => handleViewObjects(room)}
                        >
                          Objects
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => handleOpen(room)}>
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDeleteClick(room)}
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
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editRoom ? 'Edit Room' : 'Add Room'}
        </DialogTitle>
        <DialogContent>
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
              <Button variant="outlined" component="span" sx={{ mb: 2 }}>
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

          {/* Museum select only for superadmin */}
          {user?.status === 'superadmin' && (
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Museum</InputLabel>
              <Select name="museum_id" value={form.museum_id} onChange={handleChange} label="Museum">
                {museums.map((museum) => (
                  <MenuItem key={museum.id} value={museum.id}>
                    {museum.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            {editRoom ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this room?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
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
            alt="Room"
            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RoomsPage;