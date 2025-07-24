import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/lib/websocket";
import { apiRequest } from "@/lib/queryClient";
import MessageBubble from "@/components/message-bubble";
import { formatDisplayName, getProfileInitials } from "@/lib/nameUtils";
import { QuickAvatar } from "@/components/ProfileAvatar";
import { notificationService } from "@/lib/notifications";
import { MessageCircle, Coffee, Home, ShoppingCart, Calendar } from "lucide-react";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

export default function Messages() {
  const [newMessage, setNewMessage] = useState("");
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth() as { user: any };
  const queryClient = useQueryClient();
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
    retry: 3,
    retryDelay: 1000,
  }) as { data: any };

  // Use WebSocket for real-time connection instead of polling
  const { status: connectionStatus, sendMessage: wsSendMessage } = useWebSocket(household?.id);

  const { data: serverMessages = [], isLoading } = useQuery({
    queryKey: ["/api/messages"],
    enabled: !!household && !!user,
    // No polling - WebSocket handles real-time updates
    retry: 2,
    retryDelay: 1000,
  });

  // Use server messages directly for reliable message display
  const messages = useMemo(() => {
    return Array.isArray(serverMessages) ? serverMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
  }, [serverMessages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Use WebSocket if connected, fallback to API
      if (connectionStatus === 'connected') {
        wsSendMessage(content);
        return { success: true, method: 'websocket' };
      } else {
        // Fallback to API if WebSocket not available
        const response = await apiRequest("POST", "/api/messages", { content });
        return await response.json();
      }
    },
    onMutate: async (content: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/messages"] });
      
      // Snapshot previous value
      const previousMessages = queryClient.getQueryData(["/api/messages"]) as any[] || [];
      
      // Optimistically update messages for instant UI response
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        userId: user?.id,
        content,
        createdAt: new Date().toISOString(),
        user: {
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email
        }
      };
      
      queryClient.setQueryData(["/api/messages"], (old: any[] = []) => [...old, optimisticMessage]);
      
      return { previousMessages, optimisticMessage };
    },
    onError: (err, content, context) => {
      // On error, roll back to previous state
      if (context?.previousMessages) {
        queryClient.setQueryData(["/api/messages"], context.previousMessages);
      }
      
      // Restore input value for user to retry
      setNewMessage(content);
    },
    onSettled: () => {
      // WebSocket will handle real-time updates, no need for polling
      // Only invalidate if using API fallback
      if (connectionStatus !== 'connected') {
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      }
    }
  });

  const scrollToBottom = (keyboardAware: boolean = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const scrollOptions = {
      top: container.scrollHeight,
      behavior: 'smooth' as ScrollBehavior
    };

    if (keyboardAware && keyboardHeight > 0) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          container.scrollTo(scrollOptions);
        }, 200);
      });
    } else {
      container.scrollTo(scrollOptions);
    }
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const scrolled = container.scrollTop > 10;
    setHeaderScrolled(scrolled);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    const messageContent = newMessage.trim();
    setNewMessage("");
    
    try {
      await sendMessageMutation.mutateAsync(messageContent);
      scrollToBottom(true);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScrollEvent = () => handleScroll();
    container.addEventListener('scroll', handleScrollEvent);
    
    return () => container.removeEventListener('scroll', handleScrollEvent);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      if (messages.length <= 5) {
        window.scrollTo(0, 0);
      } else {
        setTimeout(() => scrollToBottom(), 100);
      }
    }
  }, [messages.length]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const conversationStarters = [
    { icon: Coffee, text: "Who's making coffee this morning?", color: "from-amber-400 to-orange-500" },
    { icon: Home, text: "Weekly house meeting tomorrow?", color: "from-blue-400 to-purple-500" },
    { icon: ShoppingCart, text: "Need anything from the grocery store?", color: "from-green-400 to-emerald-500" },
    { icon: Calendar, text: "Anyone free this weekend?", color: "from-purple-400 to-pink-500" }
  ];

  // Connection status indicator
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'connecting': case 'reconnecting': return 'text-yellow-500';
      case 'disconnected': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Real-time';
      case 'connecting': return 'Connecting';
      case 'reconnecting': return 'Reconnecting';
      case 'disconnected': return 'Offline';
      default: return 'Unknown';
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen transition-all duration-300 ${isKeyboardVisible ? 'pb-0' : 'pb-20'}`}>
      {/* Floating header */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        headerScrolled ? 'bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50' : 'bg-transparent'
      }`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Messages
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
              <span className={`text-sm ${getStatusColor()}`}>{getStatusText()}</span>
            </div>
          </div>
          {household && (
            <div className="flex items-center space-x-3">
              <QuickAvatar
                firstName={user?.firstName}
                lastName={user?.lastName}
                profileImage={user?.profileImage}
                size="w-10 h-10"
                textSize="text-sm"
                gradientType="emerald-cyan"
                className="ring-2 ring-white/20"
              />
            </div>
          )}
        </div>
      </div>

      {/* Messages container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto pt-32 px-6 space-y-6"
        style={{ paddingBottom: isKeyboardVisible ? `${keyboardHeight + 100}px` : '140px' }}
      >
        {/* Conversation starters for empty state */}
        {messages.length === 0 && (
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Start the conversation
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Break the ice with your household
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {conversationStarters.map((starter, index) => {
                  const IconComponent = starter.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => setNewMessage(starter.text)}
                      className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 text-left group"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${starter.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {starter.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages list */}
        {messages.map((message: any, index: number) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.userId === user?.id}
            showAvatar={index === 0 || messages[index - 1]?.userId !== message.userId}
            showTime={
              index === messages.length - 1 ||
              messages[index + 1]?.userId !== message.userId ||
              new Date(messages[index + 1]?.createdAt).getTime() - new Date(message.createdAt).getTime() > 300000
            }
          />
        ))}

        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 px-4 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-gray-500">
              {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#1a1a1a]/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 p-4 transition-all duration-300"
        style={{ 
          transform: isKeyboardVisible ? `translateY(-${keyboardHeight}px)` : 'translateY(0)',
          paddingBottom: isKeyboardVisible ? '16px' : '96px'
        }}
      >
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Input
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="input-modern pr-4 py-3 min-h-[48px] resize-none"
              disabled={sendMessageMutation.isPending}
            />
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className={`btn-animated px-6 py-3 min-h-[48px] transition-all duration-300 ${
              isKeyboardVisible ? 'scale-110' : 'scale-100'
            }`}
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}