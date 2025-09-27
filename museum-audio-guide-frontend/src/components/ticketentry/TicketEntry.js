import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import './TicketEntry.css';
import api from '../../api';
import { useTicket } from '../../context/TicketContext';

function HeartIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="black"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="heart-icon-svg"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="black"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="6" height="6" stroke="black" strokeWidth="2" fill="none" />
      <rect x="15" y="3" width="6" height="6" stroke="black" strokeWidth="2" fill="none" />
      <rect x="3" y="15" width="6" height="6" stroke="black" strokeWidth="2" fill="none" />
      <rect x="10" y="10" width="4" height="4" fill="black" />
      <rect x="15" y="15" width="6" height="6" fill="black" />
    </svg>
  );
}

function TicketEntry() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const navigate = useNavigate();
  const html5QrCode = useRef(null);
  const { updateTicketCode } = useTicket();

  const validateCode = async (ticketCode) => {
    setError('');
    try {
      const res = await api.get(`/public/museum-rooms/${ticketCode}`);
      if (res.data.valid) {
        updateTicketCode(ticketCode);
        const museum = res.data.museum;
        if (museum) {
          navigate(`/${encodeURIComponent(museum.title)}`);
        } else {
          setError('Museum not found for this ticket.');
        }
      } else {
        setError(res.data.message || 'Invalid or expired ticket');
      }
    } catch (err) {
      setError('Error verifying ticket.');
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (code.trim()) {
      validateCode(code.trim());
    } else {
      setError('Please enter a ticket code.');
    }
  };

  useEffect(() => {
    const stopScanner = async () => {
      if (html5QrCode.current) {
        try {
          if (html5QrCode.current.isScanning) {
            await html5QrCode.current.stop();
          }
        } catch (e) {}
        try {
          await html5QrCode.current.clear();
        } catch (e) {}
        html5QrCode.current = null;
        setScanning(false);
      }
    };

    if (showScanner) {
      const timer = setTimeout(() => {
        if (!document.getElementById('reader')) {
          setError('QR Code reader element not found.');
          return;
        }
        html5QrCode.current = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrCode.current.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            setCode(decodedText);
            setShowScanner(false);
            validateCode(decodedText);  // <-- Automatically validate after scan
          },
          (error) => {}
        ).then(() => {
          setScanning(true);
          setError('');
        }).catch(() => {
          setError('Unable to start camera. Please check camera permissions.');
          setShowScanner(false);
          setScanning(false);
        });
      }, 100);

      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [showScanner]);

  return (
    <div className="ticket-entry-screen">
      <div className="background-blur" />
      <div className="ticket-entry-wrapper">
        <HeartIcon />
        <form className="ticket-entry-form" onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <input
              type="text"
              className="ticket-entry-input"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Entrer votre code"
              autoComplete="off"
            />
            <button
              type="submit"
              className="input-submit-btn"
              disabled={!code.trim()}
              title="Submit Code"
            >
              +
            </button>
          </div>
        </form>
        <div className="separator">
          <hr className="line" />
          <span>OU</span>
          <hr className="line" />
        </div>
        <button
          className="scan-qr-btn"
          onClick={() => setShowScanner(prev => !prev)}
          title={showScanner ? 'Fermer le scanner' : 'Scannez le QR Code'}
          type="button"
          disabled={scanning}
        >
          <QrIcon />
          <span>SCANNEZ LE QR CODE</span>
        </button>
        {showScanner && (
          <div className="qr-reader-container">
            <div id="reader" />
          </div>
        )}
        {error && <div className="ticket-entry-error">{error}</div>}
      </div>
    </div>
  );
}

export default TicketEntry;