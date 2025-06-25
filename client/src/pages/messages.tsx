import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import MessageBubble from "@/components/message-bubble";
import { MessageCircle, Coffee, Home, ShoppingCart, Calendar } from "lucide-react";

export default function Messages() {
  const [newMessage, setNewMessage] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
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
    onMessage: (data) => {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
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

    setTimeout(scrollToBottom, 50);
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
      <div className={`floating-header ${headerScrolled ? "scrolled" : ""}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Messages</h1>
              <p className="page-subtitle">Chat with your household</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content with top padding for fixed header */}
      <div className="">
        {/* Messages Area */}
        <div className="px-6 py-4 space-y-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mb-4 mx-auto">
                  <MessageCircle size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No messages yet
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  Start the conversation with your roommates!
                </p>
              </div>
              
              {/* Quick Message Starters */}
              <div className="w-full max-w-sm space-y-3">
                <p className="text-sm font-medium text-gray-700 text-center mb-3">Quick conversation starters:</p>
                <div className="grid grid-cols-2 gap-3">
                  {quickMessages.map((quick, index) => {
                    const IconComponent = quick.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuickMessage(quick.text)}
                        className="p-3 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md group"
                      >
                        <div className={`w-8 h-8 bg-gradient-to-br ${quick.color} rounded-xl flex items-center justify-center mb-2 mx-auto group-hover:scale-110 transition-transform duration-200`}>
                          <IconComponent size={16} className="text-white" />
                        </div>
                        <p className="text-xs text-gray-700 font-medium text-center leading-tight">
                          {quick.text}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            messages.map((message: any) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={user?.id}
              />
            ))
          )}
          
          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="flex flex-col items-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-600">
                      {typingUsers.length === 1 
                        ? `${typingUsers[0]} is typing`
                        : `${typingUsers.slice(0, -1).join(', ')} and ${typingUsers[typingUsers.length - 1]} are typing`
                      }
                    </span>
                    <div className="flex space-x-1 ml-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-3 z-40">
        <form
          onSubmit={handleSendMessage}
          className="flex items-center space-x-3"
        >
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              className="w-full bg-transparent border-none text-sm text-black placeholder-gray-500 focus:outline-none focus:ring-0"
            />
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center p-0"
          >
            <span className="text-white text-lg">→</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
