import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import './RoomsPage.css';
import { useTicket } from '../../context/TicketContext';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  IconButton
} from '@mui/material';
import BackspaceIcon from '@mui/icons-material/Backspace';

function RoomsPage() {
  const { museumTitle, roomTitle } = useParams();
  const [room, setRoom] = useState(null);
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterId, setFilterId] = useState('');
  const { ticketCode } = useTicket();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectionError, setSelectionError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const objectsPerPage = 6;

  useEffect(() => {
    if (!ticketCode) {
      navigate('/');
      return;
    }

    const fetchRoomAndObjects = async () => {
      try {
        const res = await api.get(`/public/museum-room-objects/${ticketCode}/${encodeURIComponent(roomTitle)}`);
        if (res.data.valid) {
          setRoom(res.data.room);
          setObjects(res.data.objects);
        } else {
          setError(res.data.message || 'Invalid or expired ticket');
        }
      } catch {
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomAndObjects();
  }, [museumTitle, roomTitle, ticketCode, navigate]);

  const handleBack = () => {
    navigate(`/${encodeURIComponent(museumTitle)}`);
  };

  const filteredObjects = filterId
    ? objects.filter((obj) => obj.id.toString() === filterId.toString())
    : objects;

  const totalPages = Math.ceil(filteredObjects.length / objectsPerPage);
  const indexOfLastObject = currentPage * objectsPerPage;
  const indexOfFirstObject = indexOfLastObject - objectsPerPage;
  const paginatedObjects = filteredObjects.slice(indexOfFirstObject, indexOfLastObject);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openModal = () => {
    setInputValue('');
    setSelectionError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectionError('');
  };

  const handleNumberClick = (num) => {
    if (inputValue.length < 6) {
      setInputValue((prev) => prev + num.toString());
      setSelectionError('');
    }
  };

  const handleBackspace = () => {
    setInputValue((prev) => prev.slice(0, -1));
    setSelectionError('');
  };

  const handleGo = () => {
    const idNum = inputValue.toString().trim();
    if (!idNum) {
      setSelectionError('Please enter or select an object number');
      return;
    }

    const obj = objects.find((o) => o.id.toString() === idNum);
    if (obj) {
      setFilterId(idNum);
      setModalOpen(false);
      navigate(
        `/${encodeURIComponent(museumTitle)}/rooms/${encodeURIComponent(roomTitle)}/${encodeURIComponent(obj.title)}`
      );
    } else {
      setSelectionError(`Object number ${idNum} does not exist`);
    }
  };

  if (loading) {
    return (
      <div className="room-loading">
        <div className="loader"></div>
        <p>Loading room details...</p>
      </div>
    );
  }

  if (error) {
    return <div className="room-error">{error}</div>;
  }
const handleCircleClick = (id) => {
  setInputValue(id.toString());
  setSelectionError('');
};  
  return (
    <div className="room-page-container">
      <div
        className="room-header-bg"
        style={{
          backgroundImage: room?.photo
            ? `url(https://nasro.expedgs-audioguide.duckdns.org/images/${room.photo})`
            : 'none'
        }}
      >
        <div className="room-header-overlay"></div>
        <div className="room-header-content">
          <h1>{room.title}</h1>
          <p className="room-description">{room.description}</p>
        </div>
      </div>

      <button className="back-btn" onClick={handleBack}>
        &larr; Back to Rooms
      </button>

      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <Button
          variant="contained"
          onClick={openModal}
          sx={{
            backgroundColor: 'var(--museum-blue)',
            color: '#fff',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: 'var(--museum-gold)',
              color: 'var(--museum-blue)',
            },
            minWidth: 220,
            padding: '10px 0',
          }}
        >
          {filterId ? `Filter: ${filterId}` : 'Choose an Object'}
        </Button>
      </Box>

      <div className="objects-section">
        <h2>Objects in this Room</h2>
        {filteredObjects.length === 0 ? (
          <div className="no-objects">
            <p>No objects available in this room.</p>
          </div>
        ) : (
          <>
            <div className="objects-grid">
              {paginatedObjects.map((object) => (
                <Link
                  to={`/${encodeURIComponent(museumTitle)}/rooms/${encodeURIComponent(roomTitle)}/${encodeURIComponent(object.title)}`}
                  className="object-card-link"
                  key={object.id}
                >
                  <div className="object-card">
                    <div className="object-image">
                      <img src={`https://nasro.expedgs-audioguide.duckdns.org/images/${object.photo}`} alt={object.title} />
                    </div>
                    <div className="object-info">
                      <h3>{object.title}</h3>
                      <p>{object.description?.length > 80 ? object.description.slice(0, 80) + '...' : object.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="active" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  ‹ Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePageChange(num)}
                    className="active"
                  >
                    {num}
                  </button>
                ))}
                <button className="active" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  Next ›
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Object selection modal */}
      <Dialog open={modalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
  <DialogTitle sx={{ color: 'var(--museum-blue)', fontWeight: 'bold' }}>
    Select Object Number
  </DialogTitle>
  <DialogContent>
    {/* Object number selection */}
    {/* <Box sx={{ mb: 3, maxHeight: 150, overflowY: 'auto' }}>
      <Grid container spacing={1} justifyContent="center">
        {objects.length === 0 ? (
          <Typography sx={{ p: 2, color: 'var(--museum-blue)' }}>No objects available</Typography>
        ) : (
          objects.map((obj) => (
            <Grid item key={obj.id}>
              <Button
                variant="outlined"
                onClick={() => handleCircleClick(obj.id)}
                sx={{
                  minWidth: 46,
                  minHeight: 46,
                  borderRadius: '50%',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  backgroundColor: inputValue === obj.id.toString() ? 'var(--museum-gold)' : 'white',
                  color: 'var(--museum-blue)',
                  borderColor: 'var(--museum-gold)',
                  '&:hover': {
                    backgroundColor: 'var(--museum-gold)',
                    color: 'var(--museum-blue)',
                  },
                }}
              >
                {obj.id}
              </Button>
            </Grid>
          ))
        )}
      </Grid>
    </Box> */}

    {/* Display input */}
    <Box
      sx={{
        fontSize: '3rem',
        fontWeight: 'bold',
        color: 'var(--museum-blue)',
        border: '2px solid var(--museum-gold)',
        borderRadius: 2,
        width: '100%',
        maxWidth: 300,
        textAlign: 'center',
        padding: '12px 0',
        letterSpacing: 4,
        margin: '0 auto 24px auto',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(44,58,74,0.1)',
      }}
    >
      {inputValue || '—'}
    </Box>

    {/* Keypad */}
    <Grid container spacing={1} maxWidth={300} justifyContent="center" sx={{ margin: '0 auto' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num, index) => (
        <Grid item xs={4} key={index}>
          <Button
            variant="outlined"
            onClick={() => handleNumberClick(num)}
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              backgroundColor: inputValue.endsWith(num.toString()) ? 'var(--museum-gold)' : 'white',
              color: 'var(--museum-blue)',
              borderColor: 'var(--museum-gold)',
              '&:hover': {
                backgroundColor: 'var(--museum-gold)',
                color: 'var(--museum-blue)',
              },
            }}
          >
            {num}
          </Button>
        </Grid>
      ))}

      {/* Backspace */}
      <Grid item xs={4}>
        <IconButton
          onClick={handleBackspace}
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '2px solid var(--museum-gold)',
            color: 'var(--museum-blue)',
            '&:hover': {
              backgroundColor: 'var(--museum-gold)',
              color: 'var(--museum-blue)',
            },
          }}
          aria-label="Backspace"
        >
          <BackspaceIcon fontSize="large" />
        </IconButton>
      </Grid>
    </Grid>

    {selectionError && (
      <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
        {selectionError}
      </Typography>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={closeModal} sx={{ color: 'var(--museum-blue)' }}>
      Cancel
    </Button>
    <Button
      variant="contained"
      onClick={handleGo}
      sx={{
        backgroundColor: 'var(--museum-gold)',
        color: 'var(--museum-blue)',
        fontWeight: 'bold',
        '&:hover': {
          backgroundColor: 'var(--museum-blue)',
          color: 'var(--museum-gold)',
        },
      }}
    >
      Go
    </Button>
  </DialogActions>
</Dialog>

    </div>
  );
}

export default RoomsPage;
