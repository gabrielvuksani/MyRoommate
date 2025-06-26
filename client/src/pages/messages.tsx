import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import MessageBubble from "@/components/message-bubble";
import { formatDisplayName, getProfileInitials } from "@/lib/nameUtils";
import { MessageCircle, Coffee, Home, ShoppingCart, Calendar } from "lucide-react";

export default function Messages() {
  const [newMessage, setNewMessage] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/messages"],
    enabled: !!household,
  });

  const { sendMessage } = useWebSocket({
    onConnect: () => setConnectionStatus('connected'),
    onDisconnect: () => setConnectionStatus('disconnected'),
    onMessage: (data) => {
      if (data.type === 'connection_confirmed') {
        setConnectionStatus('connected');
        console.log('WebSocket connection confirmed:', data);
        return;
      }
      if (data.type === 'message_error') {
        console.error('Message error:', data.error);
        // Retry the last message if needed
        return;
      }
      if (data.type === "new_message") {
        // Immediately update the messages in the cache for real-time display
        queryClient.setQueryData(["/api/messages"], (old: any) => {
          const messages = old || [];
          // Replace temp optimistic message with real one, or add if not exists
          const tempIndex = messages.findIndex((msg: any) => msg.id.startsWith('temp-') && msg.content === data.message.content && msg.userId === data.message.userId);
          if (tempIndex !== -1) {
            // Replace temp message with real one
            const newMessages = [...messages];
            newMessages[tempIndex] = data.message;
            return newMessages;
          } else {
            // Check if real message already exists to prevent duplicates
            const exists = messages.some((msg: any) => msg.id === data.message.id);
            if (!exists) {
              return [...messages, data.message];
            }
          }
          return messages;
        });
        
        // Scroll to bottom when new message arrives
        setTimeout(scrollToBottom, 100);
      } else if (data.type === "user_typing") {
        if (data.userId !== user?.id) {
          setTypingUsers(prev => {
            if (!prev.includes(data.userName)) {
              return [...prev, data.userName];
            }
            return prev;
          });
          // Clear typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(name => name !== data.userName));
          }, 3000);
          
          // Auto-scroll when typing indicators appear
          setTimeout(scrollToBottom, 100);
        }
      } else if (data.type === "user_stopped_typing") {
        if (data.userId !== user?.id) {
          setTypingUsers(prev => prev.filter(name => name !== data.userName));
        }
      }
    },
    userId: user?.id,
    householdId: household?.id,
  });

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    // Account for header height (144px) plus some padding
    window.scrollTo({ top: 160, behavior: "smooth" });
  };

  // Check if user is near bottom of messages
  const isNearBottom = () => {
    const threshold = 150;
    return (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - threshold
    );
  };

  // Auto-scroll logic based on message count
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      if (messages.length <= 5) {
        // For 5 or fewer messages, scroll to top with header offset
        scrollToTop();
      } else {
        // For more than 5 messages, scroll to bottom
        scrollToBottom();
      }
    }
  }, [messages, shouldAutoScroll]);

  // Initial scroll behavior when messages load
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        if (messages.length <= 5) {
          // For few messages, position just below header to avoid overlap
          window.scrollTo({ top: 160, behavior: "auto" });
        } else if (messages.length > 5) {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
      }, 100);
    }
  }, [isLoading, messages.length]);

  // Always ensure proper scroll position on page load
  useEffect(() => {
    // Handle initial page load with immediate scroll adjustment
    if (messages.length <= 5) {
      window.scrollTo({ top: 160, behavior: "auto" });
    }
  }, []);

  // Auto-scroll when typing indicators appear (only for longer conversations)
  useEffect(() => {
    if (typingUsers.length > 0 && shouldAutoScroll && messages.length > 5) {
      scrollToBottom();
    }
  }, [typingUsers, shouldAutoScroll, messages.length]);

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
      
      // If user scrolls up significantly, disable auto-scroll
      if (!isNearBottom()) {
        setShouldAutoScroll(false);
      } else {
        // If user scrolls back to bottom, re-enable auto-scroll
        setShouldAutoScroll(true);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle keyboard visibility on mobile
  useEffect(() => {
    const handleResize = () => {
      // Scroll to bottom when keyboard appears
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!household || !user) return;
    
    const userName = user.firstName || user.email?.split('@')[0] || 'Unknown';
    
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      sendMessage({
        type: "user_typing",
        householdId: household.id,
        userId: user.id,
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
        sendMessage({
          type: "user_stopped_typing",
          householdId: household.id,
          userId: user.id,
          userName,
        });
      }
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !household || !user) return;

    const messageContent = newMessage.trim();
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping) {
      setIsTyping(false);
      const userName = user.firstName || user.email?.split('@')[0] || 'Unknown';
      sendMessage({
        type: "user_stopped_typing",
        householdId: household.id,
        userId: user.id,
        userName,
      });
    }

    // Optimistic update - show message immediately
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      householdId: household.id,
      userId: user.id,
      createdAt: new Date(),
      user: user,
      type: null,
      linkedTo: null,
      linkedType: null,
    };

    queryClient.setQueryData(["/api/messages"], (old: any) => [
      ...(old || []),
      optimisticMessage,
    ]);

    // Send via WebSocket
    sendMessage({
      type: "send_message",
      content: messageContent,
      householdId: household.id,
      userId: user.id,
    });

    setNewMessage("");
    setTimeout(scrollToBottom, 50);
  };

  const quickMessages = [
    { icon: Coffee, text: "Anyone want coffee?", color: "from-amber-400 to-orange-500" },
    { icon: ShoppingCart, text: "Going grocery shopping, need anything?", color: "from-green-400 to-emerald-500" },
    { icon: Home, text: "Who's home tonight?", color: "from-blue-400 to-cyan-500" },
    { icon: Calendar, text: "Movie night this weekend?", color: "from-purple-400 to-pink-500" },
  ];

  const handleQuickMessage = (text: string) => {
    if (!household || !user) return;
    
    // Optimistic update for quick messages too
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: text,
      householdId: household.id,
      userId: user.id,
      createdAt: new Date(),
      user: user,
      type: null,
      linkedTo: null,
      linkedType: null,
    };

    queryClient.setQueryData(["/api/messages"], (old: any) => [
      ...(old || []),
      optimisticMessage,
    ]);
    
    sendMessage({
      type: "send_message",
      content: text,
      householdId: household.id,
      userId: user.id,
    });

    // Enable auto-scroll and scroll appropriately when user sends a message
    setShouldAutoScroll(true);
    setTimeout(() => {
      // After sending, we'll have one more message, so account for that
      const newMessageCount = messages.length + 1;
      if (newMessageCount <= 5) {
        scrollToTop();
      } else {
        scrollToBottom();
      }
    }, 50);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-gray">
        <div className="w-8 h-8 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="page-container page-transition">
      {/* visionOS Header */}
      <div 
        className={`floating-header ${headerScrolled ? "scrolled" : ""}`}
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        <div className="page-header bg-[transparent]">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Messages</h1>
              <p className="page-subtitle">Chat with your household</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`}></div>
              <span className="text-xs text-gray-500 font-medium">
                {connectionStatus === 'connected' ? 'You are Online' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 
                 'You are Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Messages Container */}
      <div className="pt-32 pb-32 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="min-h-[60vh] flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-12">
                <div className="text-center animate-fade-in">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg">
                    <MessageCircle size={28} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No messages yet
                  </h3>
                  <p className="text-gray-600 text-center max-w-sm mx-auto">
                    Start the conversation with your roommates and keep everyone connected!
                  </p>
                </div>
                
                {/* Quick Message Starters */}
                <div className="w-full max-w-lg space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <p className="text-sm font-semibold text-gray-800 text-center">Quick conversation starters:</p>
                  <div className="grid grid-cols-2 gap-4">
                    {quickMessages.map((quick, index) => {
                      const IconComponent = quick.icon;
                      return (
                        <Card key={index} className="glass-card">
                          <CardContent className="p-6">
                            <button
                              onClick={() => handleQuickMessage(quick.text)}
                              className="w-full hover:scale-[1.02] transition-all duration-200 group"
                            >
                              <div className={`w-10 h-10 bg-gradient-to-br ${quick.color} rounded-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform duration-200 shadow-md`}>
                                <IconComponent size={18} className="text-white" />
                              </div>
                              <p className="text-xs text-gray-700 font-medium text-center leading-tight">
                                {quick.text}
                              </p>
                            </button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-4">
                {messages.map((message: any) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    currentUserId={user?.id}
                  />
                ))}
                
                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-md max-w-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 font-medium">
                          {typingUsers.length === 1 
                            ? `${typingUsers[0]} is typing`
                            : `${typingUsers.slice(0, -1).join(', ')} and ${typingUsers[typingUsers.length - 1]} are typing`
                          }
                        </span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Scroll buffer to prevent content being hidden behind input */}
                <div className="h-32" />
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Message Input - Fixed at bottom with visionOS styling */}
      <div className="fixed bottom-[88px] left-0 right-0 z-40 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-4 rounded-3xl shadow-lg border border-white/20">
            <form
              onSubmit={handleSendMessage}
              className="flex items-center space-x-2"
            >
              <div className="flex-1 rounded-full px-4 py-3 mr-1">
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  className="w-full bg-transparent border-none text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 p-0"
                />
              </div>
              <Button
                type="submit"
                disabled={!newMessage.trim()}
                className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 rounded-full flex items-center justify-center p-0 shadow-lg transition-all duration-200 disabled:opacity-50 ml-1"
              >
                <span className="text-white text-lg font-medium">→</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
