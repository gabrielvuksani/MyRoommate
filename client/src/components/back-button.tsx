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
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all btn-animated ${className}`}
      style={{
        background: 'var(--surface-secondary)',
        color: 'var(--text-primary)'
      }}
      aria-label="Go back"
    >
      <ArrowLeft size={18} />
    </button>
  );
}