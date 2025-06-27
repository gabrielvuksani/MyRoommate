export default function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ 
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div 
        className="relative overflow-hidden rounded-3xl shadow-2xl min-w-[280px]"
        style={{
          background: 'var(--surface-overlay)',
          backdropFilter: 'blur(30px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(30px) saturate(1.8)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          animation: 'modal-enter 0.2s ease-out'
        }}
      >
        {/* Glass effect gradient overlay */}
        <div 
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%)'
          }}
        />
        
        <div className="relative z-10 p-8 flex flex-col items-center space-y-4">
          {/* Premium gradient spinner */}
          <div className="relative w-12 h-12">
            <div 
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0deg, #007AFF 90deg, transparent 360deg)',
                animation: 'spin 0.8s linear infinite'
              }}
            />
            <div 
              className="absolute inset-[3px] rounded-full"
              style={{
                background: 'var(--surface-overlay)',
              }}
            />
          </div>
          
          <p 
            className="text-lg font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}