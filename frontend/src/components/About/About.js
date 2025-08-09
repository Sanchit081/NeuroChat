import React from 'react';
import { useNavigate } from 'react-router-dom';
import './About.css';

const About = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="about-container">
      {/* Header */}
      <header className="about-header">
        <button onClick={handleBack} className="back-btn">
          ← Back to Home
        </button>
        <h1 className="about-title">About NeuroChat</h1>
      </header>

      {/* Main Content */}
      <main className="about-content">
        <section className="hero-about">
          <div className="about-logo">
            <span className="logo-icon">💬</span>
            <h2 className="gradient-text">NeuroChat</h2>
          </div>
          <p className="about-tagline">The Future of Secure Messaging</p>
        </section>

        <section className="about-info">
          <div className="info-card">
            <h3>What is NeuroChat?</h3>
            <p>
              NeuroChat is a cutting-edge real-time messaging platform that combines 
              neural-inspired design with advanced security features. Built for the modern 
              digital age, it provides seamless communication with end-to-end encryption, 
              ensuring your conversations remain private and secure.
            </p>
          </div>

          <div className="info-card">
            <h3>Key Features</h3>
            <ul className="features-list">
              <li>⚡ <strong>Real-time Messaging</strong> - Instant message delivery with live typing indicators</li>
              <li>🔒 <strong>End-to-end Encryption</strong> - Military-grade security for all conversations</li>
              <li>👥 <strong>Friend Requests</strong> - Connect with friends using email-based invitations</li>
              <li>🌐 <strong>Cross-platform</strong> - Access your chats on any device, anywhere</li>
              <li>📱 <strong>Mobile-first Design</strong> - Optimized for smartphones and tablets</li>
              <li>🎨 <strong>Modern UI/UX</strong> - Beautiful, intuitive interface with smooth animations</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>Technology Stack</h3>
            <div className="tech-grid">
              <div className="tech-item">
                <span className="tech-icon">⚛️</span>
                <span>React.js</span>
              </div>
              <div className="tech-item">
                <span className="tech-icon">🟢</span>
                <span>Node.js</span>
              </div>
              <div className="tech-item">
                <span className="tech-icon">🔌</span>
                <span>Socket.io</span>
              </div>
              <div className="tech-item">
                <span className="tech-icon">🍃</span>
                <span>MongoDB</span>
              </div>
            </div>
          </div>

          <div className="info-card sanchitverse-card">
            <h3>A Product of SanchitVerse</h3>
            <p>
              NeuroChat is proudly developed by <strong>SanchitVerse</strong>, a technology 
              innovation hub focused on creating next-generation digital solutions. 
              SanchitVerse specializes in building cutting-edge applications that combine 
              beautiful design with powerful functionality.
            </p>
            <div className="sanchitverse-info">
              <div className="creator-badge">
                <span className="badge-icon">🚀</span>
                <div className="badge-content">
                  <h4>SanchitVerse</h4>
                  <p>Innovation • Design • Technology</p>
                </div>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>Privacy & Security</h3>
            <p>
              Your privacy is our top priority. NeuroChat implements industry-standard 
              encryption protocols to ensure that only you and your intended recipients 
              can read your messages. We don't store your messages on our servers, 
              and we never sell your data to third parties.
            </p>
          </div>

          <div className="info-card">
            <h3>Get Started</h3>
            <p>
              Ready to experience the future of messaging? Create your account today 
              and start connecting with friends and family through secure, real-time 
              conversations.
            </p>
            <div className="cta-buttons">
              <button onClick={() => navigate('/register')} className="cta-btn primary">
                Sign Up Now
              </button>
              <button onClick={() => navigate('/login')} className="cta-btn secondary">
                Login
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="about-footer">
        <p>&copy; 2024 NeuroChat by SanchitVerse. All rights reserved.</p>
        <p className="footer-tagline">Developed with ❤️ by SanchitVerse</p>
      </footer>
    </div>
  );
};

export default About;
