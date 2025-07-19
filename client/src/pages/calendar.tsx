import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { notificationService } from "@/lib/notifications";

import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";

export default function Calendar() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    color: '#3B82F6',
    type: 'social',
  });
  
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

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const dataToSend = {
        ...eventData,
        startDate: new Date(eventData.startDate).toISOString(),
        endDate: eventData.endDate ? new Date(eventData.endDate).toISOString() : null,
      };
      await apiRequest("POST", "/api/calendar", dataToSend);
    },
    onSuccess: (_, eventData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      
      // Send notification for new calendar event
      if (eventData && eventData.title && eventData.startDate) {
        notificationService.showCalendarNotification(eventData.title, eventData.startDate);
      }
      
      setIsCreateOpen(false);
      setNewEvent({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        color: '#3B82F6',
        type: 'social',
      });
    },
    onError: (error) => {
      console.error("Failed to create event:", error);
    },
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

  const handleCreateEvent = () => {
    if (!canCreateEvent) return;
    
    const startDateTime = new Date(newEvent.startDate);
    const endDateTime = newEvent.endDate ? 
      new Date(newEvent.endDate) : 
      new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour later if no end time
    
    const eventData = {
      title: newEvent.title,
      description: newEvent.description || '',
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      color: newEvent.color || '#3B82F6',
      type: newEvent.type || 'personal'
    };
    
    createEventMutation.mutate(eventData);
  };

  const canCreateEvent = newEvent.title.trim().length > 0 && newEvent.startDate.trim().length > 0;

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
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <button className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg btn-animated transition-all hover:scale-[1.05]">
                  <Plus size={24} className="text-white" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-white">Create Event</DialogTitle>
                    <DialogDescription className="text-purple-100 text-sm mt-1">Schedule something for your household</DialogDescription>
                  </DialogHeader>
                </div>
                
                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Event Title *</label>
                    <input
                      type="text"
                      placeholder="What's happening?"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Description</label>
                    <input
                      type="text"
                      placeholder="Add details (optional)..."
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Start Time</label>
                      <input
                        type="datetime-local"
                        value={newEvent.startDate}
                        onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>End Time (Optional)</label>
                      <input
                        type="datetime-local"
                        value={newEvent.endDate}
                        onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Leave empty for 1-hour duration"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Event Type</label>
                    <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                      <SelectTrigger className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500">
                        <SelectValue placeholder="Choose event type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-xl">
                        <SelectItem value="social" className="rounded-lg">🎉 Social</SelectItem>
                        <SelectItem value="work" className="rounded-lg">💼 Work</SelectItem>
                        <SelectItem value="personal" className="rounded-lg">👤 Personal</SelectItem>
                        <SelectItem value="household" className="rounded-lg">🏠 Household</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Event Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={newEvent.color}
                        onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                        className="w-16 h-12 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer"
                      />
                      <div className="flex space-x-2">
                        {['#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', '#000000'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewEvent({ ...newEvent, color })}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              newEvent.color === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-[0px] pb-[0px] pl-[12px] pr-[12px] mt-[12px] mb-[12px]">
                  <button 
                    onClick={() => setIsCreateOpen(false)}
                    className="px-6 py-3 font-semibold rounded-xl transition-colors btn-animated"
                    style={{ 
                      color: 'var(--text-secondary)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateEvent} 
                    disabled={!canCreateEvent || createEventMutation.isPending}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg btn-animated disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      {/* Calendar Section */}
      <div className="pt-32 px-6 mb-6">
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
                onClick={() => {
                  const dateString = selectedDate.toISOString().split('T')[0];
                  setNewEvent(prev => ({ ...prev, startDate: dateString }));
                  setIsCreateOpen(true);
                }}
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
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-semibold btn-animated"
                >
                  Add Event
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {getDayEvents(selectedDate.getDate()).map((event: any, index: number) => (
                  <div 
                    key={event.id} 
                    className="glass-card p-6 animate-fade-in hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      backdropFilter: 'blur(20px) saturate(1.8)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Enhanced Color Indicator */}
                      <div className="flex flex-col items-center space-y-2">
                        <div 
                          className="w-4 h-4 rounded-full shadow-lg"
                          style={{ 
                            backgroundColor: event.color || '#007AFF',
                            boxShadow: `0 0 20px ${event.color || '#007AFF'}40`
                          }}
                        ></div>
                        <div 
                          className="w-1 h-12 rounded-full opacity-30"
                          style={{ backgroundColor: event.color || '#007AFF' }}
                        ></div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                            {event.title}
                          </h4>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="group relative px-3 py-2 rounded-xl transition-all duration-200 hover:scale-105"
                            style={{ 
                              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#ef4444'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)';
                              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                            }}
                          >
                            <span className="text-xs font-semibold">Delete</span>
                          </button>
                        </div>
                        
                        {event.description && (
                          <p className="mb-4 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {event.description}
                          </p>
                        )}
                        
                        {/* Enhanced Badge Section */}
                        <div className="flex items-start flex-wrap gap-3">
                          {/* Time Badge */}
                          <div className="group relative">
                            <div 
                              className="px-4 py-2 rounded-xl transition-all duration-200 backdrop-blur-sm"
                              style={{ 
                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
                              }}
                            >
                              <span className="font-semibold text-sm" style={{ color: '#3b82f6' }}>
                                {new Date(event.startDate).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                                {event.endDate && (
                                  <span style={{ color: 'var(--text-secondary)' }}>
                                    {' - '}
                                    {new Date(event.endDate).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          
                          {/* Creator Badge */}
                          <div className="group relative">
                            <div 
                              className="px-4 py-2 rounded-xl transition-all duration-200 backdrop-blur-sm"
                              style={{ 
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)'
                              }}
                            >
                              <span className="font-semibold text-sm" style={{ color: '#10b981' }}>
                                {event.creator?.firstName || 'Unknown'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Type Badge */}
                          {event.type && (
                            <div className="group relative">
                              <div 
                                className="px-4 py-2 rounded-xl transition-all duration-200 backdrop-blur-sm"
                                style={{ 
                                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                                  border: '1px solid rgba(139, 92, 246, 0.2)',
                                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)'
                                }}
                              >
                                <span className="capitalize font-semibold text-sm" style={{ color: '#8b5cf6' }}>
                                  {event.type === 'social' && '🎉 '}
                                  {event.type === 'work' && '💼 '}
                                  {event.type === 'personal' && '👤 '}
                                  {event.type === 'household' && '🏠 '}
                                  {event.type}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}