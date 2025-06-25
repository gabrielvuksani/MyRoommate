import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import MessageBubble from "@/components/message-bubble";

export default function Messages() {
  const [newMessage, setNewMessage] = useState('');
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
    <div className="page-container flex flex-col">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Messages</h1>
              <p className="page-subtitle">Group chat</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg">
                <MessageSquare size={20} className="text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col page-content-with-header">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-body text-secondary">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message: any) => (
            <MessageBubble key={message.id} message={message} currentUserId={user?.id} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-ios-gray-2 px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <div className="flex-1 bg-ios-gray rounded-full px-4 py-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full bg-transparent border-none text-ios-body text-black placeholder-ios-gray-5 focus:outline-none focus:ring-0"
            />
          </div>
          <Button 
            type="submit"
            disabled={!newMessage.trim()}
            className="w-8 h-8 bg-ios-blue hover:bg-ios-blue/90 rounded-full flex items-center justify-center p-0"
          >
            <span className="text-white text-ios-footnote">→</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
