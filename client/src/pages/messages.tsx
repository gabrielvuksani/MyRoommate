import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import MessageBubble from "@/components/message-bubble";
import { MessageCircle } from "lucide-react";

export default function Messages() {
  const [newMessage, setNewMessage] = useState('');
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
      if (data.type === 'new_message') {
        queryClient.setQueryData(["/api/messages"], (old: any) => [...(old || []), data.message]);
      }
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle keyboard visibility on mobile
  useEffect(() => {
    const handleResize = () => {
      // Scroll to bottom when keyboard appears
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !household || !user) return;

    sendMessage({
      type: 'send_message',
      content: newMessage.trim(),
      householdId: household.id,
      userId: user.id,
    });

    setNewMessage('');
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
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
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
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center mb-4">
                <MessageCircle size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600 text-center">Start the conversation with your roommates!</p>
            </div>
          ) : (
            messages.map((message: any) => (
              <MessageBubble key={message.id} message={message} currentUserId={user?.id} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-3 z-40">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
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
