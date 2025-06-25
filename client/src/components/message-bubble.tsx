interface MessageBubbleProps {
  message: any;
  currentUserId?: string;
}

export default function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isOwnMessage = message.userId === currentUserId;
  const isSystemMessage = message.type === 'system';

  if (isSystemMessage) {
    return (
      <div className="flex justify-center">
        <div className="bg-ios-gray-4 rounded-full px-3 py-1">
          <p className="text-ios-caption text-ios-gray-6">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isOwnMessage) {
    const userName = message.user?.firstName || message.user?.email?.split('@')[0] || 'You';
    
    return (
      <div className="flex justify-end">
        <div className="flex flex-col items-end">
          <div className="flex items-center space-x-2 mb-1 px-1">
            <span className="text-xs text-gray-400">
              {new Date(message.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {userName}
            </span>
            <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {message.user?.firstName?.[0] || message.user?.email?.[0] || 'Y'}
              </span>
            </div>
          </div>
          <div className="bg-ios-blue rounded-2xl rounded-tr-md px-4 py-3 max-w-xs">
            <p className="text-ios-body text-white">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  const userInitial = message.user?.firstName?.[0] || message.user?.email?.[0] || '?';
  const userName = message.user?.firstName || message.user?.email?.split('@')[0] || 'Unknown';

  return (
    <div className="flex items-start space-x-2">
      <div className="w-8 h-8 bg-ios-blue rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white text-ios-footnote font-medium">{userInitial}</span>
      </div>
      <div className="flex-1">
        <div className="bg-ios-gray rounded-2xl rounded-tl-md px-4 py-3 max-w-xs">
          <p className="text-ios-body text-black">{message.content}</p>
        </div>
        <p className="text-ios-caption text-ios-gray-5 mt-1 ml-1">
          {userName} • {new Date(message.createdAt).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })}
        </p>
      </div>
    </div>
  );
}
