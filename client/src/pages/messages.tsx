import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/useWebSocket";
import MessageBubble from "@/components/message-bubble";
import { formatDisplayName, getProfileInitials } from "@/lib/nameUtils";
import { notificationService } from "@/lib/notifications";
import { MessageCircle, Coffee, Home, ShoppingCart, Calendar, ChevronLeft } from "lucide-react";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { apiRequest } from "@/lib/queryClient";
import ConversationList from "@/components/conversation-list";
import { useLocation, useSearch } from "wouter";

export default function Messages() {
  const [newMessage, setNewMessage] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showConversationList, setShowConversationList] = useState(true);
  const search = useSearch();
  
  // Check for conversationId in query params
  const conversationIdFromUrl = new URLSearchParams(search).get('conversationId');

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth() as { user: any };
  const queryClient = useQueryClient();
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();

  // Fetch household for backward compatibility
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

  // Set default conversation to household if available or from URL
  useEffect(() => {
    if (conversationIdFromUrl) {
      setSelectedConversationId(conversationIdFromUrl);
      setShowConversationList(false); // Hide sidebar on mobile when specific conversation is requested
    } else if (!selectedConversationId && conversations.length > 0) {
      const householdConversation = conversations.find((conv: any) => conv.type === 'household');
      setSelectedConversationId(householdConversation?.id || conversations[0]?.id);
    }
  }, [conversations, selectedConversationId, conversationIdFromUrl]);

  // Fetch messages for selected conversation
  const { data: serverMessages = [], isLoading } = useQuery({
    queryKey: selectedConversationId ? [`/api/messages/${selectedConversationId}`] : null,
    enabled: !!selectedConversationId && !!user,
    refetchInterval: connectionStatus === 'connected' ? 5000 : 2000,
    refetchIntervalInBackground: true,
    staleTime: connectionStatus === 'connected' ? 30000 : 1000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Use server messages directly for reliable message display
  const messages = serverMessages.sort((a: any, b: any) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // WebSocket connection
  const { sendMessage } = useWebSocket({
    enabled: !!user && !!selectedConversationId,
    onStatusChange: (status) => {
      console.log('WebSocket status changed:', status);
      setConnectionStatus(status);
    },
    onMessage: (data) => {
      if (data.type === "new_message" && data.message) {
        // Only update if the message is for the current conversation
        if (data.message.conversationId === selectedConversationId) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/messages/${selectedConversationId}`], 
            refetchType: 'active' 
          });
        }
        
        // Update conversation list to show latest message
        queryClient.invalidateQueries({ 
          queryKey: ["/api/conversations"], 
          refetchType: 'active' 
        });
        
        // Show notification if not in focus
        if (!document.hasFocus() && data.message.userId !== user?.id) {
          const userName = formatDisplayName(
            data.message.user?.firstName,
            data.message.user?.lastName,
            data.message.user?.email
          );
          const conversationName = selectedConversation?.name || 'New Message';
          notificationService.showMessageNotification(userName, data.message.content || '', conversationName);
        }
        
        scrollToBottom();
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
          scrollToBottom();
        }
      } else if (data.type === "user_stopped_typing") {
        if (data.userId !== user?.id && data.userName) {
          setTypingUsers(prev => prev.filter(name => name !== data.userName!));
        }
      }
    },
    userId: user?.id,
    conversationId: selectedConversationId,
  });

  // Scroll to bottom
  const scrollToBottom = (smooth = true) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
    });
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [isLoading, messages.length]);

  // Handle typing
  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!selectedConversationId || !user) return;
    
    const userName = formatDisplayName(user?.firstName, user?.lastName, user?.email);
    
    if (!isTyping) {
      setIsTyping(true);
      sendMessage?.({
        type: "user_typing",
        conversationId: selectedConversationId,
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
          conversationId: selectedConversationId,
          userId: user?.id,
          userName,
        });
      }
    }, 2000);
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversationId) throw new Error("No conversation selected");
      
      const response = await apiRequest("POST", "/api/messages", {
        content,
        conversationId: selectedConversationId,
      });
      return response.json();
    },
    onSuccess: (newMessage: any) => {
      console.log('Message sent via API:', newMessage.id);
      
      // Update cache for immediate UI feedback
      queryClient.setQueryData([`/api/messages/${selectedConversationId}`], (old: any) => {
        const currentMessages = old || [];
        const messageExists = currentMessages.some((msg: any) => msg.id === newMessage.id);
        if (!messageExists) {
          return [...currentMessages, newMessage];
        }
        return currentMessages;
      });
      
      // Force immediate refresh
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedConversationId}`] });
      
      // Update conversation list
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      
      // Send via WebSocket for other clients
      sendMessage?.({
        type: "new_message",
        message: {
          ...newMessage,
          conversationId: selectedConversationId,
        },
      });
      
      // Auto-scroll to new message
      setTimeout(() => scrollToBottom(), 100);
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId || !user || sendMessageMutation.isPending) return;

    const messageContent = newMessage.trim();
    
    // Clear typing state
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping) {
      setIsTyping(false);
      sendMessage?.({
        type: "user_stopped_typing",
        conversationId: selectedConversationId,
        userId: user?.id,
        userName: formatDisplayName(user?.firstName, user?.lastName, user?.email),
      });
    }

    // Clear input immediately
    setNewMessage("");

    // Send message
    sendMessageMutation.mutate(messageContent);
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

  // Get selected conversation details
  const selectedConversation = conversations.find((c: any) => c.id === selectedConversationId);

  return (
    <div className="h-screen flex page-transition">
      {/* Conversation List Sidebar - Mobile Responsive */}
      <div className={`bg-surface border-r border-border transition-all duration-300 ${
        showConversationList ? 'w-full md:w-80' : 'w-0 overflow-hidden'
      } ${!selectedConversationId ? 'w-full' : ''}`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
            <div className="page-header">
              <h1 className="page-title">Messages</h1>
            </div>
          </div>
          
          {/* Conversation List */}
          <div className="pt-24 flex-1">
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversationId}
              onSelect={(id) => {
                setSelectedConversationId(id);
                setShowConversationList(false); // Hide on mobile after selection
              }}
              loading={conversationsLoading}
            />
          </div>
        </div>
      </div>

      {/* Messages Area - Hidden on mobile when showing conversation list */}
      <div className={`flex-1 flex flex-col ${
        showConversationList && selectedConversationId ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Messages Header */}
        <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
          <div className="page-header">
            <div className="flex items-center">
              <button
                onClick={() => setShowConversationList(!showConversationList)}
                className="mr-3 p-2 hover:bg-surface-secondary rounded-xl transition-all duration-200 md:hidden"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h1 className="page-title truncate">
                  {selectedConversation?.name || 
                   (selectedConversation?.type === 'household' ? 'Household Chat' : 'Messages')}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                    'bg-gray-400'
                  }`}></div>
                  <span className="text-xs text-secondary">
                    {connectionStatus === 'connected' ? 'Real-time' : 
                     connectionStatus === 'connecting' ? 'Connecting...' : 
                     'Syncing'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Messages Container */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto pt-32 px-6"
          style={{ 
            paddingBottom: isKeyboardVisible ? '160px' : '200px',
          }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {!selectedConversationId ? (
                <Card className="glass-card">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="font-semibold mb-2">Select a conversation</h3>
                        <p className="text-sm text-secondary">Choose a conversation from the list to start messaging</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="font-semibold mb-2">Start the conversation</h3>
                        <p className="text-sm text-secondary mb-6">Be the first to send a message</p>
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
                <>
                  {messages.map((message: any) => (
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
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {typingUsers.length > 1 ? `${typingUsers.length}` : typingUsers[0]?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="glass-message-bubble received max-w-xs px-4 py-3 rounded-3xl">
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
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Message Input - Show only when conversation is selected */}
        {selectedConversationId && (
          <div 
            className="fixed left-0 right-0 z-40 px-4 transition-all duration-300"
            style={{ 
              bottom: isKeyboardVisible ? '20px' : '108px',
            }}
          >
            <div className="max-w-3xl mx-auto">
              <div className="glass-card rounded-3xl shadow-lg border-0" style={{ padding: '12px' }}>
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
                      rows={1}
                      className="message-input w-full text-base resize-none border-0 outline-0"
                      style={{ 
                        background: 'transparent',
                        padding: '8px 12px',
                        minHeight: '40px',
                        maxHeight: '120px',
                        lineHeight: '22px',
                      }}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="rounded-full w-11 h-11 p-0 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex-shrink-0"
                  >
                    <svg 
                      className="w-5 h-5 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}