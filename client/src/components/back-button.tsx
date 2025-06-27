import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface BackButtonProps {
  onClick?: () => void;
  to?: string;
  className?: string;
}

export default function BackButton({ onClick, to = "/", className = "" }: BackButtonProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setLocation(to);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all btn-animated hover:scale-110 active:scale-95 hover:shadow-lg ${className}`}
      style={{
        background: 'linear-gradient(135deg, var(--surface-secondary) 0%, var(--surface) 100%)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)'
      }}
      aria-label="Go back"
    >
      <ArrowLeft size={20} />
    </button>
  );
}