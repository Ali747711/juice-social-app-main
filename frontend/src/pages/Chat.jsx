// /frontend/pages/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';
import { 
  FaPaperPlane, 
  FaArrowLeft, 
  FaSearch, 
  FaComments,
  FaSmile,
  FaPaperclip,
  FaFile
} from 'react-icons/fa';

// Import custom hooks
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';

// Import components
import MessageBubble from '../components/ChatPage/MessageBubble';
import AvatarDisplay from '../components/ChatPage/AvatarDisplay';
import UserInfoPanel from '../components/ChatPage/UserInfoPanel';
import EmojiPicker from '../components/ChatPage/EmojiPicker';
import ChatInput from '../components/ChatPage/ChatInput';

// Import API_URLS for consistent API endpoint usage
import { API_URLS } from '../utils/api';

import styles from './Chat.module.css';

const Chat = () => {
  const { userId } = useParams(); // Selected user to chat with
  const { currentUser } = useAuth();
  const { socket, sendMessage, sendTypingIndicator, isUserOnline } = useSocket();
  const navigate = useNavigate();
  
  // State management
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState({
    conversations: true,
    messages: false,
    sending: false,
  });
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [userInfoVisible, setUserInfoVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [mutedUsers, setMutedUsers] = useState([]);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  
  // Effect to handle clicks outside emoji picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await axios.get(API_URLS.getConversations);
        setConversations(res.data.conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(prev => ({ ...prev, conversations: false }));
      }
    };
    
    fetchConversations();
  }, []);
  
  // Fetch selected user details if userId is in URL
  useEffect(() => {
    if (userId) {
      const fetchUserDetails = async () => {
        try {
          setLoading(prev => ({ ...prev, messages: true }));
          
          // Fetch user info
          const userRes = await axios.get(`${API_URLS.getUserDetails}/${userId}`);
          setSelectedUser(userRes.data.user);
          
          // Fetch messages
          await fetchMessages(userId);
        } catch (error) {
          console.error('Error fetching user details:', error);
          navigate('/chat');
        }
      };
      
      fetchUserDetails();
    } else {
      setSelectedUser(null);
      setMessages([]);
    }
  }, [userId, navigate]);
  
  // Fetch messages for a conversation
  const fetchMessages = async (userId) => {
    try {
      const res = await axios.get(`${API_URLS.getMessages}/${userId}`);
      setMessages(res.data.messages);
      setLoading(prev => ({ ...prev, messages: false }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  // Socket.io event listeners
  useEffect(() => {
    if (!socket) return;
    
    // Listen for incoming messages
    const handleReceiveMessage = (message) => {
      setMessages(prev => [...prev, message]);
      
      // If message is from the selected user, mark it as read
      if (
        selectedUser && 
        message.sender === selectedUser._id &&
        message.receiver === currentUser._id
      ) {
        markMessageAsRead(message._id);
      }
      
      // Update conversations list
      updateConversationsWithNewMessage(message);
    };
    
    // Listen for typing indicators
    const handleUserTyping = ({ userId }) => {
      setTypingUsers(prev => {
        const updatedMap = new Map(prev);
        updatedMap.set(userId, true);
        
        // Set timeout to clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const updatedMap = new Map(prev);
            updatedMap.delete(userId);
            return updatedMap;
          });
        }, 3000);
        
        return updatedMap;
      });
    };
    
    // Listen for socket events
    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);
    
    // Clean up
    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
    };
  }, [socket, selectedUser, currentUser]);
  
  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Mark message as read
  const markMessageAsRead = async (messageId) => {
    try {
      await axios.put(`${API_URLS.markMessageAsRead}/${messageId}/read`);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  // Update conversations list with new message
  const updateConversationsWithNewMessage = (message) => {
    setConversations(prev => {
      const newConversations = [...prev];
      
      // Find if conversation exists
      const isCurrentUserSender = message.sender === currentUser._id;
      const otherUserId = isCurrentUserSender ? message.receiver : message.sender;
      const conversationIndex = newConversations.findIndex(
        c => c.user._id === otherUserId
      );
      
      if (conversationIndex !== -1) {
        // Update existing conversation
        const conversation = { ...newConversations[conversationIndex] };
        conversation.lastMessage = message;
        
        if (!isCurrentUserSender) {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }
        
        // Move to top of list
        newConversations.splice(conversationIndex, 1);
        newConversations.unshift(conversation);
      } else if (selectedUser && selectedUser._id === otherUserId) {
        // Create new conversation if it's with the currently selected user
        newConversations.unshift({
          user: selectedUser,
          lastMessage: message,
          unreadCount: isCurrentUserSender ? 0 : 1
        });
      }
      
      return newConversations;
    });
  };
  
  // Check if a user is blocked
  const isUserBlocked = (userId) => {
    return blockedUsers.includes(userId);
  };
  
  // Check if a user is muted
  const isUserMuted = (userId) => {
    return mutedUsers.includes(userId);
  };
  
  // Toggle block status
  const handleToggleBlock = () => {
    if (!selectedUser) return;
    
    const userId = selectedUser._id;
    
    if (isUserBlocked(userId)) {
      setBlockedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setBlockedUsers(prev => [...prev, userId]);
    }
  };
  
  // Toggle mute status
  const handleToggleMute = () => {
    if (!selectedUser) return;
    
    const userId = selectedUser._id;
    
    if (isUserMuted(userId)) {
      setMutedUsers(prev => prev.filter(id => id !== userId));
    } else {
      setMutedUsers(prev => [...prev, userId]);
    }
  };
  
  // Test direct upload function
  const testDirectUpload = async (files) => {
    console.log("Starting direct upload test with", files.length, "files");
    const formData = new FormData();
    
    files.forEach((file, index) => {
      console.log(`Test upload - file ${index}:`, file.name, file.type, file.size);
      formData.append('files', file);
    });
    
    try {
      console.log("Sending test upload request");
      const response = await axios.post(API_URLS.uploadFiles, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log("Direct upload test result:", response.data);
      return true;
    } catch (error) {
      console.error("Direct upload test failed:", error);
      console.error("Error details:", error.response ? error.response.data : 'No response data');
      return false;
    }
  };
  
  // Handle file uploads and sending messages with files
  const handleSendWithFiles = async (files = []) => {
    console.log("handleSendWithFiles called with", files.length, "files and message:", messageInput);
    
    if (!messageInput.trim() && files.length === 0) {
      console.log("No message or files to send");
      return;
    }
    
    if (!selectedUser) {
      console.log("No selected user to send message to");
      return;
    }
    
    // Check if the user is blocked before sending message
    if (isUserBlocked(selectedUser._id)) {
      alert("You have blocked this user. Unblock them to send messages.");
      return;
    }
    
    setLoading(prev => ({ ...prev, sending: true }));
    
    try {
      // Create a temporary ID for UI purposes
      const tempId = `temp-${Date.now()}`;
      console.log("Created temporary message ID:", tempId);
      
      // Create file previews (for immediate UI display)
      const filePreviewUrls = [];
      const fileInfo = [];
      
      // Process files if any
      if (files.length > 0) {
        console.log("Processing", files.length, "files");
        
        for (const file of files) {
          console.log("Processing file:", file.name, file.type, file.size);
          
          // Create preview URLs
          if (file.type.startsWith('image/')) {
            console.log("File is an image");
            filePreviewUrls.push({
              type: 'image',
              url: URL.createObjectURL(file),
              name: file.name
            });
            
            fileInfo.push({
              type: 'image',
              name: file.name,
              size: file.size
            });
          } else if (file.type.startsWith('video/')) {
            console.log("File is a video");
            filePreviewUrls.push({
              type: 'video',
              url: URL.createObjectURL(file),
              name: file.name
            });
            
            fileInfo.push({
              type: 'video',
              name: file.name,
              size: file.size
            });
          } else {
            console.log("File is a document");
            filePreviewUrls.push({
              type: 'file',
              name: file.name
            });
            
            fileInfo.push({
              type: 'file',
              name: file.name,
              size: file.size
            });
          }
        }
      }
      
      // Create a new message object for immediate UI update
      const newMessage = {
        _id: tempId,
        content: messageInput,
        sender: currentUser._id,
        receiver: selectedUser._id,
        createdAt: new Date(),
        read: false,
        files: fileInfo,
        filePreviewUrls // This is only for UI, won't be sent to server
      };
      
      console.log("Created message object for UI:", { 
        messageId: newMessage._id, 
        contentLength: newMessage.content.length,
        filesCount: newMessage.files.length
      });
      
      // Update messages state immediately for UI
      setMessages(prev => [...prev, newMessage]);
      
      // Test direct upload first
      if (files.length > 0) {
        console.log("Testing direct upload before proceeding");
        const testResult = await testDirectUpload([...files]);
        if (!testResult) {
          console.error("Basic upload test failed - server might not be configured properly");
          alert("File upload test failed. Check server configuration.");
          // Continue with message sending, but without files
        }
      }
      
      // Upload files if any
      let uploadedFiles = [];
      if (files.length > 0) {
        console.log("Starting actual file upload process");
        const formData = new FormData();
        
        files.forEach((file, index) => {
          console.log(`Appending file ${index} to FormData:`, file.name);
          formData.append('files', file);
        });
        
        // Log FormData contents
        console.log("FormData created with these entries:");
        if (formData.entries) {
          for (let pair of formData.entries()) {
            console.log(pair[0], pair[1].name);
          }
        }
        
        try {
          // Upload the files
          console.log("Sending upload request to API_URLS.uploadFiles");
          const uploadResponse = await axios.post(API_URLS.uploadFiles, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          console.log("Upload response received:", uploadResponse.data);
          uploadedFiles = uploadResponse.data.files || [];
        } catch (uploadError) {
          console.error("File upload failed but continuing with message:", uploadError);
          console.error("Upload error details:", uploadError.response ? uploadError.response.data : 'No response data');
          // Continue with sending the message, but without the files
        }
      }
      
      // Use Socket.IO to send the message with file information
      console.log("Sending message via socket with", uploadedFiles.length, "files");
      sendMessage(selectedUser._id, messageInput, uploadedFiles);
      
      // Clear input
      setMessageInput('');
      
      // Focus input field after sending
      inputRef.current?.focus();
      
      // Close emoji picker if open
      setShowEmojiPicker(false);
      
      // Clear typing indicator
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      
      console.log("Message sending process completed successfully");
    } catch (error) {
      console.error('Error sending message with files:', error);
      console.error('Error details:', error.response ? error.response.data : 'No response data');
      console.error('Error stack:', error.stack);
      alert('Failed to send message or upload files');
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };
  
  // Send a message (without files - legacy function)
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUser) return;
    
    // Check if the user is blocked before sending message
    if (isUserBlocked(selectedUser._id)) {
      alert("You have blocked this user. Unblock them to send messages.");
      return;
    }
    
    setLoading(prev => ({ ...prev, sending: true }));
    
    try {
      // Create a new message object for immediate UI update
      const newMessage = {
        _id: `temp-${Date.now()}`, // Temporary ID until server response
        content: messageInput,
        sender: currentUser._id,
        receiver: selectedUser._id,
        createdAt: new Date(),
        read: false
      };
      
      // Update messages state immediately for UI
      setMessages(prev => [...prev, newMessage]);
      
      // Use Socket.IO to send the message
      sendMessage(selectedUser._id, messageInput);
      
      // Clear input
      setMessageInput('');
      
      // Focus input field after sending
      inputRef.current?.focus();
      
      // Close emoji picker if open
      setShowEmojiPicker(false);
      
      // Clear typing indicator
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };
  
  // Handle input change and typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator if user is typing
    if (selectedUser && e.target.value) {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      sendTypingIndicator(selectedUser._id);
      
      // Set a timeout to clear typing indicator
      const timeout = setTimeout(() => {
        setTypingTimeout(null);
      }, 3000);
      
      setTypingTimeout(timeout);
    }
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setMessageInput(prev => prev + emoji);
    inputRef.current?.focus();
    setShowEmojiPicker(false);
  };
  
  // Toggle emoji picker
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
  };
  
  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };
  
  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Check if date should be shown (for message grouping)
  const shouldShowDate = (message, index) => {
    if (index === 0) return true;
    
    const currentDate = new Date(message.createdAt).toDateString();
    const prevDate = new Date(messages[index - 1].createdAt).toDateString();
    
    return currentDate !== prevDate;
  };
  
  // Select a conversation
  const selectConversation = (userId) => {
    navigate(`/chat/${userId}`);
  };
  
  // Get initials for fallback avatar
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Toggle user info panel
  const toggleUserInfo = () => {
    setUserInfoVisible(!userInfoVisible);
  };
  
  // Handle view profile action
  const handleViewProfile = () => {
    if (selectedUser) {
      navigate(`/profile/${selectedUser.username || selectedUser._id}`);
    }
  };
  
  // Close user info panel and ensure chat is visible
  const handleSendMessageFromPanel = () => {
    setUserInfoVisible(false);
    // Focus the message input if needed
    inputRef.current?.focus();
  };

  return (
    <Layout>
      <div className={styles.chatContainer}>
        <div className={styles.chatWrapper}>
          {/* Conversations Sidebar */}
          <div className={`${styles.sidebar} ${selectedUser ? styles.hiddenOnMobile : ''}`}>
            <div className={styles.sidebarHeader}>
              <h2 className={styles.sidebarTitle}>
                <FaComments className={styles.sidebarIcon} />
                Messages
              </h2>
              <div className={styles.searchContainer}>
                <FaSearch className={styles.searchIcon} />
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
              {loading.conversations ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingSpinner}></div>
                  <p className={styles.loadingText}>Loading conversations...</p>
                </div>
              ) : conversations.length > 0 ? (
                conversations
                  .filter(c => c.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(conversation => (
                    <div
                      key={conversation.user._id}
                      className={`${styles.conversationItem} ${selectedUser && selectedUser._id === conversation.user._id ? styles.active : ''}`}
                      onClick={() => selectConversation(conversation.user._id)}
                    >
                      <AvatarDisplay 
                        src={conversation.user.profilePicture} 
                        name={conversation.user.fullName} 
                        size="medium" 
                        showStatus={true} 
                        isOnline={isUserOnline(conversation.user._id)} 
                      />
                      
                      <div className={styles.conversationInfo}>
                        <div className={styles.conversationHeader}>
                          <h3 className={styles.conversationName}>
                            {conversation.user.fullName}
                          </h3>
                          <span className={styles.conversationTime}>
                            {conversation.lastMessage?.createdAt &&
                              formatTime(conversation.lastMessage.createdAt)}
                          </span>
                        </div>
                        
                        <div className={styles.messagePreview}>
                          {conversation.lastMessage?.sender === currentUser._id ? (
                            <span className={styles.youPrefix}>You: </span>
                          ) : ''}
                          {conversation.lastMessage?.files?.length > 0 ? (
                            <>
                              <FaFile style={{ marginRight: '4px', fontSize: '10px' }} />
                              {conversation.lastMessage.content ? 
                                conversation.lastMessage.content : 
                                `${conversation.lastMessage.files.length} attachment${conversation.lastMessage.files.length > 1 ? 's' : ''}`}
                            </>
                          ) : conversation.lastMessage?.content}
                        </div>
                      </div>
                      
                      {conversation.unreadCount > 0 && (
                        <div className={styles.unreadBadge}>
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>
                    <FaComments />
                  </div>
                  <h3 className={styles.emptyStateTitle}>No conversations yet</h3>
                  <p className={styles.emptyStateText}>Start a conversation with a friend to see it here.</p>
                  <button
                    onClick={() => navigate('/friends')}
                    className={styles.emptyStateButton}
                  >
                    Find Friends
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Main Chat Area */}
          <div className={styles.mainChat}>
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className={styles.chatHeader}>
                  <div className={styles.chatHeaderLeft}>
                    <button
                      className={styles.backButton}
                      onClick={() => navigate('/chat')}
                      aria-label="Back to conversations"
                    >
                      <FaArrowLeft />
                    </button>
                    
                    <div className={styles.chatUserInfo} onClick={toggleUserInfo}>
                      <AvatarDisplay 
                        src={selectedUser.profilePicture} 
                        name={selectedUser.fullName} 
                        size="medium" 
                        showStatus={true} 
                        isOnline={isUserOnline(selectedUser._id)} 
                      />
                      
                      <div className={styles.userDetails}>
                        <h2 className={styles.userName}>{selectedUser.fullName}</h2>
                        {typingUsers.has(selectedUser._id) ? (
                          <div className={styles.typingIndicator}>
                            <span className={styles.typingDot}></span>
                            <span className={styles.typingDot}></span>
                            <span className={styles.typingDot}></span>
                          </div>
                        ) : (
                          <p className={styles.userStatus}>
                            {isUserOnline(selectedUser._id) ? 'Online' : 'Offline'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.chatHeaderRight}>
                    <button 
                      className={styles.profileAvatarButton}
                      onClick={toggleUserInfo}
                      aria-label="View user info"
                    >
                      <AvatarDisplay 
                        src={selectedUser.profilePicture} 
                        name={selectedUser.fullName} 
                        size="small" 
                      />
                    </button>
                  </div>
                </div>
                
                {/* Messages */}
                <div className={styles.messagesContainer}>
                  {loading.messages ? (
                    <div className={styles.loadingContainer}>
                      <div className={styles.loadingSpinner}></div>
                      <p className={styles.loadingText}>Loading messages...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    <div className={styles.messagesList}>
                      {messages.map((message, index) => {
                        const isCurrentUser = message.sender === currentUser._id;
                        const showDate = shouldShowDate(message, index);
                        
                        return (
                          <div key={message._id || index}>
                            {showDate && (
                              <div className={styles.dateHeader}>
                                <span className={styles.dateLabel}>
                                  {new Date(message.createdAt).toLocaleDateString(undefined, { 
                                    weekday: 'long', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                            )}
                            
                            <MessageBubble 
                              message={message}
                              isCurrentUser={isCurrentUser}
                              formatTime={formatTime}
                            />
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <div className={styles.emptyStateIcon}>
                        <FaComments />
                      </div>
                      <h3 className={styles.emptyStateTitle}>No messages yet</h3>
                      <p className={styles.emptyStateText}>
                        Send a message to start your conversation with {selectedUser.fullName}.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Message Input */}
                <div className={styles.inputContainer}>
                  {isUserBlocked(selectedUser._id) ? (
                    <div className={styles.blockedMessageContainer}>
                      <p className={styles.blockedMessage}>
                        You have blocked this user. To send messages, please unblock them.
                      </p>
                    </div>
                  ) : (
                    <ChatInput
                      messageInput={messageInput}
                      setMessageInput={setMessageInput}
                      handleSendMessage={handleSendWithFiles}
                      handleInputChange={handleInputChange}
                      isUserBlocked={isUserBlocked(selectedUser._id)}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className={styles.noChatSelected}>
                <div className={styles.noChatContent}>
                  <FaComments className={styles.noChatIcon} />
                  <h2 className={styles.noChatTitle}>Select a conversation</h2>
                  <p className={styles.noChatText}>
                    Choose a conversation from the list or start a new one
                  </p>
                  <button 
                    className={styles.noChatButton}
                    onClick={() => navigate('/friends')}
                  >
                    Start a New Conversation
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* User Info Panel */}
          {selectedUser && userInfoVisible && (
            <UserInfoPanel 
              user={selectedUser}
              isOnline={isUserOnline(selectedUser._id)}
              isBlocked={isUserBlocked(selectedUser._id)}
              isMuted={isUserMuted(selectedUser._id)}
              mutualFriends={3} // Mock data
              onToggleBlock={handleToggleBlock}
              onToggleMute={handleToggleMute}
              onClose={toggleUserInfo}
              onViewProfile={handleViewProfile}
              onSendMessage={handleSendMessageFromPanel}
              getInitials={getInitials}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Chat;