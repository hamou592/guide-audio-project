// src/components/Footer.js
import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="museum-footer">
      <div className="museum-footer-content">
        &copy; {new Date().getFullYear()} Museum Audio Guide. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;