import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Bell,
  Repeat,
  FileText,
  Tag,
  Palette,
  CalendarCheck
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import BackButton from "@/components/back-button";

interface NewEvent {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  location: string;
  eventType: string;
  attendees: string[];
  recurrence: string;
  reminder: string;
  color: string;
  notes: string;
}

export function AddEvent() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5);
  
  const [newEvent, setNewEvent] = useState<NewEvent>({
    title: "",
    description: "",
    startDate: today,
    startTime: currentTime,
    endDate: today,
    endTime: "",
    allDay: false,
    location: "",
    eventType: "meeting",
    attendees: [],
    recurrence: "none",
    reminder: "15min",
    color: "#3B82F6",
    notes: ""
  });

  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Calculate end time (1 hour after start time) when start time changes
    if (newEvent.startTime && !newEvent.endTime) {
      const [hours, minutes] = newEvent.startTime.split(':').map(Number);
      const endHours = (hours + 1) % 24;
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      setNewEvent(prev => ({ ...prev, endTime }));
    }
  }, [newEvent.startTime]);

  const { data: household } = useQuery({
    queryKey: ["/api/households/current"],
  });

  const householdMembers = (household as any)?.members || [];

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return apiRequest("/api/calendar", {
        method: "POST",
        body: JSON.stringify(eventData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      navigate("/calendar");
    },
  });

  const handleCreateEvent = () => {
    if (!canCreateEvent) return;

    const startDateTime = newEvent.allDay 
      ? `${newEvent.startDate}T00:00:00`
      : `${newEvent.startDate}T${newEvent.startTime}:00`;
    
    const endDateTime = newEvent.allDay
      ? `${newEvent.endDate}T23:59:59`
      : newEvent.endTime 
        ? `${newEvent.endDate}T${newEvent.endTime}:00`
        : new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

    const eventData = {
      title: newEvent.title.trim(),
      description: newEvent.description.trim(),
      startDate: startDateTime,
      endDate: endDateTime,
      eventType: newEvent.eventType,
      allDay: newEvent.allDay,
      location: newEvent.location.trim(),
      recurrence: newEvent.recurrence === 'none' ? null : newEvent.recurrence,
      reminder: newEvent.reminder,
      color: newEvent.color,
      attendees: newEvent.attendees,
      notes: newEvent.notes.trim()
    };

    createEventMutation.mutate(eventData);
  };

  const canCreateEvent = newEvent.title.trim().length > 0;

  const eventTypes = [
    { value: "meeting", label: "👥 Meeting", color: "#3B82F6" },
    { value: "appointment", label: "📋 Appointment", color: "#10B981" },
    { value: "social", label: "🎉 Social", color: "#F59E0B" },
    { value: "deadline", label: "⏰ Deadline", color: "#EF4444" },
    { value: "birthday", label: "🎂 Birthday", color: "#EC4899" },
    { value: "holiday", label: "🎊 Holiday", color: "#8B5CF6" },
    { value: "travel", label: "✈️ Travel", color: "#6366F1" },
    { value: "workout", label: "💪 Workout", color: "#14B8A6" },
    { value: "study", label: "📚 Study", color: "#F97316" },
    { value: "other", label: "📌 Other", color: "#6B7280" }
  ];

  const colorOptions = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#EC4899", // Pink
    "#8B5CF6", // Purple
    "#6366F1", // Indigo
    "#14B8A6", // Teal
    "#F97316", // Orange
    "#6B7280"  // Gray
  ];

  return (
    <div className="page-container page-transition">
      {/* visionOS Header */}
      <div className={`floating-header ${headerScrolled ? 'scrolled' : ''}`}>
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BackButton to="/calendar" />
              <div>
                <h1 className="page-title">Add Event</h1>
                <p className="page-subtitle">Create a new calendar event</p>
              </div>
            </div>
            <button
              onClick={handleCreateEvent}
              disabled={!canCreateEvent || createEventMutation.isPending}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                canCreateEvent && !createEventMutation.isPending
                  ? 'btn-animated text-white shadow-lg hover:scale-[1.05]'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              style={{ 
                background: canCreateEvent && !createEventMutation.isPending ? 'var(--primary)' : 'var(--surface-secondary)',
                color: canCreateEvent && !createEventMutation.isPending ? 'white' : 'var(--text-secondary)'
              }}
            >
              {createEventMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>

      <div className="content-with-header px-6 space-y-6">
        
        {/* Basic Details */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: newEvent.color }}>
                <Calendar size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Event Details</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>What's happening?</p>
              </div>
            </div>

            <input
              placeholder="Event title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="w-full h-14 px-4 rounded-xl text-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              style={{ 
                background: 'var(--surface-secondary)', 
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />

            <Textarea
              placeholder="Add description (optional)"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              className="w-full min-h-[100px] p-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              style={{ 
                background: 'var(--surface-secondary)', 
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />

            <Select
              value={newEvent.eventType}
              onValueChange={(value) => {
                const type = eventTypes.find(t => t.value === value);
                setNewEvent({ 
                  ...newEvent, 
                  eventType: value,
                  color: type?.color || newEvent.color
                });
              }}
            >
              <SelectTrigger className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20" style={{
                background: 'var(--surface-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Clock size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Date & Time</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>When is the event?</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-xl" style={{
              background: 'var(--surface-secondary)',
              border: '1px solid var(--border-color)'
            }}>
              <Switch
                checked={newEvent.allDay}
                onCheckedChange={(checked) => setNewEvent({ ...newEvent, allDay: checked })}
              />
              <Label style={{ color: 'var(--text-primary)' }}>All-day event</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={newEvent.startDate}
                  onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                  className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  style={{ 
                    background: 'var(--surface-secondary)', 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '16px'
                  }}
                />
              </div>

              {!newEvent.allDay && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    style={{ 
                      background: 'var(--surface-secondary)', 
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '16px'
                    }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={newEvent.endDate}
                  onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                  className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  style={{ 
                    background: 'var(--surface-secondary)', 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '16px'
                  }}
                />
              </div>

              {!newEvent.allDay && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    style={{ 
                      background: 'var(--surface-secondary)', 
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '16px'
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Recurrence
              </label>
              <Select
                value={newEvent.recurrence}
                onValueChange={(value) => setNewEvent({ ...newEvent, recurrence: value })}
              >
                <SelectTrigger className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20" style={{
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                <MapPin size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Location</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Where is the event?</p>
              </div>
            </div>

            <Input
              placeholder="Add location (optional)"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              className="w-full h-14 px-4 rounded-xl"
              style={{ fontSize: '16px' }}
            />
          </CardContent>
        </Card>

        {/* Attendees */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Attendees</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Who's attending?</p>
              </div>
            </div>

            <div className="space-y-3">
              {householdMembers.map((member: any) => (
                <label 
                  key={member.userId}
                  className="flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                  style={{
                    background: newEvent.attendees.includes(member.userId) 
                      ? 'var(--primary-light)' 
                      : 'var(--surface-secondary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newEvent.attendees.includes(member.userId)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewEvent({
                          ...newEvent,
                          attendees: [...newEvent.attendees, member.userId]
                        });
                      } else {
                        setNewEvent({
                          ...newEvent,
                          attendees: newEvent.attendees.filter(id => id !== member.userId)
                        });
                      }
                    }}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span style={{ color: 'var(--text-primary)' }}>
                    {member.user.firstName || member.user.email?.split('@')[0]}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reminders & Color */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                <Bell size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications & Style</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Set reminders and appearance</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Reminder
              </label>
              <Select
                value={newEvent.reminder}
                onValueChange={(value) => setNewEvent({ ...newEvent, reminder: value })}
              >
                <SelectTrigger className="w-full h-14 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20" style={{
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No reminder</SelectItem>
                  <SelectItem value="5min">5 minutes before</SelectItem>
                  <SelectItem value="15min">15 minutes before</SelectItem>
                  <SelectItem value="30min">30 minutes before</SelectItem>
                  <SelectItem value="1hour">1 hour before</SelectItem>
                  <SelectItem value="2hours">2 hours before</SelectItem>
                  <SelectItem value="1day">1 day before</SelectItem>
                  <SelectItem value="1week">1 week before</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Event Color
              </label>
              <div className="flex flex-wrap gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewEvent({ ...newEvent, color })}
                    className="w-12 h-12 rounded-xl transition-all"
                    style={{
                      backgroundColor: color,
                      transform: newEvent.color === color ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: newEvent.color === color 
                        ? `0 0 0 3px var(--primary), 0 4px 12px ${color}40`
                        : '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Notes</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Additional information</p>
              </div>
            </div>

            <Textarea
              placeholder="Add notes, agenda items, or links..."
              value={newEvent.notes}
              onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
              className="w-full min-h-[120px] p-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              style={{ 
                background: 'var(--surface-secondary)', 
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}