import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🏠 Home component mounted successfully!');
    // Trigger animations on component mount
    setTimeout(() => setAnimationClass('animate-in'), 100);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignup = () => {
    navigate('/register');
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-logo">
            <div className="logo-icon">💬</div>
            <span className="logo-text">NeuroChat</span>
          </div>
          
          <div className="nav-menu">
            <button 
              className={`hamburger ${menuOpen ? 'active' : ''}`}
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            
            <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
              <a href="#about" className="nav-link">About</a>
              <a href="#contact" className="nav-link">Contact</a>
              <button className="nav-btn login-btn" onClick={handleLogin}>
                Login
              </button>
              <button className="nav-btn signup-btn" onClick={handleSignup}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero-section">
        <div className={`hero-content ${animationClass}`}>
          <div className="hero-badge">
            <span className="badge-text">✨ by SanchitVerse</span>
          </div>
          
          <h1 className="hero-title">
            Welcome to
            <span className="gradient-text"> NeuroChat</span>
          </h1>
          
          <p className="hero-subtitle">
            Experience the future of messaging with real-time conversations, 
            end-to-end encryption, and seamless connectivity.
          </p>
          
          <div className="hero-features">
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <span>Real-time Messaging</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <span>End-to-end Encrypted</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🌐</div>
              <span>Cross-platform</span>
            </div>
          </div>
          
          <div className="hero-actions">
            <button className="cta-button primary" onClick={handleSignup}>
              <span className="cta-text">Start Chatting</span>
              <div className="cta-animation">
                <div className="pulse-ring"></div>
                <div className="pulse-ring delay-1"></div>
                <div className="pulse-ring delay-2"></div>
              </div>
            </button>
            
            <button className="cta-button secondary" onClick={handleLogin}>
              <span className="cta-text">Sign In</span>
            </button>
          </div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="hero-background">
          <div className="floating-bubble bubble-1"></div>
          <div className="floating-bubble bubble-2"></div>
          <div className="floating-bubble bubble-3"></div>
          <div className="floating-bubble bubble-4"></div>
          <div className="floating-bubble bubble-5"></div>
          <div className="floating-bubble bubble-6"></div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">
              <div className="logo-icon">💬</div>
              <span>NeuroChat</span>
            </div>
            <p className="footer-description">
              Connecting minds through secure, real-time conversations.
            </p>
          </div>
          
          <div className="footer-right">
            <div className="footer-links">
              <a href="#privacy" className="footer-link">Privacy Policy</a>
              <a href="#terms" className="footer-link">Terms of Service</a>
              <a href="#support" className="footer-link">Support</a>
            </div>
            
            <div className="footer-credits">
              <p>Developed by <span className="highlight">SanchitVerse</span></p>
              <p className="copyright">© 2024 NeuroChat. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
