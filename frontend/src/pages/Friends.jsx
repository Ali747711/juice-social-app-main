// pages/Friends.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import { 
  FaUserPlus, 
  FaUserCheck, 
  FaUserTimes, 
  FaSearch, 
  FaEnvelope, 
  FaTimes, 
  FaUserFriends,
  FaPaperPlane,
  FaExclamationTriangle,
  FaSync,
  FaInfoCircle
} from 'react-icons/fa';
import styles from './Friends.module.css';

// Import API utilities
import { API_URLS, apiRequest, formatUrl } from '../utils/api';

const Friends = () => {
  const { currentUser } = useAuth();
  const { isUserOnline } = useSocket();
  const navigate = useNavigate();
  
  // State
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
  const [error, setError] = useState({
    general: null,
    friends: null,
    receivedRequests: null,
    sentRequests: null,
    search: null
  });
  
  // Refs for tracking mount status
  const isMounted = useRef(true);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Check backend health before loading data
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        await apiRequest('get', API_URLS.healthCheck);
        console.log('Backend health check passed, proceeding with data loading');
        loadAllData();
      } catch (error) {
        console.warn('Initial backend health check failed:', error);
        // Proceed with loading data anyway, but display a general warning
        setError(prev => ({
          ...prev,
          general: 'Experiencing connection issues. Some data might not load correctly. You can try refreshing the page.'
        }));
        // Still attempt to load data despite health check failure
        loadAllData();
      }
    };
    
    checkBackendHealth();
  }, []);

  // Load all data at once
  const loadAllData = () => {
    getFriends();
    getReceivedRequests();
    getSentRequests();
  };
  
  // Fetch friends with retry logic
  const getFriends = async () => {
    if (!isMounted.current) return;
    
    setLoading(prev => ({ ...prev, friends: true }));
    setError(prev => ({ ...prev, friends: null })); // Clear error before attempting to load
    
    try {
      const data = await apiRequest('get', API_URLS.getFriends);
      if (isMounted.current) {
        setFriends(data.data?.friends || []);
        setError(prev => ({ ...prev, friends: null })); // Explicitly clear error on success
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      if (isMounted.current) {
        setError(prev => ({ 
          ...prev, 
          friends: 'Failed to load friends. Please try again.' 
        }));
      }
    } finally {
      if (isMounted.current) {
        setLoading(prev => ({ ...prev, friends: false }));
      }
    }
  };
  
  // Fetch received friend requests
  const getReceivedRequests = async () => {
    if (!isMounted.current) return;
    
    setLoading(prev => ({ ...prev, receivedRequests: true }));
    setError(prev => ({ ...prev, receivedRequests: null })); // Clear error before attempting to load
    
    try {
      const data = await apiRequest('get', API_URLS.getReceivedRequests);
      if (isMounted.current) {
        setPendingReceivedRequests(data.data?.requests || []);
        setError(prev => ({ ...prev, receivedRequests: null })); // Explicitly clear error on success
      }
    } catch (error) {
      console.error('Error fetching received requests:', error);
      if (isMounted.current) {
        setError(prev => ({ 
          ...prev, 
          receivedRequests: 'Failed to load friend requests. Please try again.' 
        }));
      }
    } finally {
      if (isMounted.current) {
        setLoading(prev => ({ ...prev, receivedRequests: false }));
      }
    }
  };
  
  // Fetch sent friend requests
  const getSentRequests = async () => {
    if (!isMounted.current) return;
    
    setLoading(prev => ({ ...prev, sentRequests: true }));
    setError(prev => ({ ...prev, sentRequests: null })); // Clear error before attempting to load
    
    try {
      const data = await apiRequest('get', API_URLS.getSentRequests);
      if (isMounted.current) {
        setPendingSentRequests(data.data?.requests || []);
        setError(prev => ({ ...prev, sentRequests: null })); // Explicitly clear error on success
      }
    } catch (error) {
      console.error('Error fetching sent requests:', error);
      if (isMounted.current) {
        setError(prev => ({ 
          ...prev, 
          sentRequests: 'Failed to load sent requests. Please try again.' 
        }));
      }
    } finally {
      if (isMounted.current) {
        setLoading(prev => ({ ...prev, sentRequests: false }));
      }
    }
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !isMounted.current) return;
    
    setLoading(prev => ({ ...prev, search: true }));
    setError(prev => ({ ...prev, search: null })); // Clear error before attempting to load
    
    try {
      const data = await apiRequest('get', API_URLS.searchUsers, { query: searchQuery });
      if (isMounted.current) {
        setSearchResults(data.users || []);
        setError(prev => ({ ...prev, search: null })); // Explicitly clear error on success
      }
    } catch (error) {
      console.error('Error searching users:', error);
      if (isMounted.current) {
        setError(prev => ({ 
          ...prev, 
          search: 'Search failed. Please try again.' 
        }));
      }
    } finally {
      if (isMounted.current) {
        setLoading(prev => ({ ...prev, search: false }));
      }
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
    if (!isMounted.current || !userId) return;
    
    try {
      const url = formatUrl(API_URLS.sendFriendRequest, { userId });
      await apiRequest('post', url);
      
      // Update UI to show pending request
      const user = searchResults.find(user => user._id === userId);
      if (user) {
        setPendingSentRequests(prev => [
          ...prev,
          { receiver: user, status: 'pending' }
        ]);
        
        // Remove from search results
        setSearchResults(prev => prev.filter(user => user._id !== userId));
      } else {
        console.warn('User not found in search results after sending request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request. Please try again.');
    }
  };
  
  // Accept friend request
  const acceptFriendRequest = async (requestId) => {
    if (!isMounted.current || !requestId) return;
    
    try {
      const url = formatUrl(API_URLS.acceptFriendRequest, { requestId });
      await apiRequest('put', url);
      
      // Find the request
      const request = pendingReceivedRequests.find(req => req._id === requestId);
      
      if (request && request.sender) {
        // Update UI by removing the request and adding to friends
        setPendingReceivedRequests(prev => prev.filter(req => req._id !== requestId));
        setFriends(prev => [...prev, request.sender]);
      } else {
        console.warn('Request or sender not found after accepting');
        // Refresh requests to sync UI with server
        getReceivedRequests();
        getFriends();
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request. Please try again.');
    }
  };
  
  // Reject friend request
  const rejectFriendRequest = async (requestId) => {
    if (!isMounted.current || !requestId) return;
    
    try {
      const url = formatUrl(API_URLS.rejectFriendRequest, { requestId });
      await apiRequest('put', url);
      
      // Update UI by removing the request
      setPendingReceivedRequests(prev => prev.filter(req => req._id !== requestId));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Failed to reject friend request. Please try again.');
    }
  };
  
  // Cancel sent friend request
  const cancelFriendRequest = async (userId) => {
    if (!isMounted.current || !userId) return;
    
    try {
      // We need to find the request first to get its ID
      const request = pendingSentRequests.find(req => req.receiver && req.receiver._id === userId);
      
      if (request && request._id) {
        const url = formatUrl(API_URLS.cancelFriendRequest, { requestId: request._id });
        await apiRequest('delete', url);
        
        // Update UI by removing the request
        setPendingSentRequests(prev => prev.filter(req => req.receiver && req.receiver._id === userId));
      } else {
        console.error('Could not find request ID for user:', userId);
        alert('Failed to cancel friend request. Could not find request details.');
        // Refresh sent requests to sync UI with server
        getSentRequests();
      }
    } catch (error) {
      console.error('Error canceling friend request:', error);
      alert('Failed to cancel friend request. Please try again.');
    }
  };
  
  // Remove friend
  const removeFriend = async (friendId) => {
    if (!isMounted.current || !friendId) return;
    
    try {
      const url = formatUrl(API_URLS.removeFriend, { friendId });
      await apiRequest('delete', url);
      
      // Update UI by removing the friend
      setFriends(prev => prev.filter(friend => friend._id !== friendId));
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend. Please try again.');
    }
  };
  
  // Handle retry when loading fails
  const handleRetry = (section) => {
    if (section === 'friends') {
      getFriends();
    } else if (section === 'receivedRequests') {
      getReceivedRequests();
    } else if (section === 'sentRequests') {
      getSentRequests();
    } else if (section === 'search') {
      handleSearch();
    } else if (section === 'general') {
      // Clear general error and retry all data loading
      setError(prev => ({ ...prev, general: null }));
      loadAllData();
    } else {
      // Retry all
      loadAllData();
    }
  };
  
  // Error display component
  const ErrorDisplay = ({ message, onRetry }) => (
    <div className={styles.errorContainer}>
      <FaExclamationTriangle className={styles.errorIcon} />
      <p className={styles.errorMessage}>{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm">
          <FaSync className="mr-1" /> Retry
        </Button>
      )}
    </div>
  );

  // Warning display component
  const WarningDisplay = ({ message, onRetry }) => (
    <div className={styles.warningContainer}>
      <FaInfoCircle className={styles.warningIcon} />
      <p className={styles.warningMessage}>{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm">
          <FaSync className="mr-1" /> Retry
        </Button>
      )}
    </div>
  );
  
  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Friends</h1>
        
        {/* Global Warning/Error */}
        {error.general && (
          <WarningDisplay 
            message={error.general} 
            onRetry={() => handleRetry('general')} 
          />
        )}
        
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
          
          {error.search && (
            <ErrorDisplay 
              message={error.search} 
              onRetry={() => handleRetry('search')} 
            />
          )}
          
          {searchQuery && searchResults.length > 0 && !error.search && (
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
          
          {searchQuery && searchResults.length === 0 && !loading.search && !error.search && (
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
              ) : error.friends ? (
                <ErrorDisplay 
                  message={error.friends} 
                  onRetry={() => handleRetry('friends')} 
                />
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
                          onClick={() => navigate(`/chat/${friend._id}`)}
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
              ) : error.receivedRequests ? (
                <ErrorDisplay 
                  message={error.receivedRequests} 
                  onRetry={() => handleRetry('receivedRequests')} 
                />
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
              ) : error.sentRequests ? (
                <ErrorDisplay 
                  message={error.sentRequests} 
                  onRetry={() => handleRetry('sentRequests')} 
                />
              ) : pendingSentRequests.length > 0 ? (
                <div className={styles.requestsList}>
                  {pendingSentRequests.map(request => (
                    <div key={request._id || (request.receiver && request.receiver._id)} className={styles.requestItem}>
                      {request.receiver && (
                        <>
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
                        </>
                      )}
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
