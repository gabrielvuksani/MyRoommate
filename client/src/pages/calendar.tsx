import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { notificationService } from "@/lib/notifications";
import { motion, AnimatePresence } from "framer-motion";

import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Repeat, 
  Trash2, 
  Bell,
  MoreVertical 
} from "lucide-react";

// Premium Calendar Event Card Component
const CalendarEventCard = ({ 
  event, 
  onDelete, 
  index,
  totalCards,
  isActive,
  onActivate
}: { 
  event: any; 
  onDelete: (id: string) => void; 
  index: number;
  totalCards: number;
  isActive: boolean;
  onActivate: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const getEventTypeConfig = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'meeting':
        return {
          icon: '👥',
          gradient: 'from-blue-500 via-blue-600 to-cyan-500',
          glow: 'rgba(59, 130, 246, 0.4)',
          pattern: 'bg-gradient-to-br from-blue-400/20 via-transparent to-cyan-400/20',
          color: '#3B82F6'
        };
      case 'appointment':
        return {
          icon: '📅',
          gradient: 'from-purple-500 via-fuchsia-500 to-pink-500',
          glow: 'rgba(168, 85, 247, 0.4)',
          pattern: 'bg-gradient-to-br from-purple-400/20 via-transparent to-pink-400/20',
          color: '#8B5CF6'
        };
      case 'social':
        return {
          icon: '🎉',
          gradient: 'from-orange-500 via-rose-500 to-pink-500',
          glow: 'rgba(251, 146, 60, 0.4)',
          pattern: 'bg-gradient-to-br from-orange-400/20 via-transparent to-rose-400/20',
          color: '#F97316'
        };
      case 'personal':
        return {
          icon: '⭐',
          gradient: 'from-emerald-500 via-green-500 to-teal-500',
          glow: 'rgba(16, 185, 129, 0.4)',
          pattern: 'bg-gradient-to-br from-emerald-400/20 via-transparent to-teal-400/20',
          color: '#10B981'
        };
      default:
        return {
          icon: '📍',
          gradient: 'from-gray-500 via-slate-600 to-gray-700',
          glow: 'rgba(107, 114, 128, 0.4)',
          pattern: 'bg-gradient-to-br from-gray-400/20 via-transparent to-slate-400/20',
          color: '#6B7280'
        };
    }
  };
  
  const typeConfig = getEventTypeConfig(event.type);
  const eventColor = event.color || typeConfig.color;
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(event.id);
    }
  };

  return (
    <motion.div
      className="mb-3 cursor-pointer"
      initial={{ 
        y: 30, 
        opacity: 0,
        scale: 0.95 
      }}
      animate={{ 
        y: 0,
        scale: 1,
        opacity: 1
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        delay: index * 0.05
      }}
    >
      <div 
        className={`
          relative overflow-hidden rounded-2xl
          shadow-md hover:shadow-xl
          transition-all duration-300 hover:scale-[1.02]
          ${isActive ? 'ring-2 ring-offset-2' : ''}
        `}
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: isActive ? `0 10px 40px ${typeConfig.glow}` : undefined,
          ringColor: eventColor
        }}
        onClick={onActivate}
      >
        {/* Pattern overlay */}
        <div className={`absolute inset-0 opacity-30 ${typeConfig.pattern}`} />
        
        {/* Time strip */}
        <div className={`absolute top-0 left-0 right-0 h-12 bg-gradient-to-r ${typeConfig.gradient} opacity-90`}>
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-white/80" />
              <span className="text-sm font-medium text-white">
                {event.allDay ? 'All Day' : new Date(event.startDate).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <span className="text-2xl">{typeConfig.icon}</span>
          </div>
        </div>
        
        {/* Main content */}
        <div className="pt-14 p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left side - event info */}
            <div className="flex-1">
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {event.title}
              </h3>
              
              {event.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {event.description}
                </p>
              )}
              
              {/* Info chips */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Location */}
                {event.location && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
                    <MapPin size={12} />
                    <span className="truncate max-w-[120px]">{event.location}</span>
                  </div>
                )}
                
                {/* Attendees */}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
                    <Users size={12} />
                    <span>{event.attendees.length}</span>
                  </div>
                )}
                
                {/* Recurring */}
                {event.isRecurring && event.recurrencePattern && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-xs text-blue-700 dark:text-blue-300">
                    <Repeat size={12} />
                    <span className="capitalize">{event.recurrencePattern}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right side - actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <MoreVertical size={16} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-2 space-y-3 border-t border-gray-200 dark:border-gray-700">
                {/* Reminder info */}
                {event.reminderMinutes && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Bell size={14} />
                    <span>Reminder set for {event.reminderMinutes} minutes before</span>
                  </div>
                )}
                
                {/* Delete button */}
                <div className="flex justify-end">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                      }}
                      className="text-sm text-red-600 hover:text-red-700 transition-colors"
                    >
                      Delete Event
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Delete?</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(false);
                        }}
                        className="px-2 py-1 text-sm rounded-md text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
                        className="px-2 py-1 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const [, navigate] = useLocation();
  
  const queryClient = useQueryClient();

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/calendar"],
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/calendar-events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      setActiveEventIndex(0);
    },
    onError: (error) => {
      console.error('Error deleting event:', error);
    },
  });

  const handleDeleteEvent = (id: string) => {
    deleteEventMutation.mutate(id);
  };

  // Calendar logic
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const calendarDays = [];
  // Add empty cells for days before the month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentMonth - 1);
    } else {
      newDate.setMonth(currentMonth + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    setSelectedDate(clickedDate);
    setActiveEventIndex(0);
  };

  const getDayEvents = (day: number) => {
    return (events as any).filter((event: any) => {
      const eventDate = new Date(event.startDate);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentMonth && 
             eventDate.getFullYear() === currentYear;
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="page-container page-transition">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Calendar</h1>
              <p className="page-subtitle">Your household schedule</p>
            </div>
            
            <button 
              onClick={() => navigate('/add-event')}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg btn-animated transition-all hover:scale-[1.05]">
              <Plus size={24} className="text-white" />
            </button>

          </div>
        </div>
      </div>
      {/* Calendar Section */}
      <div className="content-with-header-compact px-6 mb-6">
        <div className="smart-card p-6 animate-fade-in pl-[3px] pr-[3px]">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mt-[16px] mb-[16px] ml-[4px] mr-[4px]">
            <button
              onClick={() => navigateMonth('prev')}
              className="w-10 h-10 rounded-full flex items-center justify-center btn-animated"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <ChevronLeft size={20} style={{ color: 'var(--text-secondary)' }} />
            </button>
            
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {monthNames[currentMonth]} {currentYear}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="w-10 h-10 rounded-full flex items-center justify-center btn-animated"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <ChevronRight size={20} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 ml-[6px] mr-[6px]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-bold py-3" style={{ color: 'var(--text-secondary)' }}>
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2 pl-[6px] pr-[6px] pt-[12px] pb-[12px]">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-12"></div>;
                }
                
                const isToday = day === today.getDate() && 
                               currentMonth === today.getMonth() && 
                               currentYear === today.getFullYear();
                const isSelected = selectedDate && 
                                 day === selectedDate.getDate() && 
                                 currentMonth === selectedDate.getMonth() && 
                                 currentYear === selectedDate.getFullYear();
                const dayEvents = getDayEvents(day);
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => handleDayClick(day)}
                    className={`h-12 rounded-xl text-center font-medium transition-all duration-200 relative btn-animated ${
                      isSelected 
                        ? 'bg-primary text-white shadow-lg' 
                        : isToday
                        ? 'text-primary font-semibold border border-primary'
                        : ''
                    }`}
                    style={{
                      backgroundColor: isSelected ? '#3B82F6' : 
                                     isToday ? 'rgba(59, 130, 246, 0.1)' :
                                     hasEvents ? 'var(--surface-secondary)' : 'transparent',
                      color: isSelected ? '#ffffff' :
                             isToday ? '#3B82F6' :
                             hasEvents ? 'var(--text-primary)' : 'var(--text-secondary)',
                      borderColor: isToday ? '#3B82F6' : 'transparent',
                      fontWeight: isSelected ? '600' : isToday ? '600' : '500'
                    }}
                  >
                    <span className="text-sm">{day}</span>
                    {hasEvents && !isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Selected Day Events */}
      {selectedDate && (
        <div className="px-6 pb-8 calendar-events-enter" key={selectedDate.toDateString()}>
          <div className="smart-card p-6 calendar-card-enter">
            <div className="flex items-center justify-between pl-[16px] pr-[16px] mt-[16px] mb-[16px]">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : 
                 selectedDate.toLocaleDateString('en-US', { 
                   weekday: 'long',
                   month: 'short', 
                   day: 'numeric'
                 })}
              </h3>
              <button
                onClick={() => navigate('/add-event')}
                className="bg-primary text-white px-4 py-2 rounded-xl font-semibold btn-animated"
              >
                Add Event
              </button>
            </div>
            
            {getDayEvents(selectedDate.getDate()).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <CalendarIcon size={28} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No events scheduled</h4>
                <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>This day is completely free</p>
                <button 
                  onClick={() => navigate('/add-event')}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-semibold btn-animated"
                >
                  Add Event
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {getDayEvents(selectedDate.getDate()).map((event: any, index: number) => (
                  <CalendarEventCard 
                    key={event.id} 
                    event={event} 
                    onDelete={handleDeleteEvent} 
                    index={index}
                    totalCards={getDayEvents(selectedDate.getDate()).length}
                    isActive={activeEventIndex === index}
                    onActivate={() => setActiveEventIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}