import { Home, Calendar, DollarSign, MessageSquare, User, CheckSquare } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect } from "react";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const navigationRef = useRef<HTMLElement>(null);
  
  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
    enabled: !!user,
  });

  const tabs = [
    { id: 'home', path: '/', label: 'Home', Icon: Home },
    { id: 'chores', path: '/chores', label: 'Chores', Icon: CheckSquare },
    { id: 'expenses', path: '/expenses', label: 'Expenses', Icon: DollarSign },
    { id: 'calendar', path: '/calendar', label: 'Calendar', Icon: Calendar },
    { id: 'chat', path: '/messages', label: 'Chat', Icon: MessageSquare },
  ];

  const activeIndex = tabs.findIndex(tab => tab.path === location);

  useEffect(() => {
    if (navigationRef.current && activeIndex !== -1) {
      navigationRef.current.style.setProperty('--indicator-translate', `${activeIndex}`);
    }
  }, [activeIndex]);

  return (
    <div className="bottom-nav-container">
      <nav ref={navigationRef} className="bottom-nav">
        <div className="nav-indicator"></div>
        {tabs.map(({ id, path, label, Icon }, index) => {
          const isActive = location === path;
          
          return (
            <button
              key={id}
              onClick={() => setLocation(path)}
              className={`nav-tab ${isActive ? 'nav-tab-active' : ''}`}
            >
              <div className="nav-tab-content">
                <Icon size={18} />
                <span>{label}</span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}