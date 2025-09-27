import React, { useEffect, useState, useRef } from 'react';
import api from '../../api';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
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
  Autocomplete,
  Alert,
  Box,
  Typography,
  Chip,
  Pagination,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';

function ObjectsPage() {
  const [objects, setObjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [objectToDelete, setObjectToDelete] = useState(null);
  const [editObject, setEditObject] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    room_id: '',
    photo: '',
    audio: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { user } = useAuth();
  const location = useLocation();
  const theme = useTheme();

  // Audio player refs and states for custom controls
  const audioPlayerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Fetch objects and rooms
  const fetchData = async () => {
    try {
      setLoading(true);
      const [objectsRes, roomsRes] = await Promise.all([
        api.get('/objects'),
        api.get('/rooms')
      ]);
      setObjects(objectsRes.data);
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

      const urlParams = new URLSearchParams(location.search);
      const roomId = urlParams.get('room');
      const roomName = urlParams.get('roomName');

      if (roomId) {
        const foundRoom = rooms.find(r => r.id.toString() === roomId);
        if (foundRoom) {
          setRoomFilter(foundRoom);
        } else {
          setRoomFilter({ id: roomId, title: roomName || '' });
        }
      }
    }
    // eslint-disable-next-line
  }, [user, location.search, rooms.length]);

  useEffect(() => {
    setPage(1);
  }, [search, roomFilter]);

  const handleOpen = (object = null) => {
    setEditObject(object);
    setForm(object ? {
      title: object.title,
      description: object.description,
      room_id: object.room_id,
      photo: object.photo,
      audio: object.audio
    } : {
      title: '',
      description: '',
      room_id: '',
      photo: '',
      audio: ''
    });
    setSelectedImage(null);
    setSelectedAudio(null);
    setRecordedAudio(null);
    setIsRecording(false);
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditObject(null);
    setError('');
    setSelectedImage(null);
    setSelectedAudio(null);
    setRecordedAudio(null);
    setIsRecording(false);
    setForm({
      photo: '',
      audio: '',
      title: '',
      description: '',
      room_id: ''
    });
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = e => {
    if (e.target.files[0]) setSelectedImage(e.target.files[0]);
  };

  const handleAudioChange = e => {
    if (e.target.files[0]) {
      setSelectedAudio(e.target.files[0]);
      setRecordedAudio(null); // Clear recorded audio if user uploads file
    }
  };

  // Audio recording handlers
  const startRecording = async () => {
    setError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Audio recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      const chunks = [];
      mediaRecorder.current.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedAudio(blob);
        setSelectedAudio(null);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Could not start audio recording.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  // Custom audio player controls
  const togglePlay = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
  };

  const stopAudio = () => {
    if (!audioPlayerRef.current) return;
    audioPlayerRef.current.pause();
    audioPlayerRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const toggleMute = () => {
    if (!audioPlayerRef.current) return;
    audioPlayerRef.current.muted = !audioPlayerRef.current.muted;
    setIsMuted(audioPlayerRef.current.muted);
  };

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);
  const onEnded = () => setIsPlaying(false);

  const handleSubmit = async () => {
    try {
      if (!form.title || !form.description || !form.room_id) {
        setError('Please fill in all required fields');
        return;
      }

      let photoFilename = form.photo;
      let audioFilename = form.audio;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('photo', selectedImage);
        const uploadRes = await api.post('/objects/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        photoFilename = uploadRes.data.filename;
      }

      if (recordedAudio) {
  const formData = new FormData();
  // Use extension based on blob type
  let extension = 'webm';
  if (recordedAudio.type === 'audio/wav') extension = 'wav';
  else if (recordedAudio.type === 'audio/ogg') extension = 'ogg';
  else if (recordedAudio.type === 'audio/mpeg') extension = 'mp3';
  // Default to webm if unknown

  formData.append('audio', recordedAudio, `recorded_audio.${extension}`);
  const uploadRes = await api.post('/objects/upload-audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  audioFilename = uploadRes.data.filename;
} else if (selectedAudio) {
        const formData = new FormData();
        formData.append('audio', selectedAudio);
        const uploadRes = await api.post('/objects/upload-audio', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        audioFilename = uploadRes.data.filename;
      }

      const submitData = {
        ...form,
        photo: photoFilename,
        audio: audioFilename
      };

      let response;
      if (editObject) {
        response = await api.put(`/objects/${editObject.id}`, submitData);
        setObjects((prev) =>
          prev.map((obj) => (obj.id === editObject.id ? response.data : obj))
        );
      } else {
        response = await api.post('/objects', submitData);
        setObjects((prev) => [...prev, response.data]);
      }

      handleClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving object');
      console.error('Error:', error);
    }
  };

  const handleDeleteClick = (object) => {
    setObjectToDelete(object);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/objects/${objectToDelete.id}`);
      await fetchData();
      setDeleteDialogOpen(false);
      setObjectToDelete(null);
    } catch (error) {
      setError('Error deleting object');
      console.error('Error:', error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setObjectToDelete(null);
  };

  const handleViewImage = (photo) => {
    setModalImageSrc(`https://nasro.expedgs-audioguide.duckdns.org/images/${photo}`);
    setImageModalOpen(true);
  };

  // Filter objects by search and room filter
  const filteredObjects = objects.filter(obj => {
    const matchesSearch = obj.title.toLowerCase().includes(search.trim().toLowerCase());
    const matchesRoom = !roomFilter || roomFilter === '' || obj.room_id.toString() === roomFilter.id?.toString() || obj.room_id.toString() === roomFilter.toString();
    return matchesSearch && matchesRoom;
  });

  const pageCount = Math.ceil(filteredObjects.length / itemsPerPage);
  const paginatedObjects = filteredObjects.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const currentRoomName = roomFilter?.title || (roomFilter ? rooms.find(r => r.id.toString() === roomFilter.toString())?.title : null);

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
        <Box sx={{ minWidth: 'fit-content', flexShrink: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            Objects Management
          </Typography>
          {currentRoomName && (
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
              Filtered by: {currentRoomName}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexGrow: 1,
            maxWidth: { xs: '100%', lg: '600px' },
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            placeholder="Search by object title..."
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

          <Autocomplete
            size="small"
            options={rooms}
            getOptionLabel={(option) => option.title || ''}
            value={roomFilter}
            onChange={(_, newValue) => setRoomFilter(newValue)}
            sx={{ minWidth: 200 }}
            renderInput={(params) => (
              <TextField {...params} label="Filter by Room" variant="outlined" />
            )}
            clearOnEscape
            isOptionEqualToValue={(option, value) => option.id === value.id}
            freeSolo={false}
          />
        </Box>

        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Add Object
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Table sx={{ minWidth: 650 }} aria-label="objects table">
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                {['ID', 'Title', 'Description', 'Room', 'Image', 'Audio', 'Actions'].map((headCell) => (
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
              {paginatedObjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {search || roomFilter
                      ? `No objects found matching your criteria`
                      : 'No objects found.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedObjects.map((object, index) => (
                  <TableRow
                    key={object.id}
                    sx={{
                      backgroundColor: index % 2 === 0 ? theme.palette.background.default : '#f9f9f9',
                      '&:hover': { backgroundColor: theme.palette.action.hover },
                    }}
                  >
                    <TableCell>{object.id}</TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {object.title}
                      </Typography>
                    </TableCell>
                    <TableCell
                      title={object.description}
                      sx={{
                        maxWidth: 250,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {object.description}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rooms.find((r) => r.id === object.room_id)?.title || 'N/A'}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {object.photo && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img
                            src={`https://nasro.expedgs-audioguide.duckdns.org/images/${object.photo}`}
                            alt={object.title}
                            style={{
                              width: 56,
                              height: 56,
                              objectFit: 'cover',
                              borderRadius: 6,
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          />
                          <Button size="small" variant="outlined" onClick={() => handleViewImage(object.photo)}>
                            View
                          </Button>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      {object.audio && (
                        <audio controls style={{ width: 120 }}>
                          <source src={`https://nasro.expedgs-audioguide.duckdns.org/images/${object.audio}`} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button size="small" variant="outlined" onClick={() => handleOpen(object)}>
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDeleteClick(object)}
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
          {editObject ? 'Edit Object' : 'Add Object'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ my: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            {/* Image Preview */}
            <Box sx={{ mb: 2 }}>
              {selectedImage ? (
                <img
                  src={URL.createObjectURL(selectedImage)}
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
              onChange={handleImageChange}
            />
            <label htmlFor="photo-upload">
              <Button variant="outlined" component="span" sx={{ mb: 2 }}>
                {selectedImage ? 'Change Photo' : 'Upload Photo'}
              </Button>
            </label>

            {/* Audio Upload and Recording */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              {/* Audio Preview with custom controls */}
              {(recordedAudio || selectedAudio || form.audio) ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <audio
                    ref={audioPlayerRef}
                    src={
                      recordedAudio
                        ? URL.createObjectURL(recordedAudio)
                        : selectedAudio
                        ? URL.createObjectURL(selectedAudio)
                        : `https://nasro.expedgs-audioguide.duckdns.org/images/${form.audio}`
                    }
                    onPlay={onPlay}
                    onPause={onPause}
                    onEnded={onEnded}
                    style={{ width: 180 }}
                  />
                  <Button onClick={togglePlay} size="small">
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  <Button onClick={stopAudio} size="small" color="error">
                    Stop
                  </Button>
                  <Button onClick={toggleMute} size="small">
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>
                </Box>
              ) : (
                <Box
                  sx={{
                    width: 120,
                    height: 40,
                    borderRadius: 8,
                    border: `2px dashed ${theme.palette.divider}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.palette.text.disabled,
                    fontSize: 14,
                    marginBottom: 1,
                  }}
                >
                  No Audio
                </Box>
              )}

              {/* Upload Audio File */}
              <input
                accept="audio/*"
                style={{ display: 'none' }}
                id="audio-upload"
                type="file"
                onChange={handleAudioChange}
              />
              <label htmlFor="audio-upload">
                <Button variant="outlined" component="span" sx={{ mb: 1 }}>
                  {selectedAudio ? 'Change Audio' : 'Upload Audio'}
                </Button>
              </label>

              {/* Audio Recording Controls */}
              {!isRecording ? (
                <Button
                  variant="outlined"
                  startIcon={<MicIcon />}
                  onClick={startRecording}
                  sx={{ mb: 1 }}
                >
                  Record Audio
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={stopRecording}
                  sx={{ mb: 1 }}
                >
                  Stop Recording
                </Button>
              )}
            </Box>
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
            multiline
            rows={4}
            required
          />

          <Autocomplete
            size="small"
            options={rooms}
            getOptionLabel={(option) => option.title || ''}
            value={rooms.find(r => r.id === form.room_id) || null}
            onChange={(_, newValue) => setForm({ ...form, room_id: newValue ? newValue.id : '' })}
            renderInput={(params) => (
              <TextField {...params} label="Room" variant="outlined" required />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            sx={{ mt: 2 }}
            clearOnEscape
            freeSolo={false}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            {editObject ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image View Modal */}
      <Dialog open={imageModalOpen} onClose={() => setImageModalOpen(false)} maxWidth="md">
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          <img
            src={modalImageSrc}
            alt="Object"
            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this object?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ObjectsPage;