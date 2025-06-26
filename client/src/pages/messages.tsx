import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useMemo } from "react";
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
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
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

  // Combine server messages with optimistic messages, removing duplicates
  const messages = useMemo(() => {
    const serverIds = new Set(Array.isArray(serverMessages) ? serverMessages.map((m: any) => m.id) : []);
    const pendingOptimistic = optimisticMessages.filter(m => !serverIds.has(m.id));
    const combined = [...(Array.isArray(serverMessages) ? serverMessages : []), ...pendingOptimistic];
    return combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [serverMessages, optimisticMessages]);

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
          
          if (data.tempId) {
            const tempIndex = currentMessages.findIndex((msg: any) => msg.id === data.tempId);
            if (tempIndex !== -1) {
              console.log('Replacing optimistic message with real one');
              const newMessages = [...currentMessages];
              newMessages[tempIndex] = data.message;
              return newMessages;
            }
          }
          
          const messageExists = currentMessages.some((msg: any) => msg.id === data.message.id);
          if (messageExists) {
            console.log('Message already exists in cache, skipping duplicate');
            return currentMessages;
          }
          
          const filteredMessages = currentMessages.filter((msg: any) => 
            !(msg.id?.startsWith('temp-') && 
              msg.content === data.message.content && 
              msg.userId === data.message.userId)
          );
          
          const updatedMessages = [...filteredMessages, data.message];
          console.log('Cache updated with new message:', updatedMessages.length, 'total messages');
          return updatedMessages;
        });
        
        queryClient.invalidateQueries({ 
          queryKey: ["/api/messages"], 
          refetchType: 'active' 
        });
        
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (shouldAutoScroll) {
              scrollToBottom();
            }
          }, 25);
        });
      } else if (data.type === "pong") {
        console.log('WebSocket pong received - connection healthy');
      } else if (data.type === "user_typing") {
        if (data.userId !== user?.id) {
          setTypingUsers(prev => {
            if (!prev.includes(data.userName)) {
              return [...prev, data.userName];
            }
            return prev;
          });
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(name => name !== data.userName));
          }, 3000);
          
          requestAnimationFrame(() => {
            setTimeout(scrollToBottom, 50);
          });
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

  // Auto-scroll detection
  useEffect(() => {
    const container = document.querySelector('.messages-container');
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle header scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages && messages.length > 0) {
      // For conversations with few messages (≤5), scroll to top
      if (messages.length <= 5) {
        window.scrollTo(0, 0);
      } else {
        // For longer conversations, maintain auto-scroll behavior
        if (shouldAutoScroll) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      }
    }
  }, [messages, shouldAutoScroll]);

  // Auto-scroll on page load
  useEffect(() => {
    if (!isLoading && messages) {
      // Determine scroll behavior based on message count
      if (messages.length <= 5) {
        // For new/short conversations, scroll to top
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 100);
      } else {
        // For longer conversations, scroll to bottom
        setTimeout(() => {
          if (shouldAutoScroll) {
            scrollToBottom();
          }
        }, 200);
      }
    }
  }, [isLoading, messages, shouldAutoScroll]);

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    if (!household || !user) return;
    
    const userName = formatDisplayName(user.firstName, user.lastName, user.email);
    
    if (!isTyping) {
      setIsTyping(true);
      sendMessage?.({
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
        sendMessage?.({
          type: "user_stopped_typing",
          householdId: household.id,
          userId: user.id,
          userName,
        });
      }
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !household || !user) return;

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
        userId: user.id,
        userName: formatDisplayName(user.firstName, user.lastName, user.email),
      });
    }

    // Create optimistic message with temp ID
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      userId: user.id,
      householdId: household.id,
      createdAt: new Date(),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };

    // Add optimistic message to local state for immediate display
    setOptimisticMessages(prev => [...prev, optimisticMessage]);
    console.log('Adding optimistic message:', tempId);

    // Clear input immediately for better UX
    setNewMessage("");

    try {
      // Send via HTTP first for reliability
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          householdId: household.id,
          userId: user.id,
        }),
      });

      if (response.ok) {
        const realMessage = await response.json();
        console.log('Message sent successfully, removing optimistic:', tempId);
        
        // Remove optimistic message - server data will be picked up by polling
        setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));

        // Send via WebSocket for other clients
        if (websocket && websocket.readyState === WebSocket.OPEN) {
          websocket.send(JSON.stringify({
            type: "new_message",
            tempId,
            message: realMessage,
          }));
        }
      } else {
        throw new Error('Failed to send message');
      }

    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove failed optimistic message and restore input for retry
      setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
      setNewMessage(content);
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
      <div className="pt-36 pb-40">
        <div className="max-w-3xl mx-auto px-6">
          <div className="messages-container space-y-4">
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
                      <h3 className="font-semibold text-gray-900 mb-2">Start the conversation</h3>
                      <p className="text-gray-600 text-sm mb-6">Be the first to send a message to your household</p>
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
                {typingUsers.length > 0 && messages && messages.length > 5 && (
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
                        {typingUsers[0][0]}
                      </div>
                    </div>
                    <div className="glass-card p-3 rounded-2xl max-w-xs">
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
                className="rounded-full w-10 h-10 p-0 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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