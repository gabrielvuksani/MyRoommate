export default function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
      <div className="relative">
        {/* Animated gradient background */}
        <div 
          className="absolute inset-0 rounded-[28px] animate-pulse"
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 50%, rgba(217, 70, 239, 0.2) 100%)',
            filter: 'blur(40px)',
            transform: 'scale(1.2)',
          }}
        />
        
        {/* Main glass container */}
        <div 
          className="relative rounded-[24px] p-10"
          style={{
            background: 'var(--surface-glass)',
            backdropFilter: 'blur(40px) saturate(2)',
            WebkitBackdropFilter: 'blur(40px) saturate(2)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
          }}
        >
          <div className="flex flex-col items-center space-y-5">
            {/* Liquid spinner */}
            <div className="relative w-14 h-14">
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent, #6366f1, #8b5cf6, #d946ef, transparent)',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div 
                className="absolute inset-[3px] rounded-full"
                style={{
                  background: 'var(--background)',
                  backdropFilter: 'blur(20px)',
                }}
              />
              <div 
                className="absolute inset-[6px] rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(217, 70, 239, 0.2))',
                }}
              />
            </div>
            
            {/* Message */}
            <p className="text-[17px] font-medium" style={{ color: 'var(--text-primary)' }}>
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}