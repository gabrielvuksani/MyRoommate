import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";

export default function Calendar() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    color: '#007AFF',
    type: 'social',
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      setIsCreateOpen(false);
      setNewEvent({
        title: '',
        description: '',
        startDate: '',
        startTime: '',
        color: '#007AFF',
        type: 'social',
      });
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const handleCreateEvent = () => {
    if (!newEvent.title.trim() || !newEvent.startDate) return;
    
    const startDateTime = new Date(`${newEvent.startDate}T${newEvent.startTime || '00:00'}`);
    
    createEventMutation.mutate({
      ...newEvent,
      startDate: startDateTime.toISOString(),
    });
  };

  const canCreateEvent = newEvent.title.trim().length > 0 && newEvent.startDate.trim().length > 0;

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
    return events.filter((event: any) => {
      const eventDate = new Date(event.startDate);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === currentMonth && 
             eventDate.getFullYear() === currentYear;
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="page-container animate-page-enter">
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
                <button className="w-12 h-12 bg-gradient-to-br from-accent to-accent-hover rounded-2xl flex items-center justify-center shadow-lg btn-animated">
                  <Plus size={24} className="text-white" />
                </button>
              </DialogTrigger>
              <DialogContent className="smart-card max-w-md mx-auto border-0 shadow-2xl">
                <DialogHeader className="pb-6">
                  <DialogTitle className="text-2xl font-bold text-gray-900">Create Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title</label>
                    <input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-base font-medium focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all focus:outline-none"
                      placeholder="Enter event title..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <input
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-base font-medium focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all focus:outline-none"
                      placeholder="Event description..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={newEvent.startDate}
                        onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-base font-medium focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                      <input
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-base font-medium focus:ring-2 focus:ring-accent/20 focus:bg-white transition-all focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type</label>
                    <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                      <SelectTrigger className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-base font-medium focus:ring-2 focus:ring-accent/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-0 shadow-lg">
                        <SelectItem value="social">🎉 Social</SelectItem>
                        <SelectItem value="work">💼 Work</SelectItem>
                        <SelectItem value="personal">👤 Personal</SelectItem>
                        <SelectItem value="household">🏠 Household</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={newEvent.color}
                        onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                        className="w-16 h-12 bg-gray-50 border-0 rounded-xl cursor-pointer"
                      />
                      <span className="text-gray-600 font-medium">Choose event color</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-6">
                  <button 
                    onClick={() => setIsCreateOpen(false)}
                    className="px-6 py-3 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors btn-animated"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateEvent} 
                    disabled={!canCreateEvent || createEventMutation.isPending}
                    className="bg-accent text-white px-6 py-3 rounded-xl font-bold shadow-lg btn-animated disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
      {/* Premium Calendar Section */}
      <div className="px-6 space-y-6">
        {/* Calendar Card */}
        <div className="smart-card p-8 animate-fade-in">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigateMonth('prev')}
              className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center btn-animated shadow-sm hover:shadow-md transition-all"
            >
              <ChevronLeft size={22} className="text-gray-700" />
            </button>
            
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-1">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <p className="text-gray-500 text-sm font-medium">Tap a day to view events</p>
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center btn-animated shadow-sm hover:shadow-md transition-all"
            >
              <ChevronRight size={22} className="text-gray-700" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center py-4">
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                    {day}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-3">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-16"></div>;
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
                    className={`h-16 rounded-2xl text-center font-semibold transition-all duration-300 relative btn-animated shadow-sm hover:shadow-lg transform hover:scale-105 ${
                      isSelected 
                        ? 'bg-gradient-to-br from-accent to-accent-hover text-white shadow-lg scale-105' 
                        : isToday
                        ? 'bg-gradient-to-br from-accent-light to-accent/20 text-accent border-2 border-accent/30'
                        : hasEvents
                        ? 'bg-gradient-to-br from-orange-light to-orange/20 text-orange border border-orange/30'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ 
                      animationDelay: `${index * 20}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    <span className="relative z-10 text-lg">{day}</span>
                    {hasEvents && !isSelected && (
                      <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange rounded-full shadow-sm animate-pulse"></div>
                    )}
                    {isToday && !isSelected && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-accent rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Events - Animated Slide In */}
      {selectedDate && (
        <div className="px-6 pb-12 animate-slide-up" key={selectedDate.toDateString()}>
          <div className="smart-card p-8 shadow-2xl animate-scale-in" style={{ animationDelay: '300ms' }}>
            {/* Event Section Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedDate.toDateString() === new Date().toDateString() ? 'Today\'s Events' : 
                   selectedDate.toLocaleDateString('en-US', { 
                     weekday: 'long',
                     month: 'long', 
                     day: 'numeric',
                     year: 'numeric'
                   })}
                </h3>
                <p className="text-gray-500 font-medium">
                  {getDayEvents(selectedDate.getDate()).length} event{getDayEvents(selectedDate.getDate()).length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
              <button
                onClick={() => {
                  const dateString = selectedDate.toISOString().split('T')[0];
                  setNewEvent(prev => ({ ...prev, startDate: dateString }));
                  setIsCreateOpen(true);
                }}
                className="bg-gradient-to-br from-accent to-accent-hover text-white px-6 py-3 rounded-2xl font-bold shadow-lg btn-animated hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Add Event
              </button>
            </div>
            
            {getDayEvents(selectedDate.getDate()).length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-20 h-20 bg-gradient-to-br from-orange to-orange-light rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
                  <CalendarIcon size={32} className="text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">No events scheduled</h4>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">This day is completely free for new activities</p>
                <button 
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-gradient-to-br from-accent to-accent-hover text-white px-8 py-4 rounded-2xl font-bold shadow-xl btn-animated hover:shadow-2xl transform hover:scale-105 transition-all"
                >
                  Create Your First Event
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {getDayEvents(selectedDate.getDate()).map((event: any, index: number) => (
                  <div 
                    key={event.id} 
                    className="bg-gradient-to-r from-white via-gray-50 to-white rounded-3xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-102 animate-slide-up"
                    style={{ 
                      animationDelay: `${400 + (index * 150)}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    <div className="flex items-start space-x-6">
                      <div 
                        className="w-1 h-20 rounded-full flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: event.color || '#007AFF' }}
                      ></div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <h4 className="font-bold text-gray-900 text-xl mb-2 leading-tight">{event.title}</h4>
                          {event.description && (
                            <p className="text-gray-700 font-medium text-lg leading-relaxed">{event.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="bg-gradient-to-br from-white to-gray-100 px-4 py-2.5 rounded-2xl shadow-md border border-gray-200">
                            <span className="text-gray-800 font-bold text-sm">
                              {new Date(event.startDate).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {event.type && (
                            <div className="bg-gradient-to-br from-accent-light to-accent/30 text-accent px-4 py-2.5 rounded-2xl border border-accent/20">
                              <span className="capitalize font-bold text-sm">
                                {event.type}
                              </span>
                            </div>
                          )}
                          <div className="bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-2.5 rounded-2xl">
                            <span className="text-gray-700 font-semibold text-sm">
                              {event.creator?.firstName || 'Unknown'}
                            </span>
                          </div>
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