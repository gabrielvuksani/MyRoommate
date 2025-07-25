import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Star,
  Sparkles,
  Video,
  Coffee,
  Heart
} from "lucide-react";

// Event type icons
const getEventIcon = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'meeting': return Video;
    case 'appointment': return CalendarIcon;
    case 'social': return Coffee;
    case 'personal': return Heart;
    default: return Star;
  }
};

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
          gradient: 'from-blue-500 to-cyan-600',
          light: 'rgba(59, 130, 246, 0.1)',
          color: '#3B82F6',
          emoji: '👥'
        };
      case 'appointment':
        return {
          gradient: 'from-purple-500 to-indigo-600',
          light: 'rgba(139, 92, 246, 0.1)',
          color: '#8B5CF6',
          emoji: '📅'
        };
      case 'social':
        return {
          gradient: 'from-orange-500 to-amber-600',
          light: 'rgba(249, 115, 22, 0.1)',
          color: '#F97316',
          emoji: '🎉'
        };
      case 'personal':
        return {
          gradient: 'from-emerald-500 to-green-600',
          light: 'rgba(16, 185, 129, 0.1)',
          color: '#10B981',
          emoji: '⭐'
        };
      default:
        return {
          gradient: 'from-gray-500 to-slate-600',
          light: 'rgba(107, 114, 128, 0.1)',
          color: '#6B7280',
          emoji: '📍'
        };
    }
  };
  
  const typeConfig = getEventTypeConfig(event.type);
  const EventIcon = getEventIcon(event.type);
  const eventColor = event.color || typeConfig.color;
  
  // Calculate card offset for stacking effect
  const cardOffset = isActive ? 0 : (index - (isActive ? 1 : 0)) * 12;
  const scale = isActive ? 1 : 1 - (index * 0.02);
  const zIndex = totalCards - index;
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(event.id);
    }
  };

  return (
    <motion.div
      className="absolute inset-x-0 top-0 cursor-pointer"
      initial={{ 
        y: 100, 
        opacity: 0,
        scale: 0.95 
      }}
      animate={{ 
        y: cardOffset,
        scale: isActive ? 1.02 : scale,
        opacity: 1,
        rotateX: isActive ? 0 : -5
      }}
      exit={{ 
        x: 300,
        opacity: 0,
        scale: 0.8,
        rotate: 15
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }}
      style={{ 
        zIndex,
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
      onClick={() => !isActive && onActivate && onActivate()}
    >
      <div 
        className={`
          relative overflow-hidden rounded-3xl mx-6
          ${isActive ? 'shadow-2xl' : 'shadow-lg'}
          transition-all duration-500
        `}
        style={{
          background: 'var(--glass-card)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          minHeight: '200px',
          transform: isActive ? 'translateZ(50px)' : 'translateZ(0)',
        }}
      >
        {/* Event color accent bar */}
        <div 
          className="absolute top-0 left-0 w-2 h-full"
          style={{ 
            background: eventColor,
            opacity: 0.8
          }}
        />
        
        {/* Main content */}
        <div className="p-6 pl-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div 
                className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center
                  bg-gradient-to-br ${typeConfig.gradient}
                  shadow-lg transform transition-transform duration-300
                  ${isActive ? 'scale-110' : 'scale-100'}
                `}
              >
                <span className="text-2xl">{typeConfig.emoji}</span>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {event.title}
                </h3>
                {event.description && (
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {event.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium" style={{ color: typeConfig.color }}>
                {event.allDay ? 'All Day' : new Date(event.startDate).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
              {event.endDate && !event.allDay && (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  to {new Date(event.endDate).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          </div>
          
          {/* Meta information */}
          <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
            {/* Location */}
            {event.location && (
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <MapPin size={14} />
                <span className="truncate max-w-[150px]">{event.location}</span>
              </div>
            )}
            
            {/* Attendees */}
            {event.attendees && event.attendees.length > 0 && (
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Users size={14} />
                <span>{event.attendees.length} attendees</span>
              </div>
            )}
            
            {/* Reminder */}
            {event.reminderMinutes && (
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Bell size={14} />
                <span>{event.reminderMinutes}m reminder</span>
              </div>
            )}
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type badge */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ 
                background: typeConfig.light,
                color: typeConfig.color
              }}
            >
              <span className="capitalize">{event.type || 'Event'}</span>
            </div>
            
            {/* Recurring badge */}
            {event.isRecurring && event.recurrencePattern && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#3B82F6'
              }}>
                <Repeat size={12} />
                <span className="capitalize">{event.recurrencePattern}</span>
              </div>
            )}
          </div>
          
          {/* Expand button */}
          {isActive && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className={`
                absolute bottom-4 right-4 p-2 rounded-xl
                transition-all duration-200
                ${isExpanded ? 'bg-gradient-to-r ' + typeConfig.gradient + ' text-white' : ''}
              `}
              style={{
                background: isExpanded ? undefined : 'var(--surface-secondary)'
              }}
            >
              <ChevronRight 
                size={20} 
                className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              />
            </motion.button>
          )}
        </div>
        
        {/* Expanded content */}
        <AnimatePresence>
          {isActive && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pl-8 space-y-4">
                {/* Notes */}
                {event.notes && (
                  <div className="p-4 rounded-2xl" style={{ background: 'var(--surface-secondary)' }}>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Notes
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {event.notes}
                    </p>
                  </div>
                )}
                
                {/* Attendees list */}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Attendees
                    </p>
                    <div className="space-y-2">
                      {event.attendees.map((attendee: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                            style={{ 
                              background: typeConfig.light,
                              color: typeConfig.color
                            }}
                          >
                            {attendee.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                            {attendee}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Delete button */}
                <div className="pt-2">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full p-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      <span className="text-sm font-medium">Delete Event</span>
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
                        className="flex-1 p-3 rounded-xl bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors"
                      >
                        Confirm Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(false);
                        }}
                        className="flex-1 p-3 rounded-xl text-sm font-medium transition-colors"
                        style={{ 
                          background: 'var(--surface-secondary)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        Cancel
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

// Premium Calendar Grid Component
const CalendarGrid = ({ 
  currentDate, 
  selectedDate, 
  events,
  onDayClick 
}: {
  currentDate: Date;
  selectedDate: Date | null;
  events: any[];
  onDayClick: (day: number) => void;
}) => {
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

  const getDayEvents = (day: number) => {
    return events.filter((event: any) => {
      const eventDate = new Date(event.startDate);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentMonth && 
             eventDate.getFullYear() === currentYear;
    });
  };

  return (
    <div className="space-y-4">
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-3">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-bold py-2" style={{ color: 'var(--text-secondary)' }}>
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-3">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-14"></div>;
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
            <motion.button
              key={`day-${day}`}
              onClick={() => onDayClick(day)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                h-14 rounded-2xl font-medium relative
                transition-all duration-200
                ${isSelected ? 'shadow-lg' : ''}
              `}
              style={{
                background: isSelected 
                  ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                  : isToday 
                  ? 'var(--glass-card)' 
                  : hasEvents 
                  ? 'var(--surface-secondary)' 
                  : 'transparent',
                color: isSelected 
                  ? '#ffffff' 
                  : isToday 
                  ? '#3B82F6' 
                  : 'var(--text-primary)',
                border: isToday && !isSelected ? '2px solid #3B82F6' : 'none',
                backdropFilter: isToday && !isSelected ? 'blur(10px)' : 'none',
                WebkitBackdropFilter: isToday && !isSelected ? 'blur(10px)' : 'none',
              }}
            >
              <span className="text-sm font-semibold">{day}</span>
              {hasEvents && !isSelected && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {dayEvents.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  ))}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
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

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setActiveEventIndex(0);
  };

  const getDayEvents = (date: Date) => {
    return (events as any[]).filter((event: any) => {
      const eventDate = new Date(event.startDate);
      return eventDate.getDate() === date.getDate() && 
             eventDate.getMonth() === date.getMonth() && 
             eventDate.getFullYear() === date.getFullYear();
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const selectedDayEvents = selectedDate ? getDayEvents(selectedDate) : [];

  return (
    <div className="page-container page-transition">
      {/* Premium Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Calendar</h1>
              <p className="page-subtitle">Your schedule & events</p>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/add-event')}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <Plus size={24} className="text-white" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="content-with-header-compact px-6 space-y-6">
        {/* Calendar Grid Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'var(--glass-card)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <div className="p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigateMonth('prev')}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'var(--surface-secondary)' }}
              >
                <ChevronLeft size={20} style={{ color: 'var(--text-secondary)' }} />
              </motion.button>
              
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigateMonth('next')}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'var(--surface-secondary)' }}
              >
                <ChevronRight size={20} style={{ color: 'var(--text-secondary)' }} />
              </motion.button>
            </div>

            {/* Calendar Grid */}
            <CalendarGrid 
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={events}
              onDayClick={handleDayClick}
            />
          </div>
        </motion.div>

        {/* Selected Day Events */}
        {selectedDate && (
          <motion.div
            key={selectedDate.toDateString()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: 'var(--glass-card)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {selectedDate.toDateString() === new Date().toDateString() ? 'Today' : 
                     selectedDate.toLocaleDateString('en-US', { 
                       weekday: 'long',
                       month: 'short', 
                       day: 'numeric'
                     })}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/add-event')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium"
                >
                  Add Event
                </motion.button>
              </div>
              
              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-12">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
                  >
                    <CalendarIcon size={32} className="text-gray-400" />
                  </motion.div>
                  <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    No events scheduled
                  </h4>
                  <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
                    This day is completely free
                  </p>
                </div>
              ) : (
                <div className="relative" style={{ minHeight: `${Math.max(250, 200 + (selectedDayEvents.length - 1) * 12)}px` }}>
                  <AnimatePresence>
                    {selectedDayEvents.map((event: any, index: number) => (
                      <CalendarEventCard 
                        key={event.id} 
                        event={event} 
                        onDelete={handleDeleteEvent} 
                        index={index}
                        totalCards={selectedDayEvents.length}
                        isActive={activeEventIndex === index}
                        onActivate={() => setActiveEventIndex(index)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}