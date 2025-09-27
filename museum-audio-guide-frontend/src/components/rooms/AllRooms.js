import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import './AllRooms.css';
import { useTicket } from '../../context/TicketContext';

function AllRooms() {
  const [rooms, setRooms] = useState([]);
  const [museum, setMuseum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const roomsPerPage = 6;

  const { museumTitle } = useParams();
  const navigate = useNavigate();
  const { ticketCode } = useTicket();

  useEffect(() => {
    if (!ticketCode) {
      navigate('/');
      return;
    }

    const fetchMuseumAndRooms = async () => {
      try {
        const res = await api.get(`/public/museum-rooms/${ticketCode}`);
        if (res.data.valid) {
          setMuseum(res.data.museum);
          setRooms(res.data.rooms);
        } else {
          setError(res.data.message || 'Invalid or expired ticket');
        }
      } catch (err) {
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchMuseumAndRooms();
  }, [ticketCode, navigate]);

  const handleRoomClick = (roomTitle) => {
    navigate(`/${encodeURIComponent(museumTitle)}/rooms/${encodeURIComponent(roomTitle)}`);
  };

  const totalPages = Math.ceil(rooms.length / roomsPerPage);
  const indexOfLastRoom = currentPage * roomsPerPage;
  const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
  const currentRooms = rooms.slice(indexOfFirstRoom, indexOfLastRoom);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="rooms-loading">
        <div className="loader"></div>
        <p>Loading rooms...</p>
      </div>
    );
  }

  if (error) {
    return <div className="rooms-error">{error}</div>;
  }

  return (
    <div className="all-rooms-container">
      <div
        className="museum-header-bg"
        style={{
          backgroundImage: museum?.photo
            ? `url(https://nasro.expedgs-audioguide.duckdns.org/images/${museum.photo})`
            : 'none'
        }}
      >
        <div className="museum-header-overlay"></div>
        <div className="museum-header-content">
          <h1>{museum?.title}</h1>
          <p>{museum?.description}</p>
        </div>
      </div>

      <h1>All Rooms</h1>
      <div className="rooms-grid">
        {currentRooms.map((room) => (
          <div 
            key={room.id} 
            className="room-card"
            onClick={() => handleRoomClick(room.title)}
            tabIndex={0}
            role="button"
            aria-pressed="false"
            onKeyPress={e => { if (e.key === 'Enter') handleRoomClick(room.title); }}
          >
            <div className="room-image">
              <img src={`https://nasro.expedgs-audioguide.duckdns.org/images/${room.photo}`} alt={room.title} />
            </div>
            <div className="room-info">
              <h2>{room.title}</h2>
              <p>{room.description?.length > 80 ? room.description.slice(0, 80) + '...' : room.description}</p>
            </div>
          </div>
        ))}
      </div>

      {rooms.length > roomsPerPage && (
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
          <button  className="active" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next ›
          </button>
        </div>
      )}

      {rooms.length === 0 && (
        <div className="no-rooms">
          <p>No rooms available in this museum.</p>
        </div>
      )}
    </div>
  );
}

export default AllRooms;
