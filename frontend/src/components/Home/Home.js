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
            <button className="cta-button primary" onClick={handleStartChatting}>
              Start Chatting
            </button>
            
            <button className="cta-button secondary" onClick={handleLogin}>
              Sign In
            </button>
          </div>
          
          {/* Features Section - Moved below CTA */}
          <section className="features">
            <div className="features-grid">
              <div className="feature-card">
                <span className="feature-icon">⚡</span>
                <h3>Real-time</h3>
                <p>Instant messaging with live updates</p>
              </div>
              
              <div className="feature-card">
                <span className="feature-icon">🔒</span>
                <h3>Secure</h3>
                <p>End-to-end encrypted conversations</p>
              </div>
              
              <div className="feature-card">
                <span className="feature-icon">📱</span>
                <h3>Mobile-first</h3>
                <p>Optimized for all devices</p>
              </div>
            </div>
          </section>
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
