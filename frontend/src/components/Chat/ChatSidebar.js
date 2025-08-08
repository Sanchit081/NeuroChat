import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Chat.css';

const ChatSidebar = ({ 
  user, 
  conversations, 
  users, 
  onlineUsers, 
  selectedUser, 
  onUserSelect, 
  onLogout,
  activeTab,
  setActiveTab 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some(u => u.userId === userId);
  };

  const getProfilePicture = (user) => {
    if (user.profilePicture) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${user.profilePicture}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=667eea&color=fff&size=40`;
  };

  return (
    <div className="chat-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="user-info">
          <img 
            src={getProfilePicture(user)} 
            alt={user.username}
            className="user-avatar"
          />
          <div className="user-details">
            <h3>{user.username}</h3>
            <span className="user-status">Online</span>
          </div>
        </div>
        
        <div className="header-actions">
          <Link to="/profile" className="action-btn" title="Profile">
            ⚙️
          </Link>
          <button onClick={onLogout} className="action-btn" title="Logout">
            🚪
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Tabs */}
      <div className="sidebar-tabs">
        <button 
          className={`tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          Chats ({conversations.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          Contacts ({users.length})
        </button>
      </div>

      {/* Content */}
      <div className="sidebar-content">
        {activeTab === 'chats' ? (
          <div className="conversations-list">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  className={`conversation-item ${selectedUser?._id === conv._id ? 'active' : ''}`}
                  onClick={() => onUserSelect(conv)}
                >
                  <div className="conversation-avatar">
                    <img 
                      src={getProfilePicture(conv)} 
                      alt={conv.username}
                    />
                    {isUserOnline(conv._id) && <div className="online-indicator"></div>}
                  </div>
                  
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <h4>{conv.username}</h4>
                      <span className="conversation-time">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    </div>
                    
                    <div className="conversation-preview">
                      <p className="last-message">
                        {conv.lastMessageType === 'text' 
                          ? conv.lastMessage 
                          : `📎 ${conv.lastMessageType}`
                        }
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No conversations yet</p>
                <small>Start a new chat from contacts</small>
              </div>
            )}
          </div>
        ) : (
          <div className="contacts-list">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((contact) => (
                <div
                  key={contact._id}
                  className={`contact-item ${selectedUser?._id === contact._id ? 'active' : ''}`}
                  onClick={() => onUserSelect(contact)}
                >
                  <div className="contact-avatar">
                    <img 
                      src={getProfilePicture(contact)} 
                      alt={contact.username}
                    />
                    {isUserOnline(contact._id) && <div className="online-indicator"></div>}
                  </div>
                  
                  <div className="contact-info">
                    <h4>{contact.username}</h4>
                    <p className="contact-email">{contact.email}</p>
                    <span className={`contact-status ${isUserOnline(contact._id) ? 'online' : 'offline'}`}>
                      {isUserOnline(contact._id) ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No contacts found</p>
                <small>Try a different search term</small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
