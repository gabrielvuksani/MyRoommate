import { useLocation } from "wouter";
import { Home, DollarSign, Calendar, MessageCircle, User } from "lucide-react";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const tabs = [
    { id: 'home', path: '/', label: 'Home', Icon: Home },
    { id: 'expenses', path: '/expenses', label: 'Expenses', Icon: DollarSign },
    { id: 'calendar', path: '/calendar', label: 'Calendar', Icon: Calendar },
    { id: 'messages', path: '/messages', label: 'Chat', Icon: MessageCircle },
  ];

  return (
    <nav className="tab-navigation">
      <div className="flex items-center justify-around">
        {tabs.map(({ id, path, label, Icon }) => {
          const isActive = location === path;
          
          return (
            <button
              key={id}
              onClick={() => setLocation(path)}
              className={`tab-item flex flex-col items-center justify-center min-w-0 flex-1 transition-all hover:scale-110 ${
                isActive ? 'active animate-bounce-in' : 'inactive'
              }`}
            >
              <Icon size={20} className="flex-shrink-0" />
              <span className="text-xs mt-0.5 font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
