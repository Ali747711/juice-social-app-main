// src/components/ChatPage/ConversationList.jsx
import React from 'react';
import ConversationItem from './ConversationItem';
import styles from './ConversationList.module.css';

/**
 * ConversationList - Renders the sidebar with all conversations and search
 * 
 * @param {Array} conversations - Array of conversation objects
 * @param {string} currentUserId - Current user's ID
 * @param {string} selectedUserId - Selected conversation user ID
 * @param {string} searchQuery - Current search query
 * @param {Function} setSearchQuery - Function to update search query
 * @param {Function} selectConversation - Function to select a conversation
 * @param {Function} formatTime - Function to format timestamps
 * @param {Function} getInitials - Function to get user initials for avatar
 * @param {Function} isUserOnline - Function to check if user is online
 * @param {boolean} loading - Whether conversations are loading
 * @param {Function} navigateToFriends - Function to navigate to friends page
 */
const ConversationList = ({ 
  conversations, 
  currentUserId, 
  selectedUserId,
  searchQuery, 
  setSearchQuery,
  selectConversation,
  formatTime,
  getInitials,
  isUserOnline,
  loading,
  navigateToFriends
}) => {
  // Filter conversations based on search query
  const filteredConversations = searchQuery
    ? conversations.filter(conversation => 
        conversation.user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.sidebarIcon} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
          Messages
        </h2>
        <div className={styles.searchContainer}>
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.searchIcon} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>
      
      <div className={styles.conversationsList}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading conversations...</p>
          </div>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map(conversation => (
            <ConversationItem
              key={conversation.user._id}
              conversation={conversation}
              currentUserId={currentUserId}
              isActive={selectedUserId === conversation.user._id}
              formatTime={formatTime}
              onSelect={selectConversation}
              getInitials={getInitials}
              isOnline={isUserOnline(conversation.user._id)}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className={styles.emptyStateTitle}>No conversations yet</h3>
            <p className={styles.emptyStateText}>Start a conversation with a friend to see it here.</p>
            <button 
              onClick={navigateToFriends}
              className={styles.emptyStateButton}
            >
              Find Friends
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;