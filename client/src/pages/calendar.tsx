import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Calendar() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  // Simple calendar grid for current month
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ios-gray">
        <div className="w-8 h-8 border-2 border-ios-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="h-6 bg-surface-elevated"></div>
      
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-large-title font-bold text-primary">Calendar</h1>
            <p className="text-subhead text-secondary mt-2">
              {monthNames[currentMonth]} {currentYear}
            </p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-ios-blue hover:bg-ios-blue/90 text-white rounded-full px-4 py-2">
                +
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Event title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
                <Input
                  type="date"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                />
                <Input
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                />
                <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                  <SelectTrigger>
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
      
      <div className="page-content space-y-6">
        {/* Mini Calendar */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="text-center text-ios-caption text-ios-gray-5 font-medium">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => (
                <div key={index} className="text-center text-ios-subhead h-8 flex items-center justify-center relative">
                  {day ? (
                    <>
                      <span className={day === today.getDate() ? 
                        "bg-ios-blue text-white rounded-full w-6 h-6 flex items-center justify-center text-ios-caption" : 
                        "text-black"
                      }>
                        {day}
                      </span>
                      {events.some((event: any) => 
                        new Date(event.startDate).getDate() === day &&
                        new Date(event.startDate).getMonth() === currentMonth
                      ) && (
                        <div className="w-1 h-1 bg-ios-blue rounded-full absolute bottom-0"></div>
                      )}
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="card-shadow">
          <CardContent className="p-4">
            <h2 className="text-ios-headline font-semibold text-black mb-4">Upcoming Events</h2>
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-ios-body text-ios-gray-5">No upcoming events</p>
              ) : (
                events.map((event: any) => (
                  <div key={event.id} className="flex items-center space-x-3 py-2">
                    <div 
                      className="w-3 h-8 rounded-full" 
                      style={{ backgroundColor: event.color }}
                    ></div>
                    <div className="flex-1">
                      <p className="text-ios-body font-medium text-black">{event.title}</p>
                      <p className="text-ios-footnote text-ios-gray-5">
                        {new Date(event.startDate).toLocaleDateString()} • {new Date(event.startDate).toLocaleTimeString()}
                      </p>
                      {event.description && (
                        <p className="text-ios-footnote text-ios-gray-5 mt-1">{event.description}</p>
                      )}
                    </div>
                    <span className="text-ios-caption text-ios-gray-5 capitalize">{event.type}</span>
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
