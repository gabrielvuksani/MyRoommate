import { formatDisplayName, getProfileInitials } from "@/lib/nameUtils";
import { QuickAvatar } from "./ProfileAvatar";

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
    const userName = formatDisplayName(message.user?.firstName, message.user?.lastName, message.user?.email?.split('@')[0] || 'You');
    
    return (
      <div className="flex justify-end mb-4 animate-fade-in">
        <div className="flex flex-col items-end max-w-xs">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
              {new Date(message.createdAt).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })}
            </span>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {userName}
            </span>
            <QuickAvatar 
              user={message.user} 
              size="sm" 
              gradientType="emerald"
              className="shadow-lg ring-2 ring-white/20"
            />
          </div>
          <div 
            className={`relative group ${isPending ? 'opacity-70' : ''}`}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              borderRadius: '24px 24px 6px 24px',
              padding: '14px 18px',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.25), 0 2px 8px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-[24px_24px_6px_24px] pointer-events-none"></div>
            <p className="text-white font-medium leading-relaxed relative z-10">{message.content}</p>
            <div 
              className="absolute bottom-0 right-0 w-2 h-2 rounded-tl-sm"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  const userInitials = getProfileInitials(message.user?.firstName, message.user?.lastName, message.user?.email);
  const userName = formatDisplayName(message.user?.firstName, message.user?.lastName, message.user?.email?.split('@')[0] || 'Unknown');

  return (
    <div className="flex justify-start mb-4 animate-fade-in">
      <div className="flex flex-col items-start max-w-xs">
        <div className="flex items-center space-x-3 mb-2">
          <QuickAvatar 
            user={message.user} 
            size="sm" 
            gradientType="blue"
            className="shadow-lg ring-2 ring-white/20"
          />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {userName}
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {new Date(message.createdAt).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}
          </span>
        </div>
        <div 
          className="relative group"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            borderRadius: '24px 24px 24px 6px',
            padding: '14px 18px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
            backdropFilter: 'blur(20px) saturate(1.8)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 rounded-[24px_24px_24px_6px] pointer-events-none"></div>
          <p className="text-gray-900 font-medium leading-relaxed relative z-10">{message.content}</p>
          <div 
            className="absolute bottom-0 left-0 w-2 h-2 rounded-tr-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px) saturate(1.8)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
