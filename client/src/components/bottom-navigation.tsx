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
    
    // Calculate exact tab positioning for perfect alignment
    const containerWidth = navigationRef.current.offsetWidth;
    const tabWidth = containerWidth / tabs.length;
    const indicatorWidth = tabWidth - 16; // Full width minus padding
    const indicatorOffset = 8; // 8px padding from container edge
    const translateX = activeIndex * tabWidth + indicatorOffset;
    
    navigationRef.current.style.setProperty('--indicator-translate', `${translateX}px`);
    navigationRef.current.style.setProperty('--indicator-width', `${indicatorWidth}px`);
    
    // Also need to handle resize events
    const handleResize = () => {
      if (!navigationRef.current) return;
      const newContainerWidth = navigationRef.current.offsetWidth;
      const newTabWidth = newContainerWidth / tabs.length;
      const newIndicatorWidth = newTabWidth - 16;
      const newIndicatorOffset = 8;
      const newTranslateX = activeIndex * newTabWidth + newIndicatorOffset;
      navigationRef.current.style.setProperty('--indicator-translate', `${newTranslateX}px`);
      navigationRef.current.style.setProperty('--indicator-width', `${newIndicatorWidth}px`);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [location, tabs]);

  return (
    <nav 
      ref={navigationRef}
      className="tab-navigation" 
      style={{
        '--indicator-translate': '8px',
        '--indicator-width': 'calc(20% - 16px)', // Full tab width minus padding
      } as React.CSSProperties}
    >
      <div className="flex items-center w-full">
        {tabs.map(({ id, path, label, Icon }) => {
          const isActive = location === path;
          
          return (
            <button
              key={id}
              onClick={() => setLocation(path)}
              className={`tab-item flex flex-col items-center justify-center ${
                isActive ? 'active' : 'inactive'
              }`}
              style={{ width: `${100 / tabs.length}%` }}
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
