import { useState, useMemo } from "react";
import { Clock, Calendar, User, CheckCircle2, Circle, PlayCircle, AlertTriangle, X, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";

interface ChoresBoardProps {
  chores: any[];
  onUpdateChore: (id: string, updates: any) => void;
  onDeleteChore: (id: string) => void;
}

export default function ChoreBoard({ chores, onUpdateChore, onDeleteChore }: ChoresBoardProps) {
  const [expandedChore, setExpandedChore] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  
  // Sort chores by priority and due date
  const sortedChores = useMemo(() => {
    const priorityOrder: { [key: string]: number } = { urgent: 4, high: 3, medium: 2, low: 1 };
    
    return [...chores].sort((a, b) => {
      // Done chores go to the bottom
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      
      // For non-done chores, sort by overdue status, then priority, then due date
      if (a.status !== 'done' && b.status !== 'done') {
        const aOverdue = a.dueDate && new Date(a.dueDate) < new Date();
        const bOverdue = b.dueDate && new Date(b.dueDate) < new Date();
        
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        const aPriority = priorityOrder[a.priority?.toLowerCase()] || 1;
        const bPriority = priorityOrder[b.priority?.toLowerCase()] || 1;
        
        if (aPriority !== bPriority) return bPriority - aPriority;
        
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
      }
      
      return 0;
    });
  }, [chores]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'todo': 
        return { 
          icon: Circle, 
          color: '#6b7280',
          bg: 'rgba(107, 114, 128, 0.08)'
        };
      case 'doing': 
        return { 
          icon: PlayCircle, 
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.08)'
        };
      case 'done': 
        return { 
          icon: CheckCircle2, 
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.08)'
        };
      default: 
        return { 
          icon: Circle, 
          color: '#6b7280',
          bg: 'rgba(107, 114, 128, 0.08)'
        };
    }
  };

  const getPriorityEmoji = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '🟢';
    }
  };

  const getCategoryEmoji = (category: string) => {
    const categories: { [key: string]: string } = {
      general: '🏠',
      kitchen: '🍳',
      bathroom: '🚿',
      bedroom: '🛏️',
      living: '🛋️',
      outdoor: '🌿',
      laundry: '👔',
      maintenance: '🔧',
      shopping: '🛒',
      finance: '💰'
    };
    return categories[category?.toLowerCase()] || '🏠';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const ChoreCard = ({ chore }: { chore: any }) => {
    const isExpanded = expandedChore === chore.id;
    const isOverdue = chore.dueDate && new Date(chore.dueDate) < new Date() && chore.status !== 'done';
    const statusConfig = getStatusConfig(chore.status);
    const StatusIcon = statusConfig.icon;
    
    return (
      <div 
        className={`
          relative overflow-hidden transition-all duration-300 cursor-pointer
          ${isExpanded ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
        `}
        onClick={() => setExpandedChore(isExpanded ? null : chore.id)}
        style={{
          borderRadius: '20px',
          background: 'var(--glass-card)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
        }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 flex-1">
              {/* Status icon button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextStatus = chore.status === 'todo' ? 'doing' : chore.status === 'doing' ? 'done' : 'todo';
                  onUpdateChore(chore.id, { status: nextStatus });
                }}
                className="p-2 rounded-xl flex-shrink-0 transition-all hover:scale-105 active:scale-95"
                style={{
                  background: statusConfig.bg,
                  color: statusConfig.color
                }}
              >
                <StatusIcon size={20} />
              </button>
              
              {/* Chore info */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold ${chore.status === 'done' ? 'line-through' : ''}`} style={{
                  color: chore.status === 'done' ? 'var(--text-secondary)' : 'var(--text-primary)'
                }}>
                  {chore.title}
                </h3>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{chore.assignedUser?.firstName || 'Unassigned'}</span>
                  </div>
                  {chore.dueDate && (
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                      <Calendar size={12} />
                      <span>{formatDate(chore.dueDate)}</span>
                    </div>
                  )}
                  {chore.estimatedDuration && (
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{chore.estimatedDuration}m</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Priority and category */}
            <div className="flex items-center gap-2">
              <span className="text-lg">{getCategoryEmoji(chore.category)}</span>
              <span className="text-base">{getPriorityEmoji(chore.priority)}</span>
            </div>
          </div>
          
          {/* Quick action buttons for non-expanded state */}
          {!isExpanded && chore.status !== 'done' && (
            <div className="ml-11 flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextStatus = chore.status === 'todo' ? 'doing' : 'done';
                  onUpdateChore(chore.id, { status: nextStatus });
                }}
                className="px-3 py-1 rounded-lg text-xs font-medium text-white transition-all hover:scale-105 active:scale-95"
                style={{ background: chore.status === 'todo' ? '#3b82f6' : '#10b981' }}
              >
                {chore.status === 'todo' ? 'Start' : 'Complete'}
              </button>
            </div>
          )}
          
          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 animate-fade-in">
              {chore.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                  {chore.description}
                </p>
              )}
              
              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                {chore.category && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Category</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getCategoryEmoji(chore.category)} {chore.category.charAt(0).toUpperCase() + chore.category.slice(1)}
                    </p>
                  </div>
                )}
                
                {chore.priority && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Priority</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getPriorityEmoji(chore.priority)} {chore.priority.charAt(0).toUpperCase() + chore.priority.slice(1)}
                    </p>
                  </div>
                )}
                
                {chore.recurrence && chore.recurrence !== 'none' && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Recurrence</span>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{chore.recurrence}</p>
                  </div>
                )}
                
                {chore.reminder && chore.reminder !== 'none' && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Reminder</span>
                    <p className="font-medium text-gray-900 dark:text-white">{chore.reminder}</p>
                  </div>
                )}
              </div>
              
              {/* Subtasks */}
              {chore.subtasks && chore.subtasks.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Subtasks
                  </h4>
                  <div className="space-y-1">
                    {chore.subtasks.map((subtask: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Circle size={12} />
                        <span>{subtask}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {chore.notes && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Notes
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{chore.notes}</p>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex items-center justify-between">
                {chore.status !== 'done' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextStatus = chore.status === 'todo' ? 'doing' : 'done';
                      onUpdateChore(chore.id, { status: nextStatus });
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:scale-105 active:scale-95"
                    style={{ background: chore.status === 'todo' ? '#3b82f6' : '#10b981' }}
                  >
                    {chore.status === 'todo' ? 'Start Task' : 'Mark Complete'}
                  </button>
                )}
                
                {chore.status === 'done' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateChore(chore.id, { status: 'todo' });
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-500 text-white hover:bg-gray-600 transition-all hover:scale-105 active:scale-95"
                  >
                    Reopen
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChore(chore.id);
                  }}
                  className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (sortedChores.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={28} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No chores yet</h4>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Start tracking household tasks and responsibilities</p>
        <button
          onClick={() => setLocation("/add-chore")}
          className="px-6 py-3 rounded-xl font-medium btn-animated text-white hover:scale-[1.05] transition-all"
          style={{ background: 'var(--primary)' }}
        >
          Add First Chore
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedChores.map((chore) => (
        <ChoreCard key={chore.id} chore={chore} />
      ))}
    </div>
  );
}