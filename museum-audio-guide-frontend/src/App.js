import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TicketEntry from './components/ticketentry/TicketEntry';
import RoomsPage from './components/rooms/RoomsPage';
import AllRooms from './components/rooms/AllRooms';
import ObjectDetails from './components/object_dettails/ObjectDetails';
import { TicketProvider } from './context/TicketContext';
import './App.css'; // Optional: for footer styling
import xpedLogo from './xped.png'; // Make sure the image is in the same folder

function App() {
  const [appTicketCode, setAppTicketCode] = useState(() =>
    localStorage.getItem('ticketCode')
  );

  return (
    <TicketProvider>
      <Router>
        <div className="app-container">
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<TicketEntry />} />
              <Route path="/:museumTitle" element={<AllRooms />} />
              <Route path="/:museumTitle/rooms/:roomTitle" element={<RoomsPage />} />
              <Route
                path="/:museumTitle/rooms/:roomTitle/:objectTitle"
                element={<ObjectDetails />}
              />
            </Routes>
          </div>

          {/* Footer */}
          <footer className="footer">
            <img src={xpedLogo} alt="ExpedGS Logo" className="footer-logo" />
            <p>
              &copy; {new Date().getFullYear()} Powered by{' '}
              <a
                href="https://exped360.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                ExpedGS
              </a>
            </p>
          </footer>
        </div>
      </Router>
    </TicketProvider>
  );
}

export default App;
