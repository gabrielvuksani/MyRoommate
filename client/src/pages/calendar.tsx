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
      className="mb-4"
      initial={{ 
        y: 20, 
        opacity: 0
      }}
      animate={{ 
        y: 0,
        opacity: 1
      }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30,
        delay: index * 0.03
      }}
    >
      <div 
        className="glass-card overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg cursor-pointer"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-color)'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-4">
          {/* Header with time and type */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Type icon with gradient background */}
              <div 
                className={`w-10 h-10 rounded-xl bg-gradient-to-r ${typeConfig.gradient} flex items-center justify-center shadow-sm`}
              >
                <span className="text-lg">{typeConfig.icon}</span>
              </div>
              
              {/* Time info */}
              <div>
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: typeConfig.color }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {event.allDay ? 'All Day' : new Date(event.startDate).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(event.startDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
            
            {/* Expand/collapse indicator */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                style={{ color: 'var(--text-secondary)' }}
              />
            </button>
          </div>
          
          {/* Title and description */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {event.title}
            </h3>
            {event.description && (
              <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                {event.description}
              </p>
            )}
          </div>
          
          {/* Info badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Location */}
            {event.location && (
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: `${typeConfig.color}15`,
                  color: typeConfig.color
                }}
              >
                <MapPin size={12} />
                <span className="truncate max-w-[120px]">{event.location}</span>
              </div>
            )}
            
            {/* Attendees */}
            {event.attendees && event.attendees.length > 0 && (
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'var(--surface-secondary)',
                  color: 'var(--text-secondary)'
                }}
              >
                <Users size={12} />
                <span>{event.attendees.length} attending</span>
              </div>
            )}
            
            {/* Recurring badge */}
            {event.isRecurring && event.recurrencePattern && (
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: 'var(--primary)'
                }}
              >
                <Repeat size={12} />
                <span className="capitalize">{event.recurrencePattern}</span>
              </div>
            )}
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
              <div className="pt-3 mt-3 space-y-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                {/* Full description if truncated */}
                {event.description && event.description.length > 80 && (
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {event.description}
                  </p>
                )}
                
                {/* Reminder info */}
                {event.reminderMinutes && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <Bell size={14} />
                    <span>Reminder {event.reminderMinutes} minutes before</span>
                  </div>
                )}
                
                {/* Delete action */}
                <div className="flex justify-end pt-2">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                      }}
                      className="text-sm text-red-600 hover:text-red-700 transition-colors font-medium"
                    >
                      Delete Event
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Delete?</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(false);
                        }}
                        className="px-3 py-1 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
                        className="px-3 py-1 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
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