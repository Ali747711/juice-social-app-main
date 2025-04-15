// pages/Friends.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import axios from 'axios';
import { 
  FaUserPlus, 
  FaUserCheck, 
  FaUserTimes, 
  FaSearch, 
  FaEnvelope, 
  FaTimes, 
  FaUserFriends,
  FaPaperPlane
} from 'react-icons/fa';
import styles from './Friends.module.css';

const Friends = () => {
  const { currentUser } = useAuth();
  const { isUserOnline } = useSocket();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [pendingReceivedRequests, setPendingReceivedRequests] = useState([]);
  const [pendingSentRequests, setPendingSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState({
    friends: true,
    receivedRequests: true,
    sentRequests: true,
    search: false
  });
  
  // Fetch friends
  useEffect(() => {
    const getFriends = async () => {
      try {
        const res = await axios.get('/api/friends');
        setFriends(res.data.friends);
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setLoading(prev => ({ ...prev, friends: false }));
      }
    };
    
    getFriends();
  }, []);
  
  // Fetch received friend requests
  useEffect(() => {
    const getReceivedRequests = async () => {
      try {
        const res = await axios.get('/api/friends/requests');
        setPendingReceivedRequests(res.data.requests);
      } catch (error) {
        console.error('Error fetching received requests:', error);
      } finally {
        setLoading(prev => ({ ...prev, receivedRequests: false }));
      }
    };
    
    getReceivedRequests();
  }, []);
  
  // Fetch sent friend requests
  useEffect(() => {
    const getSentRequests = async () => {
      try {
        const res = await axios.get('/api/friends/requests/sent');
        setPendingSentRequests(res.data.requests);
      } catch (error) {
        console.error('Error fetching sent requests:', error);
      } finally {
        setLoading(prev => ({ ...prev, sentRequests: false }));
      }
    };
    
    getSentRequests();
  }, []);
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(prev => ({ ...prev, search: true }));
    
    try {
      const res = await axios.get(`/api/users/search?query=${searchQuery}`);
      setSearchResults(res.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };
  
  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };
  
  // Send friend request
  const sendFriendRequest = async (userId) => {
    try {
      await axios.post(`/api/friends/request/${userId}`);
      
      // Update UI to show pending request
      const user = searchResults.find(user => user._id === userId);
      setPendingSentRequests(prev => [
        ...prev,
        { receiver: user, status: 'pending' }
      ]);
      
      // Remove from search results
      setSearchResults(prev => prev.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request');
    }
  };
  
  // Accept friend request
  const acceptFriendRequest = async (requestId) => {
    try {
      await axios.put(`/api/friends/request/${requestId}/accept`);
      
      // Find the request
      const request = pendingReceivedRequests.find(req => req._id === requestId);
      
      // Update UI by removing the request and adding to friends
      setPendingReceivedRequests(prev => prev.filter(req => req._id !== requestId));
      setFriends(prev => [...prev, request.sender]);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request');
    }
  };
  
  // Reject friend request
  const rejectFriendRequest = async (requestId) => {
    try {
      await axios.put(`/api/friends/request/${requestId}/reject`);
      
      // Update UI by removing the request
      setPendingReceivedRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Failed to reject friend request');
    }
  };
  
  // Cancel sent friend request
  const cancelFriendRequest = async (userId) => {
    try {
      // We need to find the request first to get its ID
      const request = pendingSentRequests.find(req => req.receiver._id === userId);
      
      if (request) {
        await axios.delete(`/api/friends/request/${request._id}`);
        
        // Update UI by removing the request
        setPendingSentRequests(prev => prev.filter(req => req.receiver._id !== userId));
      }
    } catch (error) {
      console.error('Error canceling friend request:', error);
      alert('Failed to cancel friend request');
    }
  };
  
  // Remove friend
  const removeFriend = async (friendId) => {
    try {
      await axios.delete(`/api/friends/${friendId}`);
      
      // Update UI by removing the friend
      setFriends(prev => prev.filter(friend => friend._id !== friendId));
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend');
    }
  };
  
  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Friends</h1>
        
        {/* Search Section */}
        <Card>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <div className={styles.searchInput}>
              <FaSearch className={styles.searchInputIcon} />
              <input
                type="text"
                placeholder="Search for friends by username or name"
                value={searchQuery}
                onChange={handleSearchInputChange}
                className={styles.searchInputField}
              />
            </div>
            <Button
              type="submit"
              loading={loading.search}
              className={styles.searchButton}
            >
              <FaSearch className="mr-2" />
              Search
            </Button>
          </form>
          
          {searchQuery && searchResults.length > 0 && (
            <div className={styles.searchResults}>
              <h3 className={styles.searchResultsTitle}>
                Search Results
              </h3>
              <div className={styles.resultsList}>
                {searchResults.map(user => (
                  <div key={user._id} className={styles.resultItem}>
                    <Avatar user={user} />
                    <div className={styles.resultInfo}>
                      <p className={styles.resultName}>
                        {user.fullName}
                      </p>
                      <p className={styles.resultUsername}>
                        @{user.username}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => sendFriendRequest(user._id)}
                    >
                      <FaUserPlus className="mr-1" />
                      Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {searchQuery && searchResults.length === 0 && !loading.search && (
            <div className={styles.searchResults}>
              <EmptyState
                type="search"
                title="No users found"
                message={`No users matching "${searchQuery}" were found.`}
              />
            </div>
          )}
        </Card>
        
        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <div
              className={`${styles.tab} ${activeTab === 'friends' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              <FaUserFriends className="mr-2 inline" />
              Friends {friends.length > 0 && `(${friends.length})`}
            </div>
            <div
              className={`${styles.tab} ${activeTab === 'requests' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <FaUserPlus className="mr-2 inline" />
              Requests {pendingReceivedRequests.length > 0 && `(${pendingReceivedRequests.length})`}
            </div>
            <div
              className={`${styles.tab} ${activeTab === 'sent' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('sent')}
            >
              <FaPaperPlane className="mr-2 inline" />
              Sent {pendingSentRequests.length > 0 && `(${pendingSentRequests.length})`}
            </div>
          </div>
        </div>
        
        {/* Content based on active tab */}
        <div>
          {activeTab === 'friends' && (
            <div>
              {loading.friends ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 border-t-juice-primary rounded-full mb-2"></div>
                  <p>Loading your friends...</p>
                </div>
              ) : friends.length > 0 ? (
                <div className={styles.friendsList}>
                  {friends.map(friend => (
                    <div key={friend._id} className={styles.friendItem}>
                      <div className={styles.friendInfo}>
                        <div className={styles.friendAvatar}>
                          <Avatar user={friend} />
                        </div>
                        <div className={styles.friendDetails}>
                          <p className={styles.friendName}>
                            {friend.fullName}
                          </p>
                          <p className={styles.friendUsername}>
                            @{friend.username}
                          </p>
                          <div className={styles.onlineStatus}>
                            <span className={`${styles.statusDot} ${isUserOnline(friend._id) ? styles.online : styles.offline}`}></span>
                            {isUserOnline(friend._id) ? 'Online' : 'Offline'}
                          </div>
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <button
                          className={styles.messageButton}
                          onClick={() => window.location.href = `/chat/${friend._id}`}
                        >
                          <FaEnvelope className={styles.buttonIcon} />
                          Message
                        </button>
                        <button
                          className={styles.removeButton}
                          onClick={() => removeFriend(friend._id)}
                        >
                          <FaTimes className={styles.buttonIcon} />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  type="friends"
                  title="No friends yet"
                  message="Search for users to add them as friends."
                />
              )}
            </div>
          )}
          
          {activeTab === 'requests' && (
            <div>
              {loading.receivedRequests ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 border-t-juice-primary rounded-full mb-2"></div>
                  <p>Loading friend requests...</p>
                </div>
              ) : pendingReceivedRequests.length > 0 ? (
                <div className={styles.requestsList}>
                  {pendingReceivedRequests.map(request => (
                    <div key={request._id} className={styles.requestItem}>
                      <div className={styles.friendInfo}>
                        <div className={styles.friendAvatar}>
                          <Avatar user={request.sender} />
                        </div>
                        <div className={styles.friendDetails}>
                          <p className={styles.friendName}>
                            {request.sender.fullName}
                          </p>
                          <p className={styles.friendUsername}>
                            @{request.sender.username}
                          </p>
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <button
                          className={styles.acceptButton}
                          onClick={() => acceptFriendRequest(request._id)}
                        >
                          <FaUserCheck className={styles.buttonIcon} />
                          Accept
                        </button>
                        <button
                          className={styles.rejectButton}
                          onClick={() => rejectFriendRequest(request._id)}
                        >
                          <FaUserTimes className={styles.buttonIcon} />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  type="friends"
                  title="No pending requests"
                  message="When someone sends you a friend request, it will appear here."
                />
              )}
            </div>
          )}
          
          {activeTab === 'sent' && (
            <div>
              {loading.sentRequests ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 border-t-juice-primary rounded-full mb-2"></div>
                  <p>Loading sent requests...</p>
                </div>
              ) : pendingSentRequests.length > 0 ? (
                <div className={styles.requestsList}>
                  {pendingSentRequests.map(request => (
                    <div key={request._id || request.receiver._id} className={styles.requestItem}>
                      <div className={styles.friendInfo}>
                        <div className={styles.friendAvatar}>
                          <Avatar user={request.receiver} />
                        </div>
                        <div className={styles.friendDetails}>
                          <p className={styles.friendName}>
                            {request.receiver.fullName}
                          </p>
                          <p className={styles.friendUsername}>
                            @{request.receiver.username}
                          </p>
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <button
                          className={styles.removeButton}
                          onClick={() => cancelFriendRequest(request.receiver._id)}
                        >
                          <FaTimes className={styles.buttonIcon} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  type="friends"
                  title="No sent requests"
                  message="You haven't sent any friend requests yet."
                />
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Friends;