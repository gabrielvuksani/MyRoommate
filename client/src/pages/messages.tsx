import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import MessageBubble from "@/components/message-bubble";
import { formatDisplayName, getProfileInitials } from "@/lib/nameUtils";
import { notificationService } from "@/lib/notificationService";
import { MessageCircle, Coffee, Home, ShoppingCart, Calendar } from "lucide-react";
import { useTheme } from "@/lib/ThemeProvider";

export default function Messages() {
  const [newMessage, setNewMessage] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  const { effectiveTheme } = useTheme();
  
  // Inject styles to override any CSS with maximum specificity
  useEffect(() => {
    const styleId = 'message-input-override-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = `
      .message-textarea-override,
      .message-textarea-override:focus,
      .message-textarea-override:active,
      .message-textarea-override:hover {
        background: transparent !important;
        background-color: transparent !important;
        border: none !important;
        border-width: 0 !important;
        border-style: none !important;
        border-color: transparent !important;
        outline: none !important;
        outline-width: 0 !important;
        outline-style: none !important;
        box-shadow: none !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        appearance: none !important;
      }
    `;
    
    return () => {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, []);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  const { data: serverMessages = [], isLoading } = useQuery({
    queryKey: ["/api/messages"],
    enabled: !!household,
    refetchInterval: 3000, // Poll every 3 seconds for consistent performance
    refetchIntervalInBackground: true,
    staleTime: 500,
  });

  // Use server messages directly for reliable message display
  const messages = useMemo(() => {
    return Array.isArray(serverMessages) ? serverMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
  }, [serverMessages]);

  const { sendMessage } = useWebSocket({
    onConnect: () => {
      setConnectionStatus('connected');
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
    onDisconnect: () => setConnectionStatus('disconnected'),
    onMessage: (data) => {
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
      if (data.type === "new_message") {
        console.log('Real-time message received:', data.message.id);
        
        queryClient.setQueryData(["/api/messages"], (old: any) => {
          const currentMessages = old || [];
          
          const messageExists = currentMessages.some((msg: any) => msg.id === data.message.id);
          if (messageExists) {
            console.log('Message already exists in cache, skipping duplicate');
            return currentMessages;
          }
          
          const updatedMessages = [...currentMessages, data.message];
          console.log('Cache updated with new message:', updatedMessages.length, 'total messages');
          return updatedMessages;
        });
        
        // Send notification for new messages (only if not from current user)
        if ((data as any).userId !== user?.id && !document.hasFocus()) {
          const userName = formatDisplayName((data as any).user?.firstName, (data as any).user?.lastName);
          notificationService.sendMessageNotification(userName, (data as any).content);
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
        if ((data as any).userId !== user?.id) {
          setTypingUsers(prev => {
            if (!prev.includes((data as any).userName)) {
              return [...prev, (data as any).userName];
            }
            return prev;
          });
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(name => name !== (data as any).userName));
          }, 3000);
          
          requestAnimationFrame(() => {
            setTimeout(() => scrollToBottom(), 50);
          });
        }
      } else if (data.type === "user_stopped_typing") {
        if ((data as any).userId !== user?.id) {
          setTypingUsers(prev => prev.filter(name => name !== (data as any).userName));
        }
      }
    },
    userId: user?.id,
    householdId: household?.id,
  });

  // Simplified scroll system
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesContainerRef.current?.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }, 100);
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  // Handle header scroll effect only
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Always scroll to bottom when messages change or on load
  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Initial scroll to bottom on page load
  useEffect(() => {
    if (!isLoading) {
      scrollToBottom();
    }
  }, [isLoading]);

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!household || !user) return;
    
    const userName = formatDisplayName((user as any)?.firstName, (user as any)?.lastName, (user as any)?.email);
    
    if (!isTyping) {
      setIsTyping(true);
      sendMessage?.({
        type: "user_typing",
        householdId: household.id,
        userId: (user as any)?.id,
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
          householdId: household.id,
          userId: (user as any)?.id,
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
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: (newMessage) => {
      console.log('Message sent successfully:', newMessage.id);
      
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
        householdId: household.id,
        userId: (user as any)?.id,
        userName: formatDisplayName((user as any)?.firstName, (user as any)?.lastName, (user as any)?.email),
      });
    }

    // Clear input immediately for better UX
    setNewMessage("");

    // Send the message
    sendMessageMutation.mutate(messageContent);
  };

  const conversationStarters = [
    { icon: Coffee, text: "Who wants to grab coffee?", color: "from-amber-400 to-orange-600" },
    { icon: Home, text: "House meeting tonight?", color: "from-blue-400 to-blue-600" },
    { icon: ShoppingCart, text: "Need anything from the store?", color: "from-emerald-400 to-green-600" },
    { icon: Calendar, text: "Plans for the weekend?", color: "from-purple-400 to-purple-600" }
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
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                  'bg-red-500'
                }`}></div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {connectionStatus === 'connected' ? 'You are Online' : 
                   connectionStatus === 'connecting' ? 'Connecting...' : 
                   'You are Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: '140px', paddingBottom: '200px' }}
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
                    <MessageCircle 
                      className="w-12 h-12 mx-auto" 
                      style={{ color: effectiveTheme === 'dark' ? '#9CA3AF' : '#6B7280' }} 
                    />
                    <div>
                      <h3 className="font-semibold mb-2" style={{ color: effectiveTheme === 'dark' ? '#FFFFFF' : '#1A1A1A' }}>
                        Start the conversation
                      </h3>
                      <p className="text-sm mb-6" style={{ color: effectiveTheme === 'dark' ? '#A1A1AA' : '#6B7280' }}>
                        Be the first to send a message to your household
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {conversationStarters.map((starter, index) => (
                        <button
                          key={index}
                          className="px-4 py-4 text-left flex items-center gap-3 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer group min-h-[72px]"
                          onClick={() => handleStarterClick(starter.text)}
                          style={{
                            animation: `modal-enter 0.3s ease-out ${index * 0.05}s backwards`,
                            background: effectiveTheme === 'dark' 
                              ? 'rgba(30, 30, 30, 0.7)'
                              : 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(40px) saturate(1.8) brightness(1.05)',
                            WebkitBackdropFilter: 'blur(40px) saturate(1.8) brightness(1.05)',
                            border: effectiveTheme === 'dark' 
                              ? '1px solid rgba(255, 255, 255, 0.1)'
                              : '1px solid rgba(255, 255, 255, 0.3)',
                            boxShadow: effectiveTheme === 'dark'
                              ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.05) inset'
                              : '0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.4) inset, 0 -1px 0 rgba(0, 0, 0, 0.02) inset'
                          }}
                        >
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${starter.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-shadow duration-200 ml-1`}>
                            <starter.icon className="w-5 h-5 text-white" />
                          </div>
                          <span 
                            className="text-sm leading-relaxed flex-1 pr-2"
                            style={{ color: effectiveTheme === 'dark' ? '#FFFFFF' : '#1A1A1A' }}
                          >
                            {starter.text}
                          </span>
                        </button>
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
      {/* Message Input - Fixed at bottom with visionOS styling */}
      <div className="fixed bottom-[108px] left-0 right-0 z-40 px-6">
        <div className="max-w-3xl mx-auto">
          <div 
            className="rounded-3xl shadow-lg p-3"
            style={{
              background: effectiveTheme === 'dark' 
                ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.9) 0%, rgba(25, 25, 25, 0.85) 100%)'
                : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.8) 100%)',
              backdropFilter: 'blur(40px) saturate(1.8) brightness(1.1)',
              WebkitBackdropFilter: 'blur(40px) saturate(1.8) brightness(1.1)',
              border: effectiveTheme === 'dark' 
                ? '1px solid rgba(255, 255, 255, 0.15)'
                : '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: effectiveTheme === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.05) inset'
                : '0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.4) inset, 0 -1px 0 rgba(0, 0, 0, 0.02) inset'
            }}
          >
            <form onSubmit={handleSendMessage} className="flex items-end gap-3">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => {
                    handleTyping(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (newMessage.trim()) {
                        handleSendMessage(e as any);
                      }
                    }
                  }}
                  rows={1}
                  className="w-full text-base resize-none message-textarea-override"
                  style={{
                    color: effectiveTheme === 'dark' ? '#ffffff' : '#1a1a1a',
                    padding: '2px 16px',
                    minHeight: '28px',
                    maxHeight: '120px',
                    lineHeight: '28px',
                    overflowY: 'auto'
                  }}
                />
              </div>
              <Button
                type="submit"
                disabled={!newMessage.trim()}
                className="rounded-full w-11 h-11 p-0 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex-shrink-0"
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