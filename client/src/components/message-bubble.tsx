interface MessageBubbleProps {
  message: any;
  currentUserId?: string;
}

export default function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isOwnMessage = message.userId === currentUserId;
  const isSystemMessage = message.type === 'system';
  const isPending = message.id?.startsWith('temp-');

  if (isSystemMessage) {
    return (
      <div className="flex justify-center mb-4">
        <div className="glass-card px-4 py-2 rounded-full">
          <p className="text-xs text-gray-600 font-medium">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isOwnMessage) {
    const userName = message.user?.firstName || message.user?.email?.split('@')[0] || 'You';
    
    return (
      <div className="flex justify-end mb-4 animate-fade-in">
        <div className="flex flex-col items-end max-w-sm">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-xs text-gray-400 font-medium">
              {new Date(message.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </span>
            <span className="text-xs text-gray-600 font-semibold">
              {userName}
            </span>
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-semibold">
                {message.user?.firstName?.[0] || message.user?.email?.[0] || 'Y'}
              </span>
            </div>
          </div>
          <div className={`bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-3xl rounded-tr-lg px-5 py-3 shadow-lg ${isPending ? 'opacity-70' : ''}`}>
            <p className="text-white font-medium leading-relaxed">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  const userInitial = message.user?.firstName?.[0] || message.user?.email?.[0] || '?';
  const userName = message.user?.firstName || message.user?.email?.split('@')[0] || 'Unknown';

  return (
    <div className="flex justify-start mb-4 animate-fade-in">
      <div className="flex flex-col items-start max-w-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-semibold">{userInitial}</span>
          </div>
          <span className="text-xs text-gray-600 font-semibold">
            {userName}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            {new Date(message.createdAt).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </span>
        </div>
        <div className="glass-card rounded-3xl rounded-tl-lg px-5 py-3 shadow-lg">
          <p className="text-gray-900 font-medium leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
