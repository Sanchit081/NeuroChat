const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'seen'],
    default: 'sent'
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  seenAt: {
    type: Date,
    default: null
  },
  editedAt: {
    type: Date,
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, status: 1 });
messageSchema.index({ createdAt: -1 });

// Static method to get chat history between two users
messageSchema.statics.getChatHistory = function(userId1, userId2, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 }
    ]
  })
  .populate('sender', 'username profilePicture')
  .populate('recipient', 'username profilePicture')
  .populate('replyTo', 'content sender')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

// Static method to mark messages as delivered
messageSchema.statics.markAsDelivered = function(recipientId, senderId) {
  return this.updateMany(
    {
      recipient: recipientId,
      sender: senderId,
      status: 'sent'
    },
    {
      status: 'delivered',
      deliveredAt: new Date()
    }
  );
};

// Static method to mark messages as seen
messageSchema.statics.markAsSeen = function(recipientId, senderId) {
  return this.updateMany(
    {
      recipient: recipientId,
      sender: senderId,
      status: { $in: ['sent', 'delivered'] }
    },
    {
      status: 'seen',
      seenAt: new Date()
    }
  );
};

// Static method to get unread message count
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    status: { $ne: 'seen' }
  });
};

// Static method to get last message between users
messageSchema.statics.getLastMessage = function(userId1, userId2) {
  return this.findOne({
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 }
    ]
  })
  .populate('sender', 'username')
  .sort({ createdAt: -1 });
};

// Instance method to mark as edited
messageSchema.methods.markAsEdited = function() {
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Message', messageSchema);
