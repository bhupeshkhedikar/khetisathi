import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Footer = ({ language, translations }) => {
  const t = translations[language];

  return (
    <footer className="footer">
      <div className="footer-content">
        <h3 className="footer-title">{t.farmConnect}</h3>
        <p className="footer-tagline">{t.trustedPartner}</p>
        <div className="social-links">
          <a href="#" className="social-icon"><i className="fab fa-facebook-f"></i></a>
          <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
          <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
        </div>
        <p className="contact-info">
          {t.contactUs}: <a href="mailto:support@khetisathi.com">{t.email}</a> | {t.phone}
        </p>
        <nav className="footer-links">
          <Link to="/" className="contact-info">Home</Link> |{' '}
          <Link to="/about" className="contact-info">About Us</Link> |{' '}
          <Link to="/contact" className="contact-info">Contact Us</Link> |{' '}
          <Link to="/terms" className="contact-info">Terms & Conditions</Link> |{' '}
          <Link to="/privacy" className="contact-info">Privacy Policy</Link> |{' '}
          <Link to="/refund" className="contact-info">Refund Policy</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;