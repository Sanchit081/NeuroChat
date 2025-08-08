import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateProfile, updateProfilePicture, logout } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    status: user?.status || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const result = await updateProfile(formData);
    
    if (result.success) {
      setMessage('Profile updated successfully!');
      setMessageType('success');
    } else {
      setMessage(result.message);
      setMessageType('error');
    }
    
    setLoading(false);
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      setMessage('');

      const result = await updateProfilePicture(file);
      
      if (result.success) {
        setMessage('Profile picture updated successfully!');
        setMessageType('success');
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
      
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getProfilePicture = () => {
    if (user?.profilePicture) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${user.profilePicture}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'User')}&background=667eea&color=fff&size=120`;
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <Link to="/chat" className="back-btn">
          ← Back to Chat
        </Link>
        <h1>Profile Settings</h1>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <div className="profile-picture-container">
              <img 
                src={getProfilePicture()} 
                alt={user?.username}
                className="profile-picture"
              />
              <label htmlFor="profilePicture" className="picture-upload-btn">
                📷
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  style={{ display: 'none' }}
                  disabled={loading}
                />
              </label>
            </div>
            <h2>{user?.username}</h2>
            <p className="user-email">{user?.email}</p>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="profile-form">
            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Status Message</label>
              <textarea
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                placeholder="What's on your mind?"
                rows="3"
                maxLength="150"
                disabled={loading}
              />
              <small className="char-count">
                {formData.status.length}/150 characters
              </small>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="save-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>

          {/* Account Actions */}
          <div className="account-actions">
            <h3>Account</h3>
            <div className="action-item">
              <span>Member since: {new Date(user?.createdAt).toLocaleDateString()}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
