// pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Avatar from '../components/Avatar';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import axios from 'axios';
import { HiUserGroup, HiChat, HiChevronRight } from 'react-icons/hi';
import styles from './Home.module.css';

const Home = () => {
  const { currentUser } = useAuth();
  const { isUserOnline } = useSocket();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentConversations, setRecentConversations] = useState([]);
  const [loading, setLoading] = useState({
    friends: true,
    requests: true,
    conversations: true
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
  
  // Fetch pending friend requests
  useEffect(() => {
    const getPendingRequests = async () => {
      try {
        const res = await axios.get('/api/friends/requests');
        setPendingRequests(res.data.requests);
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      } finally {
        setLoading(prev => ({ ...prev, requests: false }));
      }
    };
    
    getPendingRequests();
  }, []);
  
  // Fetch recent conversations
  useEffect(() => {
    const getRecentConversations = async () => {
      try {
        const res = await axios.get('/api/messages');
        setRecentConversations(res.data.conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(prev => ({ ...prev, conversations: false }));
      }
    };
    
    getRecentConversations();
  }, []);
  
  return (
    <Layout>
      <div className={styles.homeContainer}>
        {/* Welcome Banner */}
        <div className={styles.welcomeBanner}>
          <div className={styles.welcomeAvatarWrapper}>
            <Avatar 
              user={currentUser} 
              size="lg" 
              showStatus={false} 
              className={styles.welcomeAvatar}
            />
          </div>
          <div className={styles.welcomeContent}>
            <h1 className={styles.welcomeHeading}>
              Welcome back, <span className={styles.highlightedName}>{currentUser?.fullName}</span>!
            </h1>
            <p className={styles.welcomeText}>
              Stay connected with your friends on Juice. Share moments, chat, and make connections.
            </p>
          </div>
        </div>
        
        <div className={styles.dashboardGrid}>
          {/* Friend Requests Section */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrapper}>
                <HiUserGroup className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Friend Requests</h2>
              </div>
            </div>
            
            <div className={styles.cardContent}>
              {loading.requests ? (
                <div className={styles.loadingIndicator}>
                  <div className={styles.loadingSpinner}></div>
                </div>
              ) : pendingRequests.length > 0 ? (
                pendingRequests.map(request => (
                  <div key={request._id} className={styles.requestItem}>
                    <div className={styles.avatarWrapper}>
                      <Avatar 
                        user={request.sender} 
                        size="md"
                        className={styles.avatarImage} 
                      />
                    </div>
                    <div className={styles.requestInfo}>
                      <p className={styles.userName}>{request.sender.fullName}</p>
                      <div className={styles.requestActions}>
                        <button className={styles.acceptButton}>Accept</button>
                        <button className={styles.declineButton}>Decline</button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <HiUserGroup />
                  </div>
                  <h3 className={styles.emptyStateTitle}>No friend requests</h3>
                  <p className={styles.emptyStateText}>When someone sends you a friend request, it will appear here.</p>
                </div>
              )}
            </div>
            
            <div className={styles.cardFooter}>
              <Link to="/friends" className={styles.footerLink}>
                <span>Manage Friends</span>
                <HiChevronRight className={styles.footerLinkIcon} />
              </Link>
            </div>
          </div>
          
          {/* Recent Conversations Section */}
          <div className={styles.dashboardCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrapper}>
                <HiChat className={styles.cardIcon} />
                <h2 className={styles.cardTitle}>Recent Conversations</h2>
                {recentConversations.length > 0 && (
                  <span className={styles.badgeCount}>{recentConversations.length}</span>
                )}
              </div>
            </div>
            
            <div className={styles.cardContent}>
              {loading.conversations ? (
                <div className={styles.loadingIndicator}>
                  <div className={styles.loadingSpinner}></div>
                </div>
              ) : recentConversations.length > 0 ? (
                recentConversations.map(conversation => (
                  <Link 
                    key={conversation.user._id}
                    to={`/chat/${conversation.user._id}`}
                    className={styles.conversationItem}
                  >
                    <div className={styles.avatarWrapper}>
                      <Avatar 
                        user={conversation.user} 
                        size="md"
                        className={styles.avatarImage} 
                      />
                      {conversation.unreadCount > 0 && (
                        <span className={styles.unreadBadge}>
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className={styles.conversationInfo}>
                      <div className={styles.conversationHeader}>
                        <h3 className={styles.userName}>{conversation.user.fullName}</h3>
                        <span className={styles.messageTime}>
                          {new Date(conversation.lastMessage.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className={styles.messagePreview}>
                        {conversation.lastMessage.sender === currentUser._id 
                          ? <span className={styles.youText}>You: </span> 
                          : ''
                        }
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <HiChat />
                  </div>
                  <h3 className={styles.emptyStateTitle}>No conversations yet</h3>
                  <p className={styles.emptyStateText}>Start a conversation with a friend to see it here.</p>
                </div>
              )}
            </div>
            
            <div className={styles.cardFooter}>
              <Link to="/chat" className={styles.footerLink}>
                <span>View All Conversations</span>
                <HiChevronRight className={styles.footerLinkIcon} />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Friends Section */}
        <div className={styles.friendsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <HiUserGroup className={styles.sectionIcon} />
              <h2 className={styles.sectionTitle}>Friends</h2>
              {friends.length > 0 && (
                <span className={styles.badgeCount}>{friends.length}</span>
              )}
            </div>
          </div>
          
          {loading.friends ? (
            <div className={styles.loadingIndicator}>
              <div className={styles.loadingSpinner}></div>
            </div>
          ) : friends.length > 0 ? (
            <div className={styles.friendsGrid}>
              {friends.map(friend => (
                <Link
                  key={friend._id}
                  to={`/chat/${friend._id}`}
                  className={styles.friendCard}
                >
                  <div className={styles.friendAvatarWrapper}>
                    <Avatar 
                      user={friend} 
                      size="lg"
                      className={styles.friendAvatarImage} 
                    />
                    <div className={`${styles.statusDot} ${isUserOnline(friend._id) ? styles.online : ''}`}></div>
                  </div>
                  <h3 className={styles.friendName}>{friend.fullName}</h3>
                  <p className={`${styles.friendStatus} ${isUserOnline(friend._id) ? styles.onlineText : ''}`}>
                    {isUserOnline(friend._id) ? 'Online' : 'Offline'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>
                <HiUserGroup />
              </div>
              <h3 className={styles.emptyStateTitle}>No friends yet</h3>
              <p className={styles.emptyStateText}>Add friends to connect and chat with them.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Home;