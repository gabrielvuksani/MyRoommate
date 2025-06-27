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
      className={`back-button-glass w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft 
        size={18} 
        className="transition-transform duration-300 group-hover:-translate-x-0.5 text-gray-700 dark:text-gray-200"
        strokeWidth={2.5}
      />
    </button>
  );
}