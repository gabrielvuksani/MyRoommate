import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{ 
        background: 'rgba(0, 0, 0, 0.05)',
        backdropFilter: 'blur(8px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(8px) saturate(1.2)',
        pointerEvents: 'all'
      }}
    >
      <div 
        className="relative overflow-hidden rounded-3xl shadow-2xl min-w-[280px] max-w-[320px]"
        style={{
          background: 'var(--surface-overlay)',
          backdropFilter: 'blur(30px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(30px) saturate(1.8)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
          animation: 'modal-enter 0.2s ease-out',
          marginTop: '10vh'
        }}
      >
        <div className="p-8 flex flex-col items-center space-y-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#007AFF' }} />
          </div>
          
          <p 
            className="text-center font-medium text-lg leading-relaxed"
            style={{ color: 'var(--text-primary)' }}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}