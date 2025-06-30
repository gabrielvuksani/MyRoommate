import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import MessageBubble from "@/components/message-bubble";
import { formatDisplayName, getProfileInitials } from "@/lib/nameUtils";
import { notificationService } from "@/lib/notifications";
import { MessageCircle, Coffee, Home, ShoppingCart, Calendar } from "lucide-react";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

interface WebSocketMessage {
  type: string;
  message?: {
    id?: string;
    userId?: string;
    content?: string;
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
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

export default function Messages() {
  const [newMessage, setNewMessage] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
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

  const { data: serverMessages = [], isLoading } = useQuery({
    queryKey: ["/api/messages"],
    enabled: !!household && !!user,
    refetchInterval: connectionStatus === 'connected' ? 5000 : 2000, // Slower polling when connected via WebSocket
    refetchIntervalInBackground: true,
    staleTime: connectionStatus === 'connected' ? 30000 : 1000, // Longer stale time when WebSocket is active
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
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
    },
    onMessage: (data: WebSocketMessage) => {
      if (data.type === 'connection_confirmed') {
        setConnectionStatus('connected');
        console.log('WebSocket connection confirmed:', data);
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        return;
      }
      if (data.type === 'message_error') {
        console.error('Message error:', data.error);
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        return;
      }
      if (data.type === "new_message" && data.message) {
        console.log('Real-time message received:', data.message.id || 'unknown');
        
        queryClient.setQueryData(["/api/messages"], (old: any) => {
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
        
        // Send notification for new messages (only if not from current user)
        if (data.message && data.message.userId !== user?.id) {
          const userName = formatDisplayName(data.message.user?.firstName || null, data.message.user?.lastName || null);
          const householdName = household?.name;
          notificationService.showMessageNotification(userName, data.message.content || '', householdName);
        }
        
        queryClient.invalidateQueries({ 
          queryKey: ["/api/messages"], 
          refetchType: 'active' 
        });
        
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
    householdId: household?.id,
  });

  // Enhanced scroll system for all message scenarios
  const scrollToBottom = (force = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // For mobile keyboard, use instant scroll when keyboard is visible
    const behavior = isKeyboardVisible ? "auto" : "smooth";
    
    setTimeout(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: force ? "auto" : behavior
      });
    }, isKeyboardVisible ? 10 : 100);
  };

  // Smart scroll behavior based on message count and context
  const handleSmartScroll = (messageCount: number, isInitialLoad = false) => {
    if (messageCount === 0) {
      // No messages - stay at top
      return;
    } else if (messageCount <= 3) {
      // Few messages - scroll to bottom instantly for better UX
      scrollToBottom(true);
    } else {
      // Many messages - smooth scroll to bottom
      scrollToBottom(false);
    }
  };

  // Auto-resize textarea with mobile optimization
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, isKeyboardVisible ? 80 : 120);
      textarea.style.height = `${newHeight}px`;
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

  // Smart message scroll handling
  useEffect(() => {
    if (!isLoading && messages) {
      handleSmartScroll(messages.length, true);
    }
  }, [isLoading, messages?.length]);

  // Keyboard visibility handling for mobile
  useEffect(() => {
    if (isKeyboardVisible && messages?.length > 0) {
      // When keyboard opens, scroll to bottom instantly
      setTimeout(() => scrollToBottom(true), 150);
    }
  }, [isKeyboardVisible]);

  // Update connection status when user/household data becomes available
  useEffect(() => {
    if (user && household && connectionStatus === 'disconnected') {
      setConnectionStatus('connecting');
    }
  }, [user, household, connectionStatus]);

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!household || !user) return;
    
    const userName = formatDisplayName(user?.firstName, user?.lastName, user?.email);
    
