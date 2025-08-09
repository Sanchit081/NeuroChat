import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import axios from 'axios';
import './Chat.css';

const Chat = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'contacts'
  const [showSidebar, setShowSidebar] = useState(true); // Mobile sidebar visibility
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const { user, logout } = useAuth();
  const { onlineUsers, messages, setMessages } = useSocket();

  // Handle mobile resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowSidebar(true); // Always show sidebar on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch conversations and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [conversationsRes, usersRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/messages/conversations`),
          axios.get(`${process.env.REACT_APP_API_URL}/users`)
        ]);
        
        setConversations(conversationsRes.data.conversations || []);
        setUsers(usersRes.data.users || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update conversations when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      setConversations(prev => {
        const otherUserId = lastMessage.sender._id === user._id 
          ? lastMessage.recipient._id 
          : lastMessage.sender._id;
        
        const existingConvIndex = prev.findIndex(conv => conv._id === otherUserId);
        
        if (existingConvIndex >= 0) {
          // Update existing conversation
          const updatedConversations = [...prev];
          updatedConversations[existingConvIndex] = {
            ...updatedConversations[existingConvIndex],
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.createdAt,
            lastMessageType: lastMessage.messageType,
            unreadCount: lastMessage.sender._id !== user._id 
              ? updatedConversations[existingConvIndex].unreadCount + 1 
              : updatedConversations[existingConvIndex].unreadCount
          };
          
          // Move to top
          const [updated] = updatedConversations.splice(existingConvIndex, 1);
          return [updated, ...updatedConversations];
        } else {
          // Create new conversation
          const otherUser = lastMessage.sender._id === user._id 
            ? lastMessage.recipient 
            : lastMessage.sender;
          
          const newConversation = {
            _id: otherUser._id,
            username: otherUser.username,
            profilePicture: otherUser.profilePicture,
            isOnline: onlineUsers.some(u => u.userId === otherUser._id),
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.createdAt,
            lastMessageType: lastMessage.messageType,
            unreadCount: lastMessage.sender._id !== user._id ? 1 : 0
          };
          
          return [newConversation, ...prev];
        }
      });
    }
  }, [messages, user._id, onlineUsers]);

  const handleUserSelect = async (selectedUser) => {
    setSelectedUser(selectedUser);
    
    // On mobile, hide sidebar when user is selected
    if (isMobile) {
      setShowSidebar(false);
    }
    
    // Mark conversation as read
    setConversations(prev => 
      prev.map(conv => 
        conv._id === selectedUser._id 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );

    // Fetch messages for this conversation
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/messages/${selectedUser._id}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const handleBackToSidebar = () => {
    console.log('📱 Back button clicked - returning to sidebar');
    if (isMobile) {
      setShowSidebar(true);
      setSelectedUser(null);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your chats...</p>
      </div>
    );
  }

  return (
    <div className={`chat-container ${isMobile ? 'mobile' : ''}`}>
      {/* Sidebar - show/hide based on mobile state */}
      {(!isMobile || showSidebar) && (
        <ChatSidebar
          user={user}
          conversations={conversations}
          users={users}
          onlineUsers={onlineUsers}
          selectedUser={selectedUser}
          onUserSelect={handleUserSelect}
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobile={isMobile}
          showSidebar={showSidebar}
        />
      )}
      
      {/* Chat Main - show/hide based on mobile state */}
      {(!isMobile || !showSidebar) && (
        <div className="chat-main">
          {/* Mobile back button */}
          {isMobile && selectedUser && (
            <div className="mobile-chat-header">
              <button 
                className="back-btn" 
                onClick={handleBackToSidebar}
                type="button"
                aria-label="Go back to chat list"
              >
                ← Back
              </button>
              <div className="mobile-user-info">
                <img 
                  src={selectedUser.profilePicture || '/default-avatar.png'} 
                  alt={selectedUser.username}
                  className="mobile-user-avatar"
                />
                <div className="mobile-user-details">
                  <span className="mobile-username">{selectedUser.username}</span>
                  <span className="mobile-user-status">
                    {onlineUsers.some(u => u.userId === selectedUser._id) ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {selectedUser ? (
            <ChatWindow
              currentUser={user}
              selectedUser={selectedUser}
              messages={messages}
              onlineUsers={onlineUsers}
              isMobile={isMobile}
            />
          ) : (
            <div className="chat-welcome">
              <div className="welcome-content">
                <h2>Welcome to NeuroChat!</h2>
                <p>Select a conversation to start secure chatting</p>
                <div className="welcome-features">
                  <div className="feature">
                    <span className="feature-icon">💬</span>
                    <span>Real-time messaging</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">👥</span>
                    <span>See who's online</span>
                  </div>
                  <div className="feature">
                    <span className="feature-icon">🔒</span>
                    <span>End-to-end encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Chat;
