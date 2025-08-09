import api from "./api";

// Get user's friends
export const getFriends = async () => {
  const { data } = await api.get("/friends/friends");
  return data;
};

// Get received friend requests
export const getReceivedRequests = async () => {
  const { data } = await api.get("/friends/requests/received");
  return data;
};

// Get sent friend requests
export const getSentRequests = async () => {
  const { data } = await api.get("/friends/requests/sent");
  return data;
};

// Send friend request
export const sendFriendRequest = async (recipientId, message = '') => {
  const { data } = await api.post("/friends/request", { recipientId, message });
  return data;
};

// Accept friend request
export const acceptFriendRequest = async (requestId) => {
  const { data } = await api.post(`/friends/request/${requestId}/accept`);
  return data;
};

// Decline friend request
export const declineFriendRequest = async (requestId) => {
  const { data } = await api.post(`/friends/request/${requestId}/decline`);
  return data;
};

// Remove friend
export const removeFriend = async (friendId) => {
  const { data } = await api.delete(`/friends/friend/${friendId}`);
  return data;
};

// Search users for friend requests
export const searchUsers = async (query) => {
  const { data } = await api.get(`/friends/search?query=${encodeURIComponent(query)}`);
  return data;
};
