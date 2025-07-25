import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { notificationService } from "@/lib/notifications";

import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Users, Repeat, Trash2, Bell, MoreVertical } from "lucide-react";

// Calendar Event Card Component
const CalendarEventCard = ({ event, onDelete, index }: { event: any; onDelete: (id: string) => void; index: number }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getEventTypeConfig = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'meeting':
        return {
          icon: '👥',
          gradient: 'from-blue-500 to-cyan-500',
          bgLight: 'bg-blue-50',
          bgDark: 'bg-blue-950/20',
          textColor: 'text-blue-600 dark:text-blue-400'
        };
      case 'appointment':
        return {
          icon: '📅',
          gradient: 'from-purple-500 to-pink-500',
          bgLight: 'bg-purple-50',
          bgDark: 'bg-purple-950/20',
          textColor: 'text-purple-600 dark:text-purple-400'
        };
      case 'social':
        return {
          icon: '🎉',
          gradient: 'from-orange-500 to-amber-500',
          bgLight: 'bg-orange-50',
          bgDark: 'bg-orange-950/20',
          textColor: 'text-orange-600 dark:text-orange-400'
        };
      case 'personal':
        return {
          icon: '⭐',
          gradient: 'from-green-500 to-emerald-500',
          bgLight: 'bg-green-50',
          bgDark: 'bg-green-950/20',
          textColor: 'text-green-600 dark:text-green-400'
        };
      default:
        return {
          icon: '📍',
          gradient: 'from-gray-500 to-gray-600',
          bgLight: 'bg-gray-50',
          bgDark: 'bg-gray-800/20',
          textColor: 'text-gray-600 dark:text-gray-400'
        };
    }
  };
  
  const typeConfig = getEventTypeConfig(event.type);
  const eventColor = event.color || '#007AFF';
  
  return (
    <div 
      className={`
        group relative overflow-hidden transition-all duration-300 animate-fade-in
        ${showDetails ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
      `}
      style={{
        borderRadius: '20px',
        background: 'var(--glass-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        boxShadow: showDetails 
          ? '0 20px 40px -10px rgba(0, 0, 0, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
          : '0 4px 24px -2px rgba(0, 0, 0, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        animationDelay: `${index * 100}ms`
      }}
    >
      {/* Event color accent */}
      <div 
        className="absolute top-0 left-0 w-1 h-full opacity-80"
        style={{ backgroundColor: eventColor }}
      />
      
      {/* Main content */}
      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - event info */}
          <div className="flex items-start gap-4 flex-1">
            {/* Type icon */}
            <div className={`
              w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
              bg-gradient-to-br ${typeConfig.gradient} shadow-lg
            `}>
              <span className="text-white text-xl">{typeConfig.icon}</span>
            </div>
            
            {/* Event details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {event.title}
              </h3>
              
              {event.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {event.description}
                </p>
              )}
              
              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {/* Time */}
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <Clock size={14} />
                  <span>
                    {event.allDay ? 'All Day' : new Date(event.startDate).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                    {event.endDate && !event.allDay && (
                      <span className="text-gray-500 dark:text-gray-500">
                        {' - '}
                        {new Date(event.endDate).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </span>
                </div>
                
                {/* Location */}
                {event.location && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <MapPin size={14} />
                    <span className="truncate max-w-[150px]">{event.location}</span>
                  </div>
                )}
                
                {/* Attendees */}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <Users size={14} />
                    <span>{event.attendees.length} attendees</span>
                  </div>
                )}
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {/* Type badge */}
                <div className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                  ${typeConfig.bgLight} dark:${typeConfig.bgDark} ${typeConfig.textColor}
                `}>
                  <span className="capitalize">{event.type || 'Event'}</span>
                </div>
                
                {/* Recurring badge */}
                {event.isRecurring && event.recurrencePattern && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    <Repeat size={12} />
                    <span className="capitalize">{event.recurrencePattern}</span>
                  </div>
                )}
                
                {/* Reminder badge */}
                {event.reminderMinutes && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <Bell size={12} />
                    <span>{event.reminderMinutes}m reminder</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right side - actions */}
          <div className="flex items-start gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <MoreVertical size={16} className="text-gray-500" />
            </button>
            <button
              onClick={() => onDelete(event.id)}
              className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 size={16} className="text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
        
        {/* Expanded content */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 animate-fade-in">
            {/* Notes */}
            {event.notes && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                  {event.notes}
                </p>
              </div>
            )}
            
            {/* Full attendees list */}
            {event.attendees && event.attendees.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attendees</h4>
                <div className="space-y-2">
                  {event.attendees.map((attendee: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                        {attendee.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{attendee}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Creator info */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Created by {event.creator?.firstName || 'Unknown'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [headerScrolled, setHeaderScrolled] = useState(false);
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
              <div className="space-y-4">
                {getDayEvents(selectedDate.getDate()).map((event: any, index: number) => (
                  <CalendarEventCard 
                    key={event.id} 
                    event={event} 
                    onDelete={handleDeleteEvent} 
                    index={index} 
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