import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Home, CheckSquare, DollarSign, Calendar, MessageCircle, BarChart3 } from "lucide-react";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const navigationRef = useRef<HTMLElement>(null);
  
  // Check if user has a household
  const { data: household } = useQuery({
    queryKey: ['/api/households/current'],
  });

  // Don't render navigation if user has no household
  if (!household) {
    return null;
  }

  const tabs = [
    { id: 'home', path: '/', label: 'Home', Icon: Home },
    { id: 'chores', path: '/chores', label: 'Chores', Icon: CheckSquare },
    { id: 'expenses', path: '/expenses', label: 'Expenses', Icon: DollarSign },
    { id: 'calendar', path: '/calendar', label: 'Calendar', Icon: Calendar },
    { id: 'messages', path: '/messages', label: 'Chat', Icon: MessageCircle },
  ];

  useEffect(() => {
    if (!navigationRef.current) return;
    
    const activeIndex = tabs.findIndex(tab => tab.path === location);
    if (activeIndex === -1) return;
    
    // Calculate exact position for 5 tabs (100% / 5 = 20% per tab)
    const translateX = activeIndex * (100 / tabs.length);
    navigationRef.current.style.setProperty('--indicator-translate', `${translateX}%`);
  }, [location, tabs]);

  return (
    <nav 
      ref={navigationRef}
      className="tab-navigation" 
      style={{
        '--indicator-translate': '0%',
        position: 'relative'
      } as React.CSSProperties}
    >
      <div className="flex items-center justify-center w-full relative">
        {tabs.map(({ id, path, label, Icon }) => {
          const isActive = location === path;
          
          return (
            <button
              key={id}
              onClick={() => setLocation(path)}
              className={`tab-item flex flex-col items-center justify-center min-w-0 flex-1 ${
                isActive ? 'active' : 'inactive'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="text-xs mt-0.5 font-medium truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
