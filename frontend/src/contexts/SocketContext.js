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
      const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
      console.log('🔌 Attempting to connect to Socket.io server:', SOCKET_URL);
      
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to Socket.io server');
        setSocket(newSocket);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from Socket.io server:', reason);
      });

      newSocket.on('connect_error', (error) => {
        console.error('🚫 Socket.io connection error:', error.message);
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
        setMessages(prev => [...prev, message]);
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
    if (socket) {
      socket.emit('sendMessage', {
        recipientId,
        content,
        messageType
      });
    }
  };

  const joinConversation = (recipientId) => {
    if (socket) {
      socket.emit('joinConversation', { recipientId });
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
