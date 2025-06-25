import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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
    color: '#3B82F6',
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
        color: '#3B82F6',
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
    if (!canCreateEvent) return;
    
    const startDateTime = new Date(newEvent.startDate);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour later
    
    const eventData = {
      title: newEvent.title,
      description: newEvent.description || '',
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      color: newEvent.color || '#3B82F6',
      type: 'personal'
    };
    
    createEventMutation.mutate(eventData);
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
                <button className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg btn-animated">
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
                    <label className="text-sm font-semibold text-gray-700">Event Title *</label>
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
                    <label className="text-sm font-semibold text-gray-700">Description</label>
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
                      <label className="text-sm font-semibold text-gray-700">Start Time</label>
                      <input
                        type="datetime-local"
                        value={newEvent.startDate}
                        onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">End Time</label>
                      <input
                        type="datetime-local"
                        value={newEvent.endDate}
                        onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                <div className="flex justify-end space-x-3 pt-[0px] pb-[0px] pl-[12px] pr-[12px] mt-[12px] mb-[12px]">
                  <button 
                    onClick={() => setIsCreateOpen(false)}
                    className="px-6 py-3 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors btn-animated"
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
      <div className="px-6 mb-6">
        <div className="smart-card p-6 animate-fade-in pl-[3px] pr-[3px]">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mt-[16px] mb-[16px] ml-[4px] mr-[4px]">
            <button
              onClick={() => navigateMonth('prev')}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center btn-animated"
            >
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center btn-animated"
            >
              <ChevronRight size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 ml-[6px] mr-[6px]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-bold text-gray-500 py-3">
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
                        ? 'bg-blue-50 text-primary font-semibold border border-primary'
                        : hasEvents
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
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
              <h3 className="text-xl font-bold text-gray-900">
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
                <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon size={28} className="text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No events scheduled</h4>
                <p className="text-gray-600 mb-6">This day is completely free</p>
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
                    className="bg-gray-50 rounded-2xl p-5 border border-gray-200 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start space-x-4">
                      <div 
                        className="w-4 h-16 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.color || '#007AFF' }}
                      ></div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg mb-2">{event.title}</h4>
                        {event.description && (
                          <p className="text-gray-700 mb-3">{event.description}</p>
                        )}
                        <div className="flex items-start flex-wrap gap-2">
                          <div className="bg-white px-3 py-2 rounded-xl shadow-sm">
                            <span className="text-gray-800 font-semibold text-sm">
                              {new Date(event.startDate).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="bg-gray-100 px-3 py-2 rounded-xl">
                            <span className="text-gray-700 font-semibold text-sm">
                              {event.creator?.firstName || 'Unknown'}
                            </span>
                          </div>
                          {event.type && (
                            <div className="bg-blue-50 text-primary px-3 py-2 rounded-xl">
                              <span className="capitalize font-semibold text-sm">
                                {event.type}
                              </span>
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