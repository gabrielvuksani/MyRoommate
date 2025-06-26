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
    
    // Calculate responsive tab positioning accounting for container padding
    const containerWidth = navigationRef.current.offsetWidth;
    const containerPadding = 16; // 8px padding on each side from CSS
    const availableWidth = containerWidth - containerPadding;
    const tabWidth = availableWidth / tabs.length;
    const indicatorWidth = tabWidth;
    const translateX = (containerPadding / 2) + (activeIndex * tabWidth);
    
    navigationRef.current.style.setProperty('--indicator-translate', `${translateX}px`);
    navigationRef.current.style.setProperty('--indicator-width', `${indicatorWidth}px`);
    
    // Also need to handle resize events
    const handleResize = () => {
      if (!navigationRef.current) return;
      const newContainerWidth = navigationRef.current.offsetWidth;
      const newContainerPadding = 16;
      const newAvailableWidth = newContainerWidth - newContainerPadding;
      const newTabWidth = newAvailableWidth / tabs.length;
      const newIndicatorWidth = newTabWidth;
      const newTranslateX = (newContainerPadding / 2) + (activeIndex * newTabWidth);
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
        '--indicator-width': 'calc((100% - 16px) / 5)',
      } as React.CSSProperties}
    >
      <div className="flex items-center justify-center w-full">
        {tabs.map(({ id, path, label, Icon }) => {
          const isActive = location === path;
          
          return (
            <button
              key={id}
              onClick={() => setLocation(path)}
              className={`tab-item ${isActive ? 'active' : 'inactive'}`}
            >
              <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium leading-none tracking-tight whitespace-nowrap">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
