const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const FriendRequest = require('../models/FriendRequest');

// Store connected users
const connectedUsers = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    console.log('🔐 Socket authentication attempt:', {
      hasToken: !!token,
      tokenLength: token?.length,
      socketId: socket.id,
      origin: socket.handshake.headers.origin
    });
    
    if (!token) {
      console.log('❌ No token provided for socket authentication');
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('❌ User not found for socket authentication:', decoded.userId);
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    console.log('✅ Socket authenticated successfully:', user.username);
    next();
  } catch (error) {
    console.error('❌ Socket authentication error:', error.message);
    next(new Error(`Authentication error: ${error.message}`));
  }
};

// Handle socket connection
const handleConnection = (io) => {
  return async (socket) => {
    console.log(`✅ User connected: ${socket.user.username} (${socket.userId}) - Socket ID: ${socket.id}`);
    
    // Store connected user
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      isTyping: false
    });
    
    console.log(`📊 Total connected users: ${connectedUsers.size}`);

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
      
      const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
      console.log(`✅ User ${socket.user.username} joined room: ${roomId} (${roomSize} members)`);
      
      // Confirm room join to client
      socket.emit('roomJoined', { roomId, recipientId, roomSize });
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
        console.log('📥 Received sendMessage event:', {
          data,
          userId: socket.userId,
          username: socket.user?.username
        });
        
        const { recipientId, content, messageType = 'text' } = data;

        // Validate input
        if (!recipientId || !content) {
          console.error('❌ Invalid message data:', { recipientId, content });
          socket.emit('messageError', { error: 'Invalid message data' });
          return;
        }

        // Validate recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
          console.error('❌ Recipient not found:', recipientId);
          socket.emit('messageError', { error: 'Recipient not found' });
          return;
        }

        // Check if users are friends
        const areFriends = await FriendRequest.areFriends(socket.userId, recipientId);
        if (!areFriends) {
          console.error('❌ Users are not friends:', { sender: socket.userId, recipient: recipientId });
          socket.emit('messageError', { error: 'You can only message friends' });
          return;
        }

        // Create and save message
        const message = new Message({
          sender: socket.userId,
          recipient: recipientId,
          content: content.trim(),
          messageType,
          status: 'sent'
        });

        console.log('💾 Saving message to database...');
        const savedMessage = await message.save();
        console.log('✅ Message saved:', savedMessage._id);
        
        await savedMessage.populate('sender', 'username profilePicture');
        await savedMessage.populate('recipient', 'username profilePicture');
        
        console.log('👥 Message populated with user data');

        // Send to conversation room
        const roomId = [socket.userId, recipientId].sort().join('-');
        console.log(`📤 Sending message to room ${roomId}:`, {
          messageId: savedMessage._id,
          sender: savedMessage.sender.username,
          recipient: savedMessage.recipient.username,
          content: savedMessage.content.substring(0, 50) + '...',
          roomMembers: io.sockets.adapter.rooms.get(roomId)?.size || 0
        });
        
        // Prepare message object for emission
        const messageToSend = {
          _id: savedMessage._id,
          sender: savedMessage.sender,
          recipient: savedMessage.recipient,
          content: savedMessage.content,
          messageType: savedMessage.messageType,
          status: savedMessage.status,
          createdAt: savedMessage.createdAt,
          updatedAt: savedMessage.updatedAt
        };
        
        // Send to room first
        io.to(roomId).emit('newMessage', messageToSend);
        
        // CRITICAL: Always send directly to both users to ensure delivery
        console.log(`📨 Direct message delivery:`);
        console.log(`- Sender ${socket.user.username} (${socket.id})`);
        socket.emit('newMessage', messageToSend);
        
        if (connectedUsers.has(recipientId)) {
          const recipientSocket = connectedUsers.get(recipientId);
          console.log(`- Recipient ${recipient.username} (${recipientSocket.socketId})`);
          io.to(recipientSocket.socketId).emit('newMessage', messageToSend);
        } else {
          console.log(`- Recipient ${recipient.username} is offline`);
        }

        // If recipient is online, mark as delivered
        if (connectedUsers.has(recipientId)) {
          savedMessage.status = 'delivered';
          await savedMessage.save();
          console.log('✅ Message marked as delivered');
          
          // Notify sender of delivery
          socket.emit('messageDelivered', {
            messageId: savedMessage._id,
            status: 'delivered'
          });

          // Send delivery notification to recipient
          const recipientSocket = connectedUsers.get(recipientId);
          if (recipientSocket) {
            io.to(recipientSocket.socketId).emit('messageDelivered', {
              messageId: savedMessage._id,
              status: 'delivered'
            });
          }
        }

        console.log(`✅ Message sent successfully from ${socket.user.username} to ${recipient.username}`);
      } catch (error) {
        console.error('❌ CRITICAL Send message error:', {
          error: error.message,
          stack: error.stack,
          data: data,
          userId: socket.userId,
          username: socket.user?.username,
          recipientId: data?.recipientId,
          content: data?.content
        });
        socket.emit('messageError', { 
          error: 'Failed to send message',
          details: error.message,
          code: 'SEND_MESSAGE_ERROR'
        });
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
