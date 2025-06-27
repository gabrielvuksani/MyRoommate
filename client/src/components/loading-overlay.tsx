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
          message: "Redirecting to home..."
        };
      default:
        return {
          icon: <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#007AFF' }} />,
          message
        };
    }
  };

  const stageContent = getStageContent();
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
          {/* Staged icon with animation */}
          <div className={`transition-all duration-300 ${stage === "success" ? "scale-110" : "scale-100"}`}>
            <div className="w-12 h-12 flex items-center justify-center">
              {stageContent.icon}
            </div>
          </div>
          
          <p 
            className={`text-lg font-medium transition-all duration-200 ${
              stage === "success" ? "text-green-600 dark:text-green-400" : ""
            }`}
            style={{ color: stage === "success" ? undefined : 'var(--text-primary)' }}
          >
            {stageContent.message}
          </p>
        </div>
      </div>
    </div>
  );
}