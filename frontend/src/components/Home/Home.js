import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    console.log('🏠 Home component mounted successfully!');
    const timer = setTimeout(() => {
      setAnimationClass('animate-in');
    }, 100);

    // Mobile debugging
    console.log('📱 Home component mounted');
    console.log('📱 User agent:', navigator.userAgent);
    console.log('📱 Screen size:', window.innerWidth, 'x', window.innerHeight);
    console.log('📱 Viewport size:', window.visualViewport?.width || 'N/A', 'x', window.visualViewport?.height || 'N/A');

    return () => clearTimeout(timer);
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

  const handleStartChatting = () => {
    if (user) {
      // User is already logged in, go to chat
      navigate('/chat');
    } else {
      // User not logged in, go to signup
      navigate('/register');
    }
  };

  const handleAbout = () => {
    navigate('/about');
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-left">
            <div className="logo">
              <span className="logo-text">NeuroChat</span>
            </div>
          </div>
          <div className="nav-menu">
            <button 
              className={`hamburger ${menuOpen ? 'active' : ''}`}
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
            </button>
            
            <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
              <div className="nav-links">
                <button className="nav-link" onClick={handleAbout}>About</button>
                <button className="nav-link">Contact</button>
                <button className="nav-link" onClick={handleLogin}>Login</button>
                <button className="nav-link signup-btn" onClick={handleSignup}>Sign Up</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            ✨ by SanchitVerse
          </div>
          
          <h1 className="hero-title">
            Simple. Secure. Reliable messaging.
          </h1>
          
          <p className="hero-subtitle">
            Connect with friends and family through fast, secure messaging. 
            Start conversations that matter with NeuroChat.
          </p>
          
          <div className="hero-actions">
            <button className="cta-button primary" onClick={handleStartChatting}>
              Start Chatting
            </button>
          </div>
          
          <div className="hero-features">
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <span>Simple</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Secure</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Fast</span>
            </div>
          </div>
        </div>
      </main>

      <main className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            ✨ by SanchitVerse
          </div>
          
          <h1 className="hero-title">
            Simple. Secure. Reliable messaging.
          </h1>
          
          <p className="hero-subtitle">
            With NeuroChat, you'll get fast, simple, secure messaging and calling for free*, available on phones all over the world.
          </p>
          
          <div className="hero-actions">
            <button className="cta-button primary" onClick={handleStartChatting}>
              Start Chatting
            </button>
          </div>
          
          <div className="hero-features">
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <span>Simple</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Secure</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Fast</span>
            </div>
          </div>
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
          </div>
          
          <div className="footer-section">
            <h4>Features</h4>
            <ul className="footer-links">
              <li>Real-time Messaging</li>
              <li>End-to-end Encryption</li>
              <li>Cross-platform Support</li>
              <li>Friend Requests</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 NeuroChat by SanchitVerse. All rights reserved.</p>
          <p className="footer-tagline">Developed with ❤️ by SanchitVerse</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
