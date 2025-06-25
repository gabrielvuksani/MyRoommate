import { useLocation } from "wouter";
import { Home, CheckSquare, DollarSign, Calendar, MessageCircle, BarChart3 } from "lucide-react";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const tabs = [
    { id: 'home', path: '/', label: 'Home', Icon: Home },
    { id: 'chores', path: '/chores', label: 'Chores', Icon: CheckSquare },
    { id: 'expenses', path: '/expenses', label: 'Expenses', Icon: DollarSign },
    { id: 'calendar', path: '/calendar', label: 'Calendar', Icon: Calendar },
    { id: 'messages', path: '/messages', label: 'Chat', Icon: MessageCircle },
  ];

  return (
    <nav className="tab-navigation">
      <div className="flex items-center justify-center space-x-2 w-full max-w-md">
        {tabs.map(({ id, path, label, Icon }) => {
          const isActive = location === path;
          
          return (
            <button
              key={id}
              onClick={() => setLocation(path)}
              className={`tab-item ${isActive ? 'active' : 'inactive'}`}
            >
              <Icon size={24} strokeWidth={2.5} className="flex-shrink-0" />
              <span className="text-xs font-semibold mt-1 tracking-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
