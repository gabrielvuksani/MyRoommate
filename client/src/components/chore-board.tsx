import { useState, useMemo } from "react";
import { Clock, Calendar, User, CheckCircle2, Circle, PlayCircle, AlertTriangle, Flame, Target, Sparkles, Timer, X, ChevronDown, ChevronUp } from "lucide-react";

interface ChoresBoardProps {
  chores: any[];
  onUpdateChore: (id: string, updates: any) => void;
  onDeleteChore: (id: string) => void;
}

export default function ChoreBoard({ chores, onUpdateChore, onDeleteChore }: ChoresBoardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('todo');
  const [selectedChore, setSelectedChore] = useState<string | null>(null);
  
  // Enhanced sorting with multiple criteria
  const sortChoresByPriority = (choreList: any[]) => {
    const priorityOrder: { [key: string]: number } = { urgent: 4, high: 3, medium: 2, low: 1 };
    return choreList.sort((a, b) => {
      // First by overdue status
      const aOverdue = a.dueDate && new Date(a.dueDate) < new Date() && a.status !== 'done';
      const bOverdue = b.dueDate && new Date(b.dueDate) < new Date() && b.status !== 'done';
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      // Then by priority
      const aPriority = priorityOrder[a.priority?.toLowerCase()] || 1;
      const bPriority = priorityOrder[b.priority?.toLowerCase()] || 1;
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      // Finally by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      return 0;
    });
  };

  const todoChores = useMemo(() => sortChoresByPriority(chores.filter(chore => chore.status === 'todo' || !chore.status)), [chores]);
  const doingChores = useMemo(() => sortChoresByPriority(chores.filter(chore => chore.status === 'doing')), [chores]);
  const doneChores = useMemo(() => chores.filter(chore => chore.status === 'done').slice(0, 5), [chores]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'todo': 
        return { 
          icon: Circle, 
          label: 'To Do',
          color: '#9ca3af',
          bg: 'rgba(156, 163, 175, 0.1)'
        };
      case 'doing': 
        return { 
          icon: PlayCircle, 
          label: 'In Progress',
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.1)'
        };
      case 'done': 
        return { 
          icon: CheckCircle2, 
          label: 'Completed',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.1)'
        };
      default: 
        return { 
          icon: Circle, 
          label: 'To Do',
          color: '#9ca3af',
          bg: 'rgba(156, 163, 175, 0.1)'
        };
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return {
          icon: AlertTriangle,
          label: 'Urgent',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.08)'
        };
      case 'high':
        return {
          icon: Flame,
          label: 'High',
          color: '#f97316',
          bg: 'rgba(249, 115, 22, 0.08)'
        };
      case 'medium':
        return {
          icon: Target,
          label: 'Medium',
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.08)'
        };
      case 'low':
        return {
          icon: Sparkles,
          label: 'Low',
          color: '#6b7280',
          bg: 'rgba(107, 114, 128, 0.08)'
        };
      default:
        return {
          icon: Sparkles,
          label: 'Low',
          color: '#6b7280',
          bg: 'rgba(107, 114, 128, 0.08)'
        };
    }
  };

  const getCategoryEmoji = (category: string) => {
    const categories: { [key: string]: string } = {
      cleaning: '✨',
      cooking: '🍳',
      maintenance: '🔧',
      shopping: '🛍️',
      finance: '💰',
      laundry: '👔',
      organizing: '📦',
      outdoor: '🌿',
      pet: '🐾',
      general: '📌'
    };
    return categories[category?.toLowerCase()] || '📌';
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const ChoreCard = ({ chore }: { chore: any }) => {
    const isOverdue = chore.dueDate && new Date(chore.dueDate) < new Date() && chore.status !== 'done';
    const isSelected = selectedChore === chore.id;
    const statusConfig = getStatusConfig(chore.status);
    const priorityConfig = getPriorityConfig(chore.priority);
    const StatusIcon = statusConfig.icon;
    const PriorityIcon = priorityConfig.icon;
    
    const progress = chore.subtasks?.length > 0 
      ? (chore.subtasks.filter((st: any) => st.completed).length / chore.subtasks.length) * 100
      : chore.status === 'done' ? 100 : chore.status === 'doing' ? 50 : 0;
    
    return (
      <div 
        className={`
          relative overflow-hidden transition-all duration-300 cursor-pointer active:scale-[0.99]
          ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
        `}
        onClick={() => setSelectedChore(isSelected ? null : chore.id)}
        style={{
          borderRadius: '20px',
          background: isOverdue 
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, transparent 100%), var(--glass-card)'
            : 'var(--glass-card)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Priority accent line */}
        <div 
          className="absolute top-0 left-0 w-full h-0.5"
          style={{ background: priorityConfig.color }}
        />
        
        {/* Progress bar */}
        {progress > 0 && progress < 100 && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700">
            <div 
              className="h-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: statusConfig.color
              }}
            />
          </div>
        )}
        
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-start gap-3 flex-1">
              {/* Status button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextStatus = chore.status === 'todo' ? 'doing' : chore.status === 'doing' ? 'done' : 'todo';
                  onUpdateChore(chore.id, { status: nextStatus });
                }}
                className="mt-0.5 p-1.5 -m-1.5 rounded-lg transition-all hover:scale-110 active:scale-95"
                style={{
                  color: statusConfig.color,
                  background: statusConfig.bg
                }}
              >
                <StatusIcon size={18} />
              </button>
              
              <div className="flex-1 min-w-0">
                <h3 className={`
                  text-sm font-semibold leading-tight transition-all
                  ${chore.status === 'done' ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}
                `}>
                  {chore.title}
                </h3>
                
                {chore.description && !isSelected && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                    {chore.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Priority indicator */}
            <div 
              className="p-1.5 rounded-lg"
              style={{
                color: priorityConfig.color,
                background: priorityConfig.bg
              }}
            >
              <PriorityIcon size={14} />
            </div>
          </div>
          
          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 ml-9">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{getCategoryEmoji(chore.category)}</span>
              <span>{chore.assignedUser?.firstName || 'Unassigned'}</span>
            </div>
            
            {chore.dueDate && (
              <div className={`flex items-center gap-1 ${
                isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''
              }`}>
                <Calendar size={12} />
                <span>{formatDueDate(chore.dueDate)}</span>
              </div>
            )}
            
            {chore.estimatedDuration && (
              <div className="flex items-center gap-1">
                <Timer size={12} />
                <span>{chore.estimatedDuration}m</span>
              </div>
            )}
          </div>
          
          {/* Expanded content */}
          {isSelected && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700/50 animate-fade-in space-y-3 ml-9">
              {chore.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {chore.description}
                </p>
              )}
              
              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextStatus = chore.status === 'todo' ? 'doing' : chore.status === 'doing' ? 'done' : 'todo';
                    onUpdateChore(chore.id, { status: nextStatus });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:scale-105 active:scale-95"
                  style={{ background: statusConfig.color }}
                >
                  {chore.status === 'todo' ? 'Start' : chore.status === 'doing' ? 'Complete' : 'Reopen'}
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChore(chore.id);
                  }}
                  className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ title, count, status, chores }: { title: string; count: number; status: string; chores: any[] }) => {
    const isExpanded = expandedSection === status;
    const statusConfig = getStatusConfig(status);
    const Icon = statusConfig.icon;
    
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        <button
          onClick={() => setExpandedSection(isExpanded ? null : status)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-xl"
              style={{
                color: statusConfig.color,
                background: statusConfig.bg
              }}
            >
              <Icon size={20} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{count} {count === 1 ? 'task' : 'tasks'}</p>
            </div>
          </div>
          {count > 0 && (
            <div className="text-gray-400">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          )}
        </button>
        
        {isExpanded && count > 0 && (
          <div className="px-4 pb-4 space-y-3 animate-fade-in">
            {chores.map((chore) => (
              <ChoreCard key={chore.id} chore={chore} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Section title="To Do" count={todoChores.length} status="todo" chores={todoChores} />
      <Section title="In Progress" count={doingChores.length} status="doing" chores={doingChores} />
      {doneChores.length > 0 && (
        <Section title="Recently Completed" count={doneChores.length} status="done" chores={doneChores} />
      )}
    </div>
  );
}