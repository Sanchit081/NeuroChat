import React, { useState, useEffect } from 'react';
import { 
  getFriends, 
  getReceivedRequests, 
  getSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  searchUsers
} from '../../services/friendService';
import './FriendManager.css';

const FriendManager = ({ onClose, onFriendSelect }) => {
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        getFriends(),
        getReceivedRequests(),
        getSentRequests()
      ]);
      
      setFriends(friendsRes.friends || []);
      setReceivedRequests(receivedRes.requests || []);
      setSentRequests(sentRes.requests || []);
    } catch (error) {
      setError('Failed to load friend data');
      console.error('Load friend data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError('Search query must be at least 2 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await searchUsers(searchQuery.trim());
      setSearchResults(result.users || []);
    } catch (error) {
      setError('Search failed');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      setLoading(true);
      setError('');
      await sendFriendRequest(userId);
      setSuccess('Friend request sent!');
      
      // Update search results to reflect new status
      setSearchResults(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, friendshipStatus: 'sent' }
          : user
      ));
      
      // Reload sent requests
      const sentRes = await getSentRequests();
      setSentRequests(sentRes.requests || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setLoading(true);
      setError('');
      const result = await acceptFriendRequest(requestId);
      setSuccess(`You are now friends with ${result.friend.username}!`);
      
      // Reload data
      await loadData();
    } catch (error) {
      setError('Failed to accept friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      setLoading(true);
      setError('');
      await declineFriendRequest(requestId);
      setSuccess('Friend request declined');
      
      // Reload received requests
      const receivedRes = await getReceivedRequests();
      setReceivedRequests(receivedRes.requests || []);
    } catch (error) {
      setError('Failed to decline friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId, friendName) => {
    if (!window.confirm(`Remove ${friendName} from your friends?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await removeFriend(friendId);
      setSuccess(`${friendName} removed from friends`);
      
      // Reload friends
      const friendsRes = await getFriends();
      setFriends(friendsRes.friends || []);
    } catch (error) {
      setError('Failed to remove friend');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const renderFriends = () => (
    <div className="friends-list">
      {friends.length === 0 ? (
        <div className="empty-state">
          <p>No friends yet. Search for users to send friend requests!</p>
        </div>
      ) : (
        friends.map(friend => (
          <div key={friend._id} className="friend-item">
            <img 
              src={friend.profilePicture || '/default-avatar.png'} 
              alt={friend.username}
              className="friend-avatar"
            />
            <div className="friend-info">
              <h4>{friend.username}</h4>
              <span className={`status ${friend.isOnline ? 'online' : 'offline'}`}>
                {friend.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="friend-actions">
              <button 
                className="chat-btn"
                onClick={() => {
                  onFriendSelect(friend);
                  onClose();
                }}
              >
                Chat
              </button>
              <button 
                className="remove-btn"
                onClick={() => handleRemoveFriend(friend._id, friend.username)}
              >
                Remove
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderReceivedRequests = () => (
    <div className="requests-list">
      {receivedRequests.length === 0 ? (
        <div className="empty-state">
          <p>No pending friend requests</p>
        </div>
      ) : (
        receivedRequests.map(request => (
          <div key={request._id} className="request-item">
            <img 
              src={request.sender.profilePicture || '/default-avatar.png'} 
              alt={request.sender.username}
              className="request-avatar"
            />
            <div className="request-info">
              <h4>{request.sender.username}</h4>
              {request.message && <p className="request-message">"{request.message}"</p>}
              <span className="request-time">
                {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="request-actions">
              <button 
                className="accept-btn"
                onClick={() => handleAcceptRequest(request._id)}
              >
                Accept
              </button>
              <button 
                className="decline-btn"
                onClick={() => handleDeclineRequest(request._id)}
              >
                Decline
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderSentRequests = () => (
    <div className="requests-list">
      {sentRequests.length === 0 ? (
        <div className="empty-state">
          <p>No sent requests</p>
        </div>
      ) : (
        sentRequests.map(request => (
          <div key={request._id} className="request-item">
            <img 
              src={request.recipient.profilePicture || '/default-avatar.png'} 
              alt={request.recipient.username}
              className="request-avatar"
            />
            <div className="request-info">
              <h4>{request.recipient.username}</h4>
              <span className="request-status">Pending</span>
              <span className="request-time">
                Sent {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderSearch = () => (
    <div className="search-section">
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-btn">
          🔍
        </button>
      </div>
      
      <div className="search-results">
        {searchResults.map(user => (
          <div key={user._id} className="search-result-item">
            <img 
              src={user.profilePicture || '/default-avatar.png'} 
              alt={user.username}
              className="search-avatar"
            />
            <div className="search-info">
              <h4>{user.username}</h4>
              <span className="search-email">{user.email}</span>
            </div>
            <div className="search-actions">
              {user.friendshipStatus === 'none' && (
                <button 
                  className="send-request-btn"
                  onClick={() => handleSendRequest(user._id)}
                >
                  Add Friend
                </button>
              )}
              {user.friendshipStatus === 'sent' && (
                <span className="status-badge sent">Request Sent</span>
              )}
              {user.friendshipStatus === 'received' && (
                <span className="status-badge received">Pending Response</span>
              )}
              {user.friendshipStatus === 'friends' && (
                <span className="status-badge friends">Friends</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="friend-manager-overlay">
      <div className="friend-manager">
        <div className="friend-manager-header">
          <h2>Friends & Requests</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={clearMessages}>×</button>
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
            <button onClick={clearMessages}>×</button>
          </div>
        )}

        <div className="friend-tabs">
          <button 
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends ({friends.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            Requests ({receivedRequests.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            Sent ({sentRequests.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Add Friends
          </button>
        </div>

        <div className="friend-content">
          {loading && <div className="loading">Loading...</div>}
          
          {!loading && (
            <>
              {activeTab === 'friends' && renderFriends()}
              {activeTab === 'received' && renderReceivedRequests()}
              {activeTab === 'sent' && renderSentRequests()}
              {activeTab === 'search' && renderSearch()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendManager;