    if (!isTyping) {
      setIsTyping(true);
      sendMessage?.({
        type: "user_typing",
        householdId: household?.id,
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
          householdId: household?.id,
          userId: user?.id,
          userName,
        });
      }
    }, 2000);
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          householdId: household?.id,
          userId: user?.id,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (newMessage: any) => {
      console.log('Message sent via API fallback:', newMessage.id);
      
      // If WebSocket is not connected, update cache directly for immediate UI feedback
      if (connectionStatus !== 'connected') {
        queryClient.setQueryData(["/api/messages"], (old: any) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      
      // Send via WebSocket for other clients
      sendMessage?.({
        type: "new_message",
        message: newMessage,
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
    if (!newMessage.trim() || !household || !user || sendMessageMutation.isPending) return;

    const messageContent = newMessage.trim();
    
    // Clear typing timeout and state
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping) {
      setIsTyping(false);
      sendMessage?.({
        type: "user_stopped_typing",
        householdId: household?.id,
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
          householdId: household.id,
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
    <div className="h-screen flex flex-col page-transition">
      {/* Fixed Header */}
      <div 
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backgroundColor: 'var(--header-bg)',
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div className="page-header bg-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="page-title" style={{ color: 'var(--text-primary)' }}>Messages</h1>
                <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Chat with your household</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  connectionStatus === 'connected' ? 'bg-green-500 shadow-green-500/50 shadow-lg' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse shadow-yellow-500/50 shadow-lg' : 
                  'bg-red-500 shadow-red-500/50 shadow-lg'
                }`}></div>
                <span className="text-xs font-medium transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
                  {connectionStatus === 'connected' ? 'Real-time' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 
                   'Syncing messages'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto transition-all duration-300 ease-out"
        style={{ 
          paddingTop: '140px', 
          paddingBottom: isKeyboardVisible 
            ? `${Math.max(keyboardHeight + 140, 180)}px`  // More space when keyboard is visible
            : '200px'
        }}
      >
        <div className="max-w-3xl mx-auto px-6">
          <div className="space-y-4 min-h-full">
            {isLoading ? (
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
                      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Be the first to send a message to your household</p>
                    </div>
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
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Message Input - Premium mobile keyboard positioning */}
      <div 
        className="fixed left-0 right-0 z-40 px-4 transition-all duration-300 ease-out"
        style={{ 
          bottom: isKeyboardVisible 
            ? `${Math.max(keyboardHeight + 20, 30)}px`  // More breathing room above keyboard
            : '108px'
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div 
            className="glass-card rounded-3xl shadow-lg border-0 transition-all duration-300" 
            style={{ 
              padding: isKeyboardVisible ? '10px 12px' : '12px',
              transform: isKeyboardVisible ? 'scale(0.98)' : 'scale(1)',
              backdropFilter: isKeyboardVisible ? 'blur(25px) saturate(2.0)' : 'blur(20px) saturate(1.8)'
            }}
          >
            <form onSubmit={handleSendMessage} className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (newMessage.trim()) {
                        handleSendMessage(e as any);
                      }
                    }
                  }}
                  onFocus={() => {
                    // Scroll to bottom when input is focused with extra delay for keyboard
                    setTimeout(() => scrollToBottom(true), isKeyboardVisible ? 100 : 300);
                  }}
                  rows={1}
                  className="message-input w-full text-base resize-none border-0 outline-0 transition-all duration-200"
                  style={{ 
                    background: 'transparent',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    padding: isKeyboardVisible ? '0 10px' : '0 12px',
                    minHeight: isKeyboardVisible ? '32px' : '36px',
                    maxHeight: isKeyboardVisible ? '80px' : '120px',
                    lineHeight: isKeyboardVisible ? '32px' : '36px',
                    overflowY: 'auto',
                    fontSize: isKeyboardVisible ? '16px' : '15px' // Prevent zoom on iOS
                  }}
                />
              </div>
              <Button
                type="submit"
                disabled={!newMessage.trim()}
                className="rounded-full p-0 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex-shrink-0 transition-all duration-200"
                style={{
                  width: isKeyboardVisible ? '40px' : '44px',
                  height: isKeyboardVisible ? '40px' : '44px'
                }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}