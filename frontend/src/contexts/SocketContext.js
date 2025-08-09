import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Ensure we're using the correct protocol (https for production)
      let SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
      
      // Force HTTPS for production URLs
      if (window.location.hostname !== 'localhost') {
        SOCKET_URL = SOCKET_URL.replace('http://', 'https://');
      }
      
      console.log('🔌 Attempting to connect to Socket.io server:', SOCKET_URL);
      console.log('🔑 Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        secure: window.location.protocol === 'https:',
        timeout: 30000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        autoConnect: true
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to Socket.io server with ID:', newSocket.id);
        setSocket(newSocket);
      });

      newSocket.on('roomJoined', (data) => {
        console.log('🏠 Successfully joined conversation room:', data.roomId);
      });

      newSocket.on('messageError', (error) => {
        console.error('❌ Message error:', error);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from Socket.io server:', reason);
        if (reason === 'io server disconnect') {
          // The disconnection was initiated by the server, you need to reconnect manually
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('🚫 Socket.io connection error:', error.message);
        console.error('🚫 Error details:', error);
        
        // Check if it's an authentication error
        if (error.message.includes('Authentication')) {
          console.error('🔐 Authentication failed - token may be invalid or expired');
          // You might want to redirect to login or refresh the token here
        }
      });

      newSocket.on('onlineUsers', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('userOnline', (userData) => {
        setOnlineUsers(prev => {
          const filtered = prev.filter(u => u.userId !== userData.userId);
          return [...filtered, userData];
        });
      });

      newSocket.on('userOffline', (userData) => {
        setOnlineUsers(prev => prev.filter(u => u.userId !== userData.userId));
      });

      newSocket.on('newMessage', (message) => {
        console.log('📨 Received new message:', {
          messageId: message._id,
          sender: message.sender?.username,
          content: message.content?.substring(0, 50) + '...'
        });
        setMessages(prev => {
          // Avoid duplicate messages
          const exists = prev.find(msg => msg._id === message._id);
          if (exists) {
            console.log('⚠️ Duplicate message detected, skipping');
            return prev;
          }
          return [...prev, message];
        });
      });

      newSocket.on('messageDelivered', (data) => {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, status: data.status }
            : msg
        ));
      });

      newSocket.on('messageRead', (data) => {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, status: data.status, readAt: data.readAt }
            : msg
        ));
      });

      newSocket.on('userTyping', (data) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (data.isTyping) {
            newMap.set(data.userId, data.username);
          } else {
            newMap.delete(data.userId);
          }
          return newMap;
        });
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [user, token]);

  const sendMessage = (recipientId, content, messageType = 'text') => {
    if (socket && socket.connected) {
      console.log('📤 Sending message via socket:', {
        recipientId,
        content: content.substring(0, 50) + '...',
        messageType,
        socketConnected: socket.connected
      });
      socket.emit('sendMessage', {
        recipientId,
        content,
        messageType
      });
    } else {
      console.error('❌ Cannot send message - socket not connected:', {
        hasSocket: !!socket,
        connected: socket?.connected
      });
    }
  };

  const joinConversation = (recipientId) => {
    if (socket && socket.connected) {
      console.log('🏠 Joining conversation with:', recipientId);
      socket.emit('joinConversation', { recipientId });
    } else {
      console.error('❌ Cannot join conversation - socket not connected');
    }
  };

  const leaveConversation = (recipientId) => {
    if (socket) {
      socket.emit('leaveConversation', { recipientId });
    }
  };

  const markAsRead = (messageId, senderId) => {
    if (socket) {
      socket.emit('markAsRead', { messageId, senderId });
    }
  };

  const setTyping = (recipientId, isTyping) => {
    if (socket) {
      socket.emit('typing', { recipientId, isTyping });
    }
  };

  const updateStatus = (status) => {
    if (socket) {
      socket.emit('updateStatus', { status });
    }
  };

  const value = {
    socket,
    onlineUsers,
    messages,
    typingUsers,
    sendMessage,
    joinConversation,
    leaveConversation,
    markAsRead,
    setTyping,
    updateStatus,
    setMessages
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
