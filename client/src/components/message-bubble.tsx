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
    return (
      <div className="flex justify-end">
        <div className="flex-1 flex justify-end">
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
          {userName} • {new Date(message.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
