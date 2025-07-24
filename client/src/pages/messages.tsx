import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/useWebSocket";
import MessageBubble from "@/components/message-bubble";
import { formatDisplayName, getProfileInitials } from "@/lib/nameUtils";
import { QuickAvatar } from "@/components/ProfileAvatar";
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
  chore?: any;
  expense?: any;
  event?: any;
  timestamp?: number;
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
  const previousMessageIds = useRef<Set<string>>(new Set());
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
    // No polling needed - push notifications handle real-time updates
    refetchInterval: false,
    refetchIntervalInBackground: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Use server messages directly for reliable message display
  const messages = useMemo(() => {
    const sortedMessages = Array.isArray(serverMessages) ? serverMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
    
    // No need for client-side notifications - handled by server push notifications
    
    return sortedMessages;
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
        
        // Push notifications are handled server-side for messages
        
        queryClient.invalidateQueries({ 
          queryKey: ["/api/messages"], 
          refetchType: 'active' 
        });
        
        // Always scroll to latest message when new message arrives
        scrollToLatestMessage();
      } else if (data.type === "pong") {
        console.log('WebSocket pong received - connection healthy');
      } else if (data.type === "new_chore" && data.chore) {
        console.log('Real-time chore received:', data.chore.id || 'unknown');
        
        queryClient.invalidateQueries({ queryKey: ["/api/chores"] });
        
        // Push notifications are handled server-side for chore assignments
      } else if (data.type === "new_expense" && data.expense) {
        console.log('Real-time expense received:', data.expense.id || 'unknown');
        
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
        
        // Push notifications are handled server-side for expenses
      } else if (data.type === "new_calendar_event" && data.event) {
        console.log('Real-time calendar event received:', data.event.id || 'unknown');
        
        queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
        
        // Push notifications are handled server-side for calendar events
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
          
          // Scroll to show typing indicator
          scrollToLatestMessage();
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

  // Simple, reliable scroll system - always shows latest message
  const scrollToLatestMessage = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Simple, reliable scroll to bottom - works for any number of messages
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, []);

  // Smooth scroll to bottom for user actions
  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth"
    });
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
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

  // Always scroll to latest message when messages load or update
  useEffect(() => {
    if (!isLoading && messages?.length > 0) {
      // Small delay to ensure DOM is updated, then scroll to latest message
      setTimeout(() => {
        scrollToLatestMessage();
      }, 100);
    }
  }, [messages, isLoading, scrollToLatestMessage]);

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
      
      // Auto-scroll to show new message
      scrollToLatestMessage();
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

      {/* Scrollable Messages Container - Consistent spacing */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto transition-all duration-500 ease-out page-content"
        style={{ 
          paddingBottom: isKeyboardVisible 
            ? '160px'  // Extra space for short conversations when keyboard is visible
            : '200px', // Normal space above tab bar
          transform: `translateY(${isKeyboardVisible ? '-5px' : '0px'})`,
          filter: `brightness(${isKeyboardVisible ? '1.02' : '1'})`,
          minHeight: isKeyboardVisible ? 'calc(100vh - 100px)' : 'auto' // Ensure scrollable area for short conversations
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
      {/* Premium Message Input - Advanced keyboard adaptation */}
      <div 
        className="fixed left-0 right-0 z-40 px-4 transition-all duration-500 ease-out"
        style={{ 
          bottom: isKeyboardVisible ? '20px' : '108px',
          transform: `translateY(${isKeyboardVisible ? '-2px' : '0px'}) scale(${isKeyboardVisible ? '1.015' : '1'})`,
          transformOrigin: 'bottom center'
        }}
      >
        <div 
          className="max-w-3xl mx-auto transition-all duration-500 ease-out"
          style={{
            filter: `brightness(${isKeyboardVisible ? '1.04' : '1'}) saturate(${isKeyboardVisible ? '1.1' : '1'})`
          }}
        >
          <div 
            className="glass-card rounded-3xl shadow-lg border-0 transition-all duration-500 ease-out" 
            style={{ 
              padding: isKeyboardVisible ? '14px 16px' : '12px',
              background: 'var(--surface)',
              backdropFilter: isKeyboardVisible 
                ? 'blur(30px) saturate(2.2) brightness(1.05)' 
                : 'blur(25px) saturate(1.9)',
              border: '1px solid var(--border)',
              boxShadow: isKeyboardVisible 
                ? 'var(--shadow-lg)' 
                : 'var(--shadow-md)'
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
                    // Enhanced focus scroll with keyboard awareness
                    scrollToBottom({ force: true, smooth: false, keyboardAware: true });
                  }}
                  rows={1}
                  className="message-input w-full text-base resize-none border-0 outline-0 transition-all duration-400 ease-out"
                  style={{ 
                    background: 'transparent',
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    padding: isKeyboardVisible ? '10px 14px' : '8px 12px',
                    minHeight: '40px',
                    maxHeight: isKeyboardVisible ? '100px' : '120px',
                    lineHeight: '22px',
                    overflowY: 'auto',
                    fontSize: '16px',
                    transform: `scale(${isKeyboardVisible ? '1.005' : '1'})`,
                    letterSpacing: isKeyboardVisible ? '0.01em' : '0em'
                  }}
                />
              </div>
              <Button
                type="submit"
                disabled={!newMessage.trim()}
                className="rounded-full w-11 h-11 p-0 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex-shrink-0 transition-all duration-400 ease-out"
                style={{
                  transform: `scale(${isKeyboardVisible ? '1.08' : '1'}) translateY(${isKeyboardVisible ? '-1px' : '0px'})`,
                  boxShadow: isKeyboardVisible 
                    ? '0 8px 25px rgba(16, 185, 129, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15) inset, 0 1px 0 rgba(255, 255, 255, 0.2) inset' 
                    : '0 4px 15px rgba(16, 185, 129, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                }}
              >
                <svg 
                  className="w-5 h-5 text-white transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{
                    transform: `scale(${isKeyboardVisible ? '1.05' : '1'})`
                  }}
                >
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