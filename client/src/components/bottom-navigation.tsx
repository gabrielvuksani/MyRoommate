import { useLocation } from "wouter";
import { Home, CheckSquare, DollarSign, Calendar, MessageCircle } from "lucide-react";

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
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-white tab-shadow">
      <div className="flex items-center justify-around py-2">
        {tabs.map(({ id, path, label, Icon }) => {
          const isActive = location === path;
          
          return (
            <button
              key={id}
              onClick={() => setLocation(path)}
              className="flex flex-col items-center py-2 px-4"
            >
              <Icon 
                size={24} 
                className={`mb-1 ${isActive ? 'text-ios-blue' : 'text-ios-gray-5'}`}
              />
              <span className={`text-ios-caption ${isActive ? 'text-ios-blue font-medium' : 'text-ios-gray-5'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
