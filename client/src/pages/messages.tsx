import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/useWebSocket";
import MessageBubble from "@/components/message-bubble";
import { formatDisplayName, getProfileInitials } from "@/lib/nameUtils";
import { notificationService } from "@/lib/notifications";
import { MessageCircle, Coffee, Home, ShoppingCart, Calendar, Users, Search } from "lucide-react";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { apiRequest } from "@/lib/queryClient";

interface WebSocketMessage {
  type: string;
  message?: {
    id?: string;
    userId?: string;
    conversationId?: string;
    content?: string;
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
  conversationId?: string;
  userId?: string;
  userName?: string;
  user?: {
    firstName?: string;
    lastName?: string;
  };
  content?: string;
  householdId?: string;
  error?: string;
}

interface Conversation {
  id: string;
  type: 'household' | 'listing' | 'direct';
  householdId?: string;
  listingId?: string;
  lastMessageAt?: string;
  participants: Array<{
    id: string;
    userId: string;
    unreadCount: number;
    user: {
      id: string;
      firstName: string;
      lastName?: string;
      email: string;
    };
  }>;
  listing?: {
    id: string;
    title: string;
    location: string;
  };
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    user: {
      firstName: string;
      lastName?: string;
    };
  };
}

export default function Messages() {
  const [newMessage, setNewMessage] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Connection status - starts optimistic when user and household are available
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth() as { user: any };
  const queryClient = useQueryClient();
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
    retry: 3,
    retryDelay: 1000,
  }) as { data: any };

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
    refetchInterval: 10000,
  });

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    
    return conversations.filter((conv: Conversation) => {
      const searchLower = searchQuery.toLowerCase();
      
      // Search by participant names
      const participantMatch = conv.participants.some(p => 
        p.user.firstName.toLowerCase().includes(searchLower) ||
        (p.user.lastName?.toLowerCase().includes(searchLower) || false)
      );
      
      // Search by listing title
      const listingMatch = conv.listing?.title.toLowerCase().includes(searchLower);
      
      // Search by last message
      const messageMatch = conv.lastMessage?.content.toLowerCase().includes(searchLower);
      
      return participantMatch || listingMatch || messageMatch;
    });
  }, [conversations, searchQuery]);

  // Set default conversation to household if available
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0 && household) {
      const householdConv = conversations.find((c: Conversation) => 
        c.type === 'household' && c.householdId === household.id
      );
      if (householdConv) {
        setSelectedConversation(householdConv.id);
      } else if (conversations.length > 0) {
        setSelectedConversation(conversations[0].id);
      }
    }
  }, [conversations, household, selectedConversation]);

  // Get selected conversation details
  const currentConversation = conversations.find((c: Conversation) => c.id === selectedConversation);

  // Fetch messages for selected conversation
  const { data: serverMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/conversations/${selectedConversation}/messages`],
    enabled: !!selectedConversation && !!user,
    refetchInterval: connectionStatus === 'connected' ? 5000 : 2000,
    refetchIntervalInBackground: true,
    staleTime: connectionStatus === 'connected' ? 30000 : 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Use server messages directly for reliable message display
  const messages = useMemo(() => {
    return Array.isArray(serverMessages) ? serverMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
  }, [serverMessages]);

  const { sendMessage } = useWebSocket({
    onConnect: () => {
      console.log('WebSocket connected successfully');
      setConnectionStatus('connected');
      if (selectedConversation) {
        queryClient.invalidateQueries({ queryKey: [`/api/conversations/${selectedConversation}/messages`] });
      }
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
    },
    onMessage: (data: WebSocketMessage) => {
      if (data.type === 'connection_confirmed') {
        setConnectionStatus('connected');
        console.log('WebSocket connection confirmed:', data);
        if (selectedConversation) {
          queryClient.invalidateQueries({ queryKey: [`/api/conversations/${selectedConversation}/messages`] });
        }
        return;
      }
      if (data.type === 'message_error') {
        console.error('Message error:', data.error);
        if (selectedConversation) {
          queryClient.invalidateQueries({ queryKey: [`/api/conversations/${selectedConversation}/messages`] });
        }
        return;
      }
      if (data.type === "new_message" && data.message) {
        console.log('Real-time message received:', data.message.id || 'unknown');
        
        // Update conversation messages if it matches current conversation
        if (data.conversationId === selectedConversation) {
          queryClient.setQueryData([`/api/conversations/${selectedConversation}/messages`], (old: any) => {
            const currentMessages = old || [];
            
            const messageExists = data.message?.id ? currentMessages.some((msg: any) => msg.id === data.message!.id) : false;
            if (messageExists) {
              console.log('Message already exists in cache, skipping duplicate');
              return currentMessages;
            }
            
            const updatedMessages = [...currentMessages, data.message];
            console.log('Cache updated with new message:', updatedMessages.length, 'total messages');
            return updatedMessages;
          });
        }
        
        // Update conversations list (last message)
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        
        // Send notification for new messages (only if not from current user)
        if (data.message && data.message.userId !== user?.id) {
          const userName = formatDisplayName(data.message.user?.firstName || null, data.message.user?.lastName || null);
          const convTitle = currentConversation?.listing?.title || 'Message';
          notificationService.showMessageNotification(userName, data.message.content || '', convTitle);
        }
        
        if (data.conversationId === selectedConversation) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/conversations/${selectedConversation}/messages`], 
            refetchType: 'active' 
          });
        }
        
        requestAnimationFrame(() => {
          setTimeout(() => {
            scrollToBottom();
          }, 25);
        });
      } else if (data.type === "pong") {
        console.log('WebSocket pong received - connection healthy');
      } else if (data.type === "user_typing") {
        if (data.userId !== user?.id && data.userName) {
          setTypingUsers(prev => {
            if (!prev.includes(data.userName!)) {
              return [...prev, data.userName!];
            }
            return prev;
          });
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(name => name !== data.userName!));
          }, 3000);
          
          requestAnimationFrame(() => {
            setTimeout(() => scrollToBottom(), 50);
          });
        }
      } else if (data.type === "user_stopped_typing") {
        if (data.userId !== user?.id && data.userName) {
          setTypingUsers(prev => prev.filter(name => name !== data.userName!));
        }
      }
    },
    userId: user?.id,
    householdId: currentConversation?.type === 'household' ? household?.id : undefined,
    conversationId: currentConversation?.type !== 'household' ? selectedConversation : undefined,
  });

  // Premium scroll system - ensures latest message is always fully visible
  const scrollToBottom = (options: { force?: boolean; smooth?: boolean; keyboardAware?: boolean } = {}) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { force = false, smooth = true, keyboardAware = false } = options;
    
    // Enhanced scroll calculation for keyboard states
    const scrollToPosition = () => {
      // Allow DOM to update container padding for keyboard state
      requestAnimationFrame(() => {
        const scrollHeight = container.scrollHeight;
        const containerHeight = container.clientHeight;
        const currentScrollTop = container.scrollTop;
        
        // Special handling for short conversations when keyboard is visible
        if (keyboardAware && isKeyboardVisible) {
          // For keyboard states, ensure we scroll to show the absolute bottom
          // Even if there's not much content, this ensures input stays visible
          const maxPossibleScroll = scrollHeight - containerHeight;
          const targetScroll = Math.max(maxPossibleScroll, 0);
          
          console.log('Keyboard scroll (short conversation):', {
            scrollHeight,
            containerHeight,
            maxPossibleScroll,
            targetScroll,
            currentScrollTop,
            messageCount: messages?.length || 0
          });
          
          container.scrollTo({
            top: targetScroll,
            behavior: "auto" // Always instant for keyboard
          });
        } else {
          // Normal scroll behavior for non-keyboard scenarios
          const keyboardBuffer = 0;
          const optimalScrollTop = Math.max(0, scrollHeight - containerHeight + keyboardBuffer);
          
          container.scrollTo({
            top: optimalScrollTop,
            behavior: force ? "auto" : (smooth ? "smooth" : "auto")
          });
        }
      });
    };

    // Premium timing for different scenarios
    const getDelay = () => {
      if (keyboardAware && isKeyboardVisible) return 200; // Allow keyboard animation to complete
      if (force) return 0;
      return 50;
    };

    setTimeout(scrollToPosition, getDelay());
  };

  // Unified smart scroll for all message scenarios - always show latest message fully
  const handleLatestMessageScroll = (messageCount: number) => {
    if (messageCount === 0) {
      // No messages - scroll to top smoothly for clean state
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    
    // For any number of messages, ensure latest is fully visible with premium timing
    const forceInstant = messageCount === 1; // Instant for single message
    scrollToBottom({ 
      force: forceInstant, 
      smooth: !forceInstant,
      keyboardAware: isKeyboardVisible
    });
  };

  // Premium auto-resize textarea with enhanced mobile optimization
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const baseHeight = 36;
      const maxHeight = isKeyboardVisible ? 100 : 120;
      const scrollHeight = textarea.scrollHeight;
      
      // Smooth height calculation with easing
      const newHeight = Math.min(Math.max(scrollHeight, baseHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      // Enhanced transition timing for premium feel
      textarea.style.transition = 'height 0.25s ease-out, transform 0.4s ease-out';
    }
  }, [newMessage, isKeyboardVisible]);

  // Handle header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Master scroll handler - intelligently handles all scroll scenarios
  const masterScrollHandler = useCallback(() => {
    if (!messages || messages.length === 0) return;
    
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // Always scroll to show the latest message fully, regardless of scenario
    requestAnimationFrame(() => {
      // Calculate scroll to show the bottom completely
      const scrollHeight = container.scrollHeight;
      const containerHeight = container.clientHeight;
      const targetScrollTop = Math.max(0, scrollHeight - containerHeight);
      
      // Choose scroll behavior based on context
      const shouldBeInstant = isKeyboardVisible || 
                             (messages.length === 1) || 
                             Math.abs(container.scrollTop - targetScrollTop) > containerHeight;
      
      container.scrollTo({
        top: targetScrollTop,
        behavior: shouldBeInstant ? "auto" : "smooth"
      });
      
      console.log('Master scroll:', {
        messageCount: messages.length,
        isKeyboardVisible,
        targetScrollTop,
        behavior: shouldBeInstant ? "instant" : "smooth"
      });
    });
  }, [messages, isKeyboardVisible]);

  // Single effect to handle all scroll scenarios
  useEffect(() => {
    if (!isLoading && messages) {
      // Initial delay for DOM updates, then ensure latest message is visible
      const delay = isKeyboardVisible ? 250 : 100;
      setTimeout(masterScrollHandler, delay);
    }
  }, [isLoading, messages?.length, isKeyboardVisible, masterScrollHandler]);

  // Update connection status when user/household data becomes available
  useEffect(() => {
    if (user && household && connectionStatus === 'disconnected') {
      setConnectionStatus('connecting');
    }
  }, [user, household, connectionStatus]);

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!currentConversation || !user) return;
    
    const userName = formatDisplayName(user?.firstName, user?.lastName, user?.email);
    
    if (!isTyping) {
      setIsTyping(true);
      sendMessage?.({
        type: "user_typing",
        householdId: currentConversation.type === 'household' ? household?.id : undefined,
        conversationId: currentConversation.type !== 'household' ? selectedConversation : undefined,
        userId: user?.id,
        userName,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendMessage?.({
          type: "user_stopped_typing",
          householdId: currentConversation.type === 'household' ? household?.id : undefined,
          conversationId: currentConversation.type !== 'household' ? selectedConversation : undefined,
          userId: user?.id,
          userName,
        });
      }
    }, 2000);
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const endpoint = selectedConversation 
        ? `/api/conversations/${selectedConversation}/messages`
        : "/api/messages";
        
      const response = await apiRequest("POST", endpoint, {
        content,
        householdId: currentConversation?.type === 'household' ? household?.id : undefined,
        userId: user?.id,
      });
      return response;
    },
    onSuccess: (newMessage: any) => {
      console.log('Message sent via API fallback:', newMessage.id);
      
      // If WebSocket is not connected, update cache directly for immediate UI feedback
      if (connectionStatus !== 'connected' && selectedConversation) {
        queryClient.setQueryData([`/api/conversations/${selectedConversation}/messages`], (old: any) => {
          const currentMessages = old || [];
          // Check if message already exists to prevent duplicates
          const messageExists = currentMessages.some((msg: any) => msg.id === newMessage.id);
          if (!messageExists) {
            return [...currentMessages, newMessage];
          }
          return currentMessages;
        });
      }
      
      // Force immediate refresh to show the new message
      if (selectedConversation) {
        queryClient.invalidateQueries({ queryKey: [`/api/conversations/${selectedConversation}/messages`] });
      }
      
      // Send via WebSocket for other clients
      sendMessage?.({
        type: "new_message",
        message: newMessage,
        conversationId: selectedConversation,
      });
      
      // Auto-scroll to new message
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation || !user || sendMessageMutation.isPending) return;

    const messageContent = newMessage.trim();
    
    // Clear typing timeout and state
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping) {
      setIsTyping(false);
      sendMessage?.({
        type: "user_stopped_typing",
        householdId: currentConversation.type === 'household' ? household?.id : undefined,
        conversationId: currentConversation.type !== 'household' ? selectedConversation : undefined,
        userId: user?.id,
        userName: formatDisplayName(user?.firstName, user?.lastName, user?.email),
      });
    }

    // Clear input immediately for better UX
    setNewMessage("");

    // Try WebSocket first if connected, fallback to API
    if (connectionStatus === 'connected' && sendMessage) {
      try {
        sendMessage({
          type: "send_message",
          content: messageContent,
          householdId: currentConversation.type === 'household' ? household?.id : undefined,
          conversationId: currentConversation.type !== 'household' ? selectedConversation : undefined,
          userId: user.id,
        });
        console.log('Message sent via WebSocket');
      } catch (error) {
        console.error('WebSocket send failed, falling back to API:', error);
        sendMessageMutation.mutate(messageContent);
      }
    } else {
      // Use API when WebSocket is not available
      console.log('Using API fallback for message send');
      sendMessageMutation.mutate(messageContent);
    }
  };

  const conversationStarters = [
    { icon: Coffee, text: "Who wants to grab coffee?", color: "text-amber-600" },
    { icon: Home, text: "House meeting tonight?", color: "text-blue-600" },
    { icon: ShoppingCart, text: "Need anything from the store?", color: "text-green-600" },
    { icon: Calendar, text: "Plans for the weekend?", color: "text-purple-600" }
  ];

  const handleStarterClick = (text: string) => {
    setNewMessage(text);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-gray">
        <div className="w-8 h-8 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex page-transition">
      {/* Conversations Sidebar */}
      <div className="w-full md:w-96 h-full border-r" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-secondary)' }}>
        {/* Conversations Header */}
        <div 
          className="fixed top-0 left-0 md:w-96 right-0 md:right-auto z-50"
          style={{
            backgroundColor: 'var(--header-bg)',
            backdropFilter: 'blur(20px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          }}
        >
          <div className="page-header bg-transparent">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="page-title" style={{ color: 'var(--text-primary)' }}>Messages</h1>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    connectionStatus === 'connected' ? 'bg-green-500 shadow-green-500/50 shadow-lg' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse shadow-yellow-500/50 shadow-lg' : 
                    'bg-red-500 shadow-red-500/50 shadow-lg'
                  }`}></div>
                  <span className="text-xs font-medium transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
                    {connectionStatus === 'connected' ? 'Real-time' : 
                     connectionStatus === 'connecting' ? 'Connecting...' : 
                     'Syncing'}
                  </span>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl input-modern"
                  style={{ backgroundColor: 'var(--surface-secondary)' }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Conversations List */}
        <div className="pt-44 px-4 pb-20 h-full overflow-y-auto">
          {conversationsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation: Conversation) => {
                const otherParticipant = conversation.participants.find(p => p.userId !== user?.id);
                const isSelected = selectedConversation === conversation.id;
                const hasUnread = conversation.participants.find(p => p.userId === user?.id)?.unreadCount > 0;
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 border-l-4 border-emerald-500' 
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-white/20 shadow-lg">
                          <span className="text-white text-sm font-semibold">
                            {conversation.type === 'household' 
                              ? <Users className="w-6 h-6" />
                              : getProfileInitials(otherParticipant?.user.firstName || '', otherParticipant?.user.lastName)
                            }
                          </span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                            {conversation.type === 'household' 
                              ? household?.name || 'Household'
                              : conversation.listing 
                                ? conversation.listing.title
                                : formatDisplayName(otherParticipant?.user.firstName || '', otherParticipant?.user.lastName)
                            }
                          </h3>
                          {conversation.lastMessage && (
                            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        
                        {conversation.listing && (
                          <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                            📍 {conversation.listing.location}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                            {conversation.lastMessage 
                              ? conversation.lastMessage.content
                              : 'Start a conversation'
                            }
                          </p>
                          {hasUnread && (
                            <span className="ml-2 px-2 py-1 text-xs bg-emerald-500 text-white rounded-full">
                              {conversation.participants.find(p => p.userId === user?.id)?.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Messages Panel */}
      <div className="hidden md:flex flex-1 flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Select a conversation</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Header */}
            <div 
              className="fixed top-0 left-96 right-0 z-40"
              style={{
                backgroundColor: 'var(--header-bg)',
                backdropFilter: 'blur(20px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
              }}
            >
              <div className="page-header bg-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {currentConversation?.type === 'household' 
                        ? household?.name || 'Household'
                        : currentConversation?.listing 
                          ? currentConversation.listing.title
                          : formatDisplayName(
                              currentConversation?.participants.find(p => p.userId !== user?.id)?.user.firstName || '',
                              currentConversation?.participants.find(p => p.userId !== user?.id)?.user.lastName
                            )
                      }
                    </h2>
                    {currentConversation?.listing && (
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        📍 {currentConversation.listing.location}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Scrollable Messages Container */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto transition-all duration-500 ease-out"
              style={{ 
                paddingTop: '140px', 
                paddingBottom: isKeyboardVisible 
                  ? '160px'
                  : '200px',
                transform: `translateY(${isKeyboardVisible ? '-5px' : '0px'})`,
                filter: `brightness(${isKeyboardVisible ? '1.02' : '1'})`,
                minHeight: isKeyboardVisible ? 'calc(100vh - 100px)' : 'auto'
              }}
            >
              <div className="max-w-3xl mx-auto px-6">
                <div className="space-y-4 min-h-full">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : messages && messages.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto" />
                          <div>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Start the conversation</h3>
                            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                              {currentConversation?.type === 'household' 
                                ? 'Be the first to send a message to your household'
                                : currentConversation?.listing 
                                  ? `Ask about ${currentConversation.listing.title}`
                                  : 'Send your first message'
                              }
                            </p>
                          </div>
                          {currentConversation?.type === 'household' && (
                            <div className="grid grid-cols-2 gap-3">
                              {conversationStarters.map((starter, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  className="h-auto p-3 text-left justify-start glass-card hover:bg-white/50 transition-all duration-200"
                                  onClick={() => handleStarterClick(starter.text)}
                                >
                                  <starter.icon className={`w-4 h-4 mr-2 ${starter.color}`} />
                                  <span className="text-sm">{starter.text}</span>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {messages && messages.map((message: any) => (
                        <MessageBubble 
                          key={message.id} 
                          message={message} 
                          currentUserId={user?.id} 
                        />
                      ))}
                      
                      {/* Typing indicators */}
                      {typingUsers.length > 0 && (
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-lg">
                              <span className="text-white text-xs font-semibold">
                                {typingUsers.length > 1 ? `${typingUsers.length}` : typingUsers[0]?.[0]?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="glass-message-bubble received max-w-xs px-4 py-3 rounded-3xl shadow-lg">
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
            
            {/* Message Input Section */}
            <div className="fixed bottom-0 left-96 right-0 z-40 pb-20">
              <div className={`transition-all duration-500 ease-out ${
                isKeyboardVisible 
                  ? 'transform scale-[1.015] -translate-y-[2px]' 
                  : ''
              }`}>
                <div className="max-w-3xl mx-auto">
                  <div className={`mx-6 relative transition-all duration-500 ${
                    isKeyboardVisible 
                      ? 'backdrop-blur-[30px] backdrop-saturate-[2.2] backdrop-brightness-[1.05] rounded-2xl' 
                      : ''
                  }`}>
                    <form onSubmit={handleSendMessage} className="relative">
                      <div className={`flex items-end space-x-3 p-3 rounded-2xl transition-all duration-500 ${
                        isKeyboardVisible 
                          ? 'bg-gradient-to-br from-white/25 via-white/20 to-white/15 shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] ring-1 ring-white/20' 
                          : 'bg-surface-secondary shadow-lg'
                      }`}>
                        <div className="flex-1 relative">
                          <textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => handleTyping(e.target.value)}
                            placeholder={currentConversation?.listing 
                              ? `Ask about ${currentConversation.listing.title}...`
                              : "Type a message..."
                            }
                            className={`w-full px-4 py-2 bg-transparent rounded-xl resize-none focus:outline-none transition-all duration-500 input-modern ${
                              isKeyboardVisible 
                                ? 'placeholder:text-gray-500 text-gray-900 tracking-wide' 
                                : ''
                            }`}
                            style={{ 
                              minHeight: '36px',
                              maxHeight: isKeyboardVisible ? '100px' : '120px',
                              color: 'var(--text-primary)'
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                              }
                            }}
                          />
                          
                          {isKeyboardVisible && (
                            <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                              <div className="absolute -inset-px bg-gradient-to-br from-white/10 to-transparent opacity-50 blur-sm"></div>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          type="submit"
                          disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          size="icon"
                          className={`rounded-xl transition-all duration-500 relative overflow-hidden ${
                            isKeyboardVisible 
                              ? 'bg-gradient-to-br from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] transform hover:scale-[1.08] active:scale-[1.02]' 
                              : 'bg-gradient-to-br from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
                          } ${
                            !newMessage.trim() || sendMessageMutation.isPending 
                              ? 'opacity-50 cursor-not-allowed' 
                              : ''
                          }`}
                          style={{ marginBottom: '3px' }}
                        >
                          {sendMessageMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 text-white" />
                          )}
                          
                          {isKeyboardVisible && newMessage.trim() && !sendMessageMutation.isPending && (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-shimmer"></div>
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {isKeyboardVisible && (
                        <div className="absolute -inset-1 bg-gradient-to-br from-emerald-400/20 via-cyan-400/10 to-emerald-400/20 rounded-2xl blur-xl opacity-50 -z-10 animate-pulse"></div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Mobile View - Show either conversation list or messages */}
      <div className="md:hidden h-full">
        {!selectedConversation ? (
          /* Mobile Conversations List */
          <div className="h-full" style={{ backgroundColor: 'var(--surface-secondary)' }}>
            {/* Mobile Conversations Header */}
            <div 
              className="fixed top-0 left-0 right-0 z-50"
              style={{
                backgroundColor: 'var(--header-bg)',
                backdropFilter: 'blur(20px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
              }}
            >
              <div className="page-header bg-transparent">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h1 className="page-title" style={{ color: 'var(--text-primary)' }}>Messages</h1>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        connectionStatus === 'connected' ? 'bg-green-500 shadow-green-500/50 shadow-lg' : 
                        connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse shadow-yellow-500/50 shadow-lg' : 
                        'bg-red-500 shadow-red-500/50 shadow-lg'
                      }`}></div>
                      <span className="text-xs font-medium transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
                        {connectionStatus === 'connected' ? 'Real-time' : 
                         connectionStatus === 'connecting' ? 'Connecting...' : 
                         'Syncing'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl input-modern"
                      style={{ backgroundColor: 'var(--surface-secondary)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Conversations List */}
            <div className="pt-44 px-4 pb-20 h-full overflow-y-auto">
              {conversationsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((conversation: Conversation) => {
                    const otherParticipant = conversation.participants.find(p => p.userId !== user?.id);
                    const hasUnread = conversation.participants.find(p => p.userId === user?.id)?.unreadCount > 0;
                    
                    return (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className="w-full text-left p-4 rounded-xl transition-all duration-200 hover:bg-white/5"
                      >
                        <div className="flex items-start space-x-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-white/20 shadow-lg">
                              <span className="text-white text-sm font-semibold">
                                {conversation.type === 'household' 
                                  ? <Users className="w-6 h-6" />
                                  : getProfileInitials(otherParticipant?.user.firstName || '', otherParticipant?.user.lastName)
                                }
                              </span>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                {conversation.type === 'household' 
                                  ? household?.name || 'Household'
                                  : conversation.listing 
                                    ? conversation.listing.title
                                    : formatDisplayName(otherParticipant?.user.firstName || '', otherParticipant?.user.lastName)
                                }
                              </h3>
                              {conversation.lastMessage && (
                                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                  {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            
                            {conversation.listing && (
                              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                                📍 {conversation.listing.location}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                                {conversation.lastMessage 
                                  ? conversation.lastMessage.content
                                  : 'Start a conversation'
                                }
                              </p>
                              {hasUnread && (
                                <span className="ml-2 px-2 py-1 text-xs bg-emerald-500 text-white rounded-full">
                                  {conversation.participants.find(p => p.userId === user?.id)?.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Mobile Messages View */
          <div className="h-full flex flex-col">
            {/* Mobile Messages Header */}
            <div 
              className="fixed top-0 left-0 right-0 z-50"
              style={{
                backgroundColor: 'var(--header-bg)',
                backdropFilter: 'blur(20px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
              }}
            >
              <div className="page-header bg-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedConversation(null)}
                      className="rounded-xl"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {currentConversation?.type === 'household' 
                          ? household?.name || 'Household'
                          : currentConversation?.listing 
                            ? currentConversation.listing.title
                            : formatDisplayName(
                                currentConversation?.participants.find(p => p.userId !== user?.id)?.user.firstName || '',
                                currentConversation?.participants.find(p => p.userId !== user?.id)?.user.lastName
                              )
                        }
                      </h2>
                      {currentConversation?.listing && (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          📍 {currentConversation.listing.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Messages Container */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto transition-all duration-500 ease-out"
              style={{ 
                paddingTop: '140px', 
                paddingBottom: isKeyboardVisible 
                  ? '160px'
                  : '200px',
                transform: `translateY(${isKeyboardVisible ? '-5px' : '0px'})`,
                filter: `brightness(${isKeyboardVisible ? '1.02' : '1'})`,
                minHeight: isKeyboardVisible ? 'calc(100vh - 100px)' : 'auto'
              }}
            >
              <div className="px-4">
                <div className="space-y-4 min-h-full">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : messages && messages.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto" />
                          <div>
                            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Start the conversation</h3>
                            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                              {currentConversation?.type === 'household' 
                                ? 'Be the first to send a message to your household'
                                : currentConversation?.listing 
                                  ? `Ask about ${currentConversation.listing.title}`
                                  : 'Send your first message'
                              }
                            </p>
                          </div>
                          {currentConversation?.type === 'household' && (
                            <div className="grid grid-cols-2 gap-3">
                              {conversationStarters.map((starter, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  className="h-auto p-3 text-left justify-start glass-card hover:bg-white/50 transition-all duration-200"
                                  onClick={() => handleStarterClick(starter.text)}
                                >
                                  <starter.icon className={`w-4 h-4 mr-2 ${starter.color}`} />
                                  <span className="text-sm">{starter.text}</span>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {messages && messages.map((message: any) => (
                        <MessageBubble 
                          key={message.id} 
                          message={message} 
                          currentUserId={user?.id} 
                        />
                      ))}
                      
                      {/* Typing indicators */}
                      {typingUsers.length > 0 && (
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-lg">
                              <span className="text-white text-xs font-semibold">
                                {typingUsers.length > 1 ? `${typingUsers.length}` : typingUsers[0]?.[0]?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="glass-message-bubble received max-w-xs px-4 py-3 rounded-3xl shadow-lg">
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
            
            {/* Mobile Message Input */}
            <div className="fixed bottom-0 left-0 right-0 z-40 pb-20">
              <div className={`transition-all duration-500 ease-out ${
                isKeyboardVisible 
                  ? 'transform scale-[1.015] -translate-y-[2px]' 
                  : ''
              }`}>
                <div className="px-4">
                  <div className={`relative transition-all duration-500 ${
                    isKeyboardVisible 
                      ? 'backdrop-blur-[30px] backdrop-saturate-[2.2] backdrop-brightness-[1.05] rounded-2xl' 
                      : ''
                  }`}>
                    <form onSubmit={handleSendMessage} className="relative">
                      <div className={`flex items-end space-x-3 p-3 rounded-2xl transition-all duration-500 ${
                        isKeyboardVisible 
                          ? 'bg-gradient-to-br from-white/25 via-white/20 to-white/15 shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] ring-1 ring-white/20' 
                          : 'bg-surface-secondary shadow-lg'
                      }`}>
                        <div className="flex-1 relative">
                          <textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={(e) => handleTyping(e.target.value)}
                            placeholder={currentConversation?.listing 
                              ? `Ask about ${currentConversation.listing.title}...`
                              : "Type a message..."
                            }
                            className={`w-full px-4 py-2 bg-transparent rounded-xl resize-none focus:outline-none transition-all duration-500 input-modern ${
                              isKeyboardVisible 
                                ? 'placeholder:text-gray-500 text-gray-900 tracking-wide' 
                                : ''
                            }`}
                            style={{ 
                              minHeight: '36px',
                              maxHeight: isKeyboardVisible ? '100px' : '120px',
                              color: 'var(--text-primary)'
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                              }
                            }}
                          />
                        </div>
                        
                        <Button
                          type="submit"
                          disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          size="icon"
                          className={`rounded-xl transition-all duration-500 relative overflow-hidden ${
                            isKeyboardVisible 
                              ? 'bg-gradient-to-br from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] transform hover:scale-[1.08] active:scale-[1.02]' 
                              : 'bg-gradient-to-br from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
                          } ${
                            !newMessage.trim() || sendMessageMutation.isPending 
                              ? 'opacity-50 cursor-not-allowed' 
                              : ''
                          }`}
                        >
                          {sendMessageMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 text-white" />
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}