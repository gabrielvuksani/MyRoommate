import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
  stage?: "" | "processing" | "success" | "completing";
}

export default function LoadingOverlay({ message = "Loading...", stage = "" }: LoadingOverlayProps) {
  
  const getStageContent = () => {
    switch (stage) {
      case "processing":
        return {
          icon: <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#007AFF' }} />,
          message: message.includes("Refresh") ? "Clearing app data..." : "Leaving household..."
        };
      case "success":
        return {
          icon: <CheckCircle className="w-6 h-6" style={{ color: '#34C759' }} />,
          message: message.includes("Refresh") ? "Data cleared successfully" : "Left household successfully"
        };
      case "completing":
        return {
          icon: <ArrowRight className="w-6 h-6" style={{ color: '#007AFF' }} />,
          message: message.includes("Refresh") ? "Redirecting to home..." : "Redirecting to home..."
        };
      default:
        return {
          icon: <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#007AFF' }} />,
          message: message
        };
    }
  };

  const stageContent = getStageContent();
  
  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{ 
        background: 'rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
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
          {/* Spinner/Icon */}
          <div className="flex items-center justify-center">
            {stageContent.icon}
          </div>
          
          {/* Message */}
          <p 
            className="text-center font-medium text-lg leading-relaxed"
            style={{ color: stage === "success" ? undefined : 'var(--text-primary)' }}
          >
            {stageContent.message}
          </p>
        </div>
      </div>
    </div>
  );
}