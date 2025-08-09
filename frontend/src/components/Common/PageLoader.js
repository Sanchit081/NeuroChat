import React, { useState, useEffect } from 'react';
import './PageLoader.css';

const PageLoader = ({ onLoadingComplete }) => {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const quotes = [
    "Connecting minds, one message at a time...",
    "Where conversations spark innovation...",
    "Building bridges through digital dialogue...",
    "Your thoughts, amplified by technology...",
    "Empowering communication in the neural age...",
    "Where every chat creates connections..."
  ];

  useEffect(() => {
    // Cycle through quotes every 2 seconds
    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 2000);

    // Auto-hide loader after 3 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onLoadingComplete) {
          onLoadingComplete();
        }
      }, 300); // Wait for fade out animation
    }, 3000);

    return () => {
      clearInterval(quoteInterval);
      clearTimeout(hideTimer);
    };
  }, [onLoadingComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`page-loader ${!isVisible ? 'fade-out' : ''}`}>
      <div className="loader-content">
        {/* Logo/Brand Section */}
        <div className="brand-section">
          <div className="logo-container">
            <div className="neural-icon">
              <div className="neural-node"></div>
              <div className="neural-node"></div>
              <div className="neural-node"></div>
              <div className="neural-connection"></div>
              <div className="neural-connection connection-2"></div>
            </div>
          </div>
          <h1 className="brand-title">NeuroChat</h1>
          <p className="brand-subtitle">by SanchitVerse</p>
        </div>

        {/* Quote Section */}
        <div className="quote-section">
          <p className="loading-quote" key={currentQuote}>
            {quotes[currentQuote]}
          </p>
        </div>

        {/* Loading Animation */}
        <div className="loading-animation">
          <div className="neural-pulse">
            <div className="pulse-ring"></div>
            <div className="pulse-ring ring-2"></div>
            <div className="pulse-ring ring-3"></div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p className="loading-text">Initializing Neural Networks...</p>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
