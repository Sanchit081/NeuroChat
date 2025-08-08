const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Store connected users
const connectedUsers = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

// Handle socket connection
const handleConnection = (io) => {
  return async (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.userId})`);
    
    // Store connected user
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      isTyping: false
    });

    // Update user online status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date()
    });

    // Join user to their own room
    socket.join(socket.userId);

    // Broadcast user online status to all connected users
    socket.broadcast.emit('userOnline', {
      userId: socket.userId,
      username: socket.user.username,
      isOnline: true
    });

    // Send list of online users to the newly connected user
    const onlineUsers = Array.from(connectedUsers.values()).map(user => ({
      userId: user.user._id,
      username: user.user.username,
      profilePicture: user.user.profilePicture,
      isOnline: true
    }));
    
    socket.emit('onlineUsers', onlineUsers);

    // Handle joining a conversation room
    socket.on('joinConversation', (data) => {
      const { recipientId } = data;
      const roomId = [socket.userId, recipientId].sort().join('-');
      socket.join(roomId);
      console.log(`User ${socket.user.username} joined conversation room: ${roomId}`);
    });

    // Handle leaving a conversation room
    socket.on('leaveConversation', (data) => {
      const { recipientId } = data;
      const roomId = [socket.userId, recipientId].sort().join('-');
      socket.leave(roomId);
      console.log(`User ${socket.user.username} left conversation room: ${roomId}`);
    });

    // Handle sending messages
    socket.on('sendMessage', async (data) => {
      try {
        const { recipientId, content, messageType = 'text' } = data;

        // Validate recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
          socket.emit('messageError', { error: 'Recipient not found' });
          return;
        }

        // Create and save message
        const message = new Message({
          sender: socket.userId,
          recipient: recipientId,
          content,
          messageType,
          status: 'sent'
        });

        await message.save();
        await message.populate('sender', 'username profilePicture');
        await message.populate('recipient', 'username profilePicture');

        // Send to conversation room
        const roomId = [socket.userId, recipientId].sort().join('-');
        io.to(roomId).emit('newMessage', message);

        // If recipient is online, mark as delivered
        if (connectedUsers.has(recipientId)) {
          message.status = 'delivered';
          await message.save();
          
          // Notify sender of delivery
          socket.emit('messageDelivered', {
            messageId: message._id,
            status: 'delivered'
          });

          // Send delivery notification to recipient
          const recipientSocket = connectedUsers.get(recipientId);
          if (recipientSocket) {
            io.to(recipientSocket.socketId).emit('messageDelivered', {
              messageId: message._id,
              status: 'delivered'
            });
          }
        }

        console.log(`Message sent from ${socket.user.username} to ${recipient.username}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    // Handle message read status
    socket.on('markAsRead', async (data) => {
      try {
        const { messageId, senderId } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          return;
        }

        // Only recipient can mark as read
        if (message.recipient.toString() !== socket.userId) {
          return;
        }

        message.status = 'read';
        message.readAt = new Date();
        await message.save();

        // Notify sender that message was read
        const senderConnection = connectedUsers.get(senderId);
        if (senderConnection) {
          io.to(senderConnection.socketId).emit('messageRead', {
            messageId: message._id,
            status: 'read',
            readAt: message.readAt
          });
        }

        console.log(`Message ${messageId} marked as read by ${socket.user.username}`);
      } catch (error) {
        console.error('Mark as read error:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { recipientId, isTyping } = data;
      
      // Update user typing status
      const userConnection = connectedUsers.get(socket.userId);
      if (userConnection) {
        userConnection.isTyping = isTyping;
      }

      // Notify recipient
      const recipientConnection = connectedUsers.get(recipientId);
      if (recipientConnection) {
        io.to(recipientConnection.socketId).emit('userTyping', {
          userId: socket.userId,
          username: socket.user.username,
          isTyping
        });
      }
    });

    // Handle user status updates
    socket.on('updateStatus', async (data) => {
      try {
        const { status } = data;
        
        await User.findByIdAndUpdate(socket.userId, { status });
        
        // Broadcast status update to all connected users
        socket.broadcast.emit('userStatusUpdate', {
          userId: socket.userId,
          status
        });
      } catch (error) {
        console.error('Update status error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.userId})`);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);

      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date()
      });

      // Broadcast user offline status
      socket.broadcast.emit('userOffline', {
        userId: socket.userId,
        username: socket.user.username,
        isOnline: false,
        lastSeen: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  };
};

// Get online users
const getOnlineUsers = () => {
  return Array.from(connectedUsers.values()).map(user => ({
    userId: user.user._id,
    username: user.user.username,
    profilePicture: user.user.profilePicture,
    isOnline: true,
    isTyping: user.isTyping
  }));
};

// Check if user is online
const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

module.exports = {
  authenticateSocket,
  handleConnection,
  getOnlineUsers,
  isUserOnline,
  connectedUsers
};
