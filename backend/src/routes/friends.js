const express = require('express');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's friends
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const friends = await FriendRequest.getUserFriends(req.user.userId);
    res.json({ success: true, friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pending friend requests (received)
router.get('/requests/received', authenticateToken, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      recipient: req.user.userId,
      status: 'pending'
    }).populate('sender', 'username profilePicture')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get sent friend requests
router.get('/requests/sent', authenticateToken, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.user.userId,
      status: 'pending'
    }).populate('recipient', 'username profilePicture')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Send friend request
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { recipientId, message = '' } = req.body;
    const senderId = req.user.userId;

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if trying to send request to self
    if (senderId === recipientId) {
      return res.status(400).json({ success: false, message: 'Cannot send friend request to yourself' });
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId }
      ]
    });

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'You are already friends' });
      } else if (existingRequest.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Friend request already sent' });
      } else if (existingRequest.status === 'blocked') {
        return res.status(400).json({ success: false, message: 'Cannot send friend request' });
      }
    }

    // Create new friend request
    const friendRequest = new FriendRequest({
      sender: senderId,
      recipient: recipientId,
      message: message.trim()
    });

    await friendRequest.save();
    await friendRequest.populate('sender', 'username profilePicture');
    await friendRequest.populate('recipient', 'username profilePicture');

    res.status(201).json({
      success: true,
      message: 'Friend request sent successfully',
      request: friendRequest
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Friend request already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Accept friend request
router.post('/request/:requestId/accept', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    const friendRequest = await FriendRequest.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    }).populate('sender', 'username profilePicture');

    if (!friendRequest) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();

    res.json({
      success: true,
      message: 'Friend request accepted',
      friend: friendRequest.sender
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Decline friend request
router.post('/request/:requestId/decline', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;

    const friendRequest = await FriendRequest.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    friendRequest.status = 'declined';
    await friendRequest.save();

    res.json({
      success: true,
      message: 'Friend request declined'
    });
  } catch (error) {
    console.error('Decline friend request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Remove friend
router.delete('/friend/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    const friendship = await FriendRequest.findOne({
      $or: [
        { sender: userId, recipient: friendId, status: 'accepted' },
        { sender: friendId, recipient: userId, status: 'accepted' }
      ]
    });

    if (!friendship) {
      return res.status(404).json({ success: false, message: 'Friendship not found' });
    }

    await FriendRequest.deleteOne({ _id: friendship._id });

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search users (for sending friend requests)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.userId;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }

    // Search for users by username or email
    const users = await User.find({
      _id: { $ne: userId }, // Exclude current user
      $or: [
        { username: { $regex: query.trim(), $options: 'i' } },
        { email: { $regex: query.trim(), $options: 'i' } }
      ]
    }).select('username email profilePicture').limit(20);

    // Check friendship status for each user
    const usersWithStatus = await Promise.all(users.map(async (user) => {
      const friendRequest = await FriendRequest.findOne({
        $or: [
          { sender: userId, recipient: user._id },
          { sender: user._id, recipient: userId }
        ]
      });

      let status = 'none';
      if (friendRequest) {
        if (friendRequest.status === 'accepted') {
          status = 'friends';
        } else if (friendRequest.status === 'pending') {
          status = friendRequest.sender.toString() === userId ? 'sent' : 'received';
        } else if (friendRequest.status === 'declined') {
          status = 'declined';
        } else if (friendRequest.status === 'blocked') {
          status = 'blocked';
        }
      }

      return {
        ...user.toObject(),
        friendshipStatus: status
      };
    }));

    res.json({ success: true, users: usersWithStatus });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
