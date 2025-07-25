import { useState } from "react";
import { Calendar, Clock, MapPin, Users, Repeat, Bell, Trash2, ChevronDown, Circle, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDisplayName, getProfileInitials } from "@/lib/nameUtils";
import { QuickAvatar } from "@/components/ProfileAvatar";
import { useQuery } from "@tanstack/react-query";

interface CalendarEventCardProps {
  event: any;
  onDelete?: (id: string) => void;
  index?: number;
}

export default function CalendarEventCard({ event, onDelete, index = 0 }: CalendarEventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Fetch household members for attendee info
  const { data: householdMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/households/current/members"],
    enabled: event.attendees && event.attendees.length > 0
  });
  
  const getEventTypeConfig = (type: string) => {
    const configs: { [key: string]: { color: string; bg: string; darkBg: string } } = {
      meeting: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', darkBg: 'rgba(59, 130, 246, 0.15)' },
      social: { color: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)', darkBg: 'rgba(236, 72, 153, 0.15)' },
      task: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', darkBg: 'rgba(16, 185, 129, 0.15)' },
      reminder: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', darkBg: 'rgba(245, 158, 11, 0.15)' },
      birthday: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', darkBg: 'rgba(139, 92, 246, 0.15)' },
      other: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.08)', darkBg: 'rgba(107, 114, 128, 0.15)' }
    };
    
    return configs[event.eventType?.toLowerCase()] || configs.other;
  };

  const eventConfig = getEventTypeConfig(event.eventType);
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDateRange = () => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    
    if (event.allDay) {
      // Check if multi-day event
      if (start.toDateString() !== end.toDateString()) {
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
      return 'All day';
    }
    
    // Same day event
    if (start.toDateString() === end.toDateString()) {
      return `${formatTime(event.startDate)} - ${formatTime(event.endDate)}`;
    }
    
    // Multi-day event with times
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${formatTime(event.startDate)} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${formatTime(event.endDate)}`;
  };

  const getAttendeeCount = () => {
    const attendees = event.attendees || [];
    return attendees.length;
  };

  const getEventEmoji = (type: string) => {
    const emojis: { [key: string]: string } = {
      meeting: '💼',
      social: '🎉',
      task: '✅',
      reminder: '⏰',
      birthday: '🎂',
      other: '📅'
    };
    return emojis[type?.toLowerCase()] || '📅';
  };

  return (
    <Card 
      className={`
        glass-card relative overflow-hidden transition-all duration-300 cursor-pointer animate-fade-in
        ${isExpanded ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
      `}
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        animationDelay: `${index * 50}ms`
      }}
    >
      {/* Event type accent */}
      <div 
        className="absolute top-0 left-0 w-1 h-full"
        style={{ background: eventConfig.color }}
      />
      
      <CardContent className="p-4 pl-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1">
            {/* Event type indicator */}
            <div 
              className="p-2 rounded-xl flex-shrink-0 mt-0.5"
              style={{
                background: eventConfig.bg,
                color: eventConfig.color
              }}
            >
              <span className="text-lg">{getEventEmoji(event.eventType)}</span>
            </div>
            
            {/* Event info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                {event.title}
              </h3>
              
              {/* Time/Date */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <Clock size={12} />
                <span className="font-medium">{formatDateRange()}</span>
                {event.allDay && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    All Day
                  </span>
                )}
              </div>
              
              {/* Quick info */}
              <div className="flex items-center gap-3 mt-1.5 text-xs">
                {event.location && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <MapPin size={12} />
                    <span className="truncate max-w-[120px]">{event.location}</span>
                  </div>
                )}
                
                {getAttendeeCount() > 0 && (
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                    <Users size={12} />
                    <span>{getAttendeeCount()} {getAttendeeCount() === 1 ? 'person' : 'people'}</span>
                  </div>
                )}
                
                {event.recurrence && event.recurrence !== 'none' && (
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <Repeat size={12} />
                    <span className="capitalize">{event.recurrence}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Event type badge */}
          <div 
            className="px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{
              color: eventConfig.color,
              background: eventConfig.bg
            }}
          >
            {event.eventType}
          </div>
        </div>
        
        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50 animate-fade-in ml-11">
            {/* Location */}
            {event.location && event.location.trim() !== '' && (
              <div className="mb-3">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin size={12} />
                  Location
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {event.location}
                </p>
              </div>
            )}
            
            {/* Description */}
            {event.description && event.description.trim() !== '' && (
              <div className="mb-3">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}
            
            {/* Notes */}
            {event.notes && event.notes.trim() !== '' && (
              <div className="mb-3">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText size={12} />
                  Notes
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                  {event.notes}
                </p>
              </div>
            )}
            
            {/* Attendees */}
            {event.attendees && Array.isArray(event.attendees) && event.attendees.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Users size={12} />
                  Attendees ({event.attendees.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {event.attendees.map((attendeeId: string, idx: number) => {
                    // Find the attendee's user info from household members
                    const memberInfo = householdMembers.find((member: any) => member.userId === attendeeId);
                    const user = memberInfo?.user || {};
                    const displayName = formatDisplayName(user.firstName, user.lastName, user.email?.split('@')[0] || 'Unknown');
                    
                    return (
                      <div 
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800/50"
                      >
                        <QuickAvatar 
                          user={user}
                          size="sm"
                          gradientType={user.profileColor || 'blue'}
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {displayName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Additional info */}
            <div className="space-y-2 text-xs">
              {/* Event details grid */}
              <div className="grid grid-cols-2 gap-3">
                {event.startDate && event.endDate && event.startDate !== event.endDate && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Duration</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                )}
                
                {event.reminder && event.reminder !== 'none' && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Reminder</span>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      <Bell size={12} className="text-orange-500" />
                      {event.reminder === '5min' ? '5 minutes' :
                       event.reminder === '15min' ? '15 minutes' :
                       event.reminder === '30min' ? '30 minutes' :
                       event.reminder === '1hour' ? '1 hour' :
                       event.reminder === '2hours' ? '2 hours' :
                       event.reminder === '1day' ? '1 day' :
                       event.reminder === '1week' ? '1 week' :
                       event.reminder} before
                    </p>
                  </div>
                )}
              </div>
              
              {event.color && (
                <div className="flex items-center gap-2 pt-2">
                  <Circle size={16} fill={event.color} color={event.color} />
                  <span className="text-gray-600 dark:text-gray-400">Event color</span>
                </div>
              )}
            </div>
            
            {/* Actions */}
            {onDelete && (
              <div className="flex justify-end mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(event.id);
                  }}
                  className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}