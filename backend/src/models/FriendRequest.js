const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 200,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate requests
friendRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });

// Update the updatedAt field before saving
friendRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to check if users are friends
friendRequestSchema.statics.areFriends = async function(userId1, userId2) {
  const friendship = await this.findOne({
    $or: [
      { sender: userId1, recipient: userId2, status: 'accepted' },
      { sender: userId2, recipient: userId1, status: 'accepted' }
    ]
  });
  return !!friendship;
};

// Static method to get user's friends
friendRequestSchema.statics.getUserFriends = async function(userId) {
  const friendships = await this.find({
    $or: [
      { sender: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  }).populate('sender', 'username profilePicture isOnline lastSeen')
    .populate('recipient', 'username profilePicture isOnline lastSeen');

  return friendships.map(friendship => {
    return friendship.sender._id.toString() === userId.toString() 
      ? friendship.recipient 
      : friendship.sender;
  });
};

module.exports = mongoose.model('FriendRequest', friendRequestSchema);
