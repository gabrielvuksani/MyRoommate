import { Home, MessageCircle, Users } from "lucide-react";
import { formatDisplayName } from "@/lib/nameUtils";

interface Conversation {
  id: string;
  type: 'household' | 'listing' | 'direct';
  name?: string;
  listingId?: string;
  participants?: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  }>;
  lastMessage?: {
    id: string;
    content: string;
    userId: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

export default function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect,
  loading 
}: ConversationListProps) {
  
  const getConversationIcon = (type: string) => {
    switch (type) {
      case 'household':
        return <Home className="w-5 h-5" />;
      case 'listing':
        return <MessageCircle className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    
    switch (conv.type) {
      case 'household':
        return 'Household Chat';
      case 'listing':
        return 'Listing Inquiry';
      case 'direct':
        return conv.participants && conv.participants.length > 0 
          ? formatDisplayName(conv.participants[0].firstName, conv.participants[0].lastName, conv.participants[0].email)
          : 'Direct Message';
      default:
        return 'Conversation';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-secondary">
        Loading conversations...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-secondary">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`w-full p-4 hover:bg-surface-hover transition-all duration-200 border-b border-border text-left ${
            selectedId === conv.id ? 'bg-surface-selected' : ''
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 ${
              conv.type === 'household' 
                ? 'bg-gradient-to-br from-emerald-400 to-cyan-500' 
                : 'bg-gradient-to-br from-blue-400 to-blue-600'
            } ${selectedId === conv.id ? 'scale-110' : ''}`}>
              {getConversationIcon(conv.type)}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate">
                  {getConversationName(conv)}
                </div>
                {conv.lastMessage && (
                  <div className="text-xs text-secondary">
                    {formatTime(conv.lastMessage.createdAt)}
                  </div>
                )}
              </div>
              {conv.lastMessage && (
                <div className="text-sm text-secondary truncate mt-1">
                  {conv.lastMessage.content}
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}