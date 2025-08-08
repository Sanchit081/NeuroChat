import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import './Chat.css';

const ChatWindow = ({ currentUser, selectedUser, messages, onlineUsers }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { sendMessage, joinConversation, leaveConversation, markAsRead, setTyping, typingUsers } = useSocket();

  // Join conversation when user is selected
  useEffect(() => {
    if (selectedUser) {
      joinConversation(selectedUser._id);
      
      // Mark messages as read
      const unreadMessages = messages.filter(msg => 
        msg.sender._id === selectedUser._id && 
        msg.recipient._id === currentUser._id && 
        msg.status !== 'read'
      );
      
      unreadMessages.forEach(msg => {
        markAsRead(msg._id, msg.sender._id);
      });
    }

    return () => {
      if (selectedUser) {
        leaveConversation(selectedUser._id);
      }
    };
  }, [selectedUser, joinConversation, leaveConversation, markAsRead, messages, currentUser._id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (newMessage.trim() && selectedUser) {
      sendMessage(selectedUser._id, newMessage.trim());
      setNewMessage('');
      
      // Stop typing indicator
      setTyping(selectedUser._id, false);
      setIsTyping(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      setTyping(selectedUser._id, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTyping(selectedUser._id, false);
    }, 2000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const getProfilePicture = (user) => {
    if (user.profilePicture) {
      return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/${user.profilePicture}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=667eea&color=fff&size=32`;
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some(u => u.userId === userId);
  };

  const getMessageStatus = (message) => {
    if (message.sender._id !== currentUser._id) return null;
    
    switch (message.status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '';
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach(message => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);
  const isTypingUser = typingUsers.has(selectedUser?._id);

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-user-info">
          <img 
            src={getProfilePicture(selectedUser)} 
            alt={selectedUser.username}
            className="chat-user-avatar"
          />
          <div className="chat-user-details">
            <h3>{selectedUser.username}</h3>
            <span className={`user-status ${isUserOnline(selectedUser._id) ? 'online' : 'offline'}`}>
              {isUserOnline(selectedUser._id) ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        
        <div className="chat-actions">
          <button className="action-btn" title="Voice Call">📞</button>
          <button className="action-btn" title="Video Call">📹</button>
          <button className="action-btn" title="More">⋮</button>
        </div>
      </div>
      
      {/* Encryption Notice */}
      <div className="encryption-notice">
        <span className="encryption-icon">🔒</span>
        <span className="encryption-text">Chat is end-to-end encrypted</span>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messageGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <div className="date-separator">
              <span>{formatDate(group.date)}</span>
            </div>
            
            {group.messages.map((message) => (
              <div
                key={message._id}
                className={`message ${message.sender._id === currentUser._id ? 'sent' : 'received'}`}
              >
                {message.sender._id !== currentUser._id && (
                  <img 
                    src={getProfilePicture(message.sender)} 
                    alt={message.sender.username}
                    className="message-avatar"
                  />
                )}
                
                <div className="message-content">
                  <div className="message-bubble">
                    <p>{message.content}</p>
                  </div>
                  
                  <div className="message-meta">
                    <span className="message-time">{formatTime(message.createdAt)}</span>
                    {message.sender._id === currentUser._id && (
                      <span className={`message-status ${message.status === 'read' ? 'read' : ''}`}>
                        {getMessageStatus(message)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTypingUser && (
          <div className="message received">
            <img 
              src={getProfilePicture(selectedUser)} 
              alt={selectedUser.username}
              className="message-avatar"
            />
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="message-input-container">
        <button type="button" className="attachment-btn" title="Attach File">
          📎
        </button>
        
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="message-input"
        />
        
        <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
