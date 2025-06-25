import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";

export default function Calendar() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
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
    
    // Pre-fill the form with the selected date
    const dateString = clickedDate.toISOString().split('T')[0];
    setNewEvent(prev => ({ ...prev, startDate: dateString }));
    setIsCreateOpen(true);
  };

  const getDayEvents = (day: number) => {
    return events.filter((event: any) => {
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
    <div className="page-container">
      {/* Clean Modern Header */}
      <div className="floating-header">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="header-content text-4xl font-black tracking-tight">RoomieFlow</h1>
              <p className="text-subhead text-secondary mt-2 font-medium">
                Your shared calendar and events
              </p>
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <button className="btn-floating">
                  <Plus size={22} />
                </button>
              </DialogTrigger>
              <DialogContent className="modal-content">
                <DialogHeader className="px-6 pt-6 pb-2">
                  <DialogTitle className="text-title-2 font-bold text-primary">Create New Event</DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6 space-y-5">
                  <input
                    placeholder="Event title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="input-modern w-full"
                  />
                  <input
                    placeholder="Description (optional)"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="input-modern w-full"
                  />
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="input-modern w-full"
                  />
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="input-modern w-full"
                  />
                  <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                    <SelectTrigger className="input-modern">
                      <SelectValue placeholder="Event type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="utility">Utility</SelectItem>
                      <SelectItem value="chore">Chore</SelectItem>
                      <SelectItem value="bill">Bill</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    onClick={handleCreateEvent}
                    disabled={!canCreateEvent || createEventMutation.isPending}
                    className="btn-primary w-full"
                  >
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
      <div className="page-content space-y-8">
        {/* Interactive Calendar */}
        <Card className="glass-card">
          <CardContent className="p-8">
            {/* Calendar Header with Navigation */}
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => navigateMonth('prev')}
                className="calendar-header-nav"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="text-center">
                <h2 className="text-title-2 font-bold text-primary">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <p className="text-footnote text-secondary mt-1">
                  Tap a day to create an event
                </p>
              </div>
              
              <button 
                onClick={() => navigateMonth('next')}
                className="calendar-header-nav"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-caption text-secondary font-semibold py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="calendar-day opacity-0"></div>;
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
                    className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvents ? 'has-events' : ''}`}
                  >
                    <span className="relative z-10">{day}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Daily Schedule View */}
            {selectedDate && (
              <div className="daily-schedule">
                <h3 className="text-headline font-semibold text-primary mb-3">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                {getDayEvents(selectedDate.getDate()).length === 0 ? (
                  <p className="text-subhead text-secondary">No events scheduled for this day</p>
                ) : (
                  <div className="space-y-2">
                    {getDayEvents(selectedDate.getDate()).map((event: any) => (
                      <div key={event.id} className="flex items-center space-x-3 p-3 bg-surface-secondary rounded-lg">
                        <div className="w-3 h-3 bg-accent rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-body font-medium text-primary">{event.title}</p>
                          <p className="text-caption text-secondary">
                            {new Date(event.startDate).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className="text-caption text-secondary capitalize px-2 py-1 bg-surface rounded">
                          {event.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="glass-card">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <CalendarIcon size={24} className="text-primary mr-3" />
              <h2 className="text-title-2 font-semibold text-primary">Upcoming Events</h2>
            </div>
            
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon size={48} className="text-secondary mx-auto mb-4 opacity-40" />
                  <p className="text-body text-secondary">No upcoming events</p>
                  <p className="text-footnote text-tertiary mt-1">Tap the + button or click on a day to create your first event</p>
                </div>
              ) : (
                events.map((event: any) => (
                  <div key={event.id} className="flex items-start space-x-4 p-4 rounded-2xl bg-surface hover:bg-surface-secondary transition-all duration-300 cursor-pointer group">
                    <div className="w-4 h-16 rounded-full bg-gradient-to-b from-primary to-secondary flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-headline font-semibold text-primary group-hover:text-accent transition-colors">
                        {event.title}
                      </p>
                      <p className="text-subhead text-secondary mt-1">
                        {new Date(event.startDate).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })} at {new Date(event.startDate).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                      {event.description && (
                        <p className="text-footnote text-tertiary mt-2 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-caption font-medium bg-surface text-secondary capitalize">
                        {event.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}