import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, User, Tag, CheckCircle2, Circle, PlayCircle, AlertTriangle, Zap, Pin, FileText, ChevronRight, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";

interface ChoresBoardProps {
  chores: any[];
  onUpdateChore: (id: string, updates: any) => void;
  onDeleteChore: (id: string) => void;
}

export default function ChoreBoard({ chores, onUpdateChore, onDeleteChore }: ChoresBoardProps) {
  const [expandedChore, setExpandedChore] = useState<string | null>(null);
  
  // Sort chores by priority (urgent > high > medium > low) and then by due date
  const sortChoresByPriority = (choreList: any[]) => {
    const priorityOrder: { [key: string]: number } = { urgent: 4, high: 3, medium: 2, low: 1 };
    return choreList.sort((a, b) => {
      const aPriority = priorityOrder[a.priority?.toLowerCase()] || 1;
      const bPriority = priorityOrder[b.priority?.toLowerCase()] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // If same priority, sort by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      return 0;
    });
  };

  const todoChores = sortChoresByPriority(chores.filter(chore => chore.status === 'todo' || !chore.status));
  const doingChores = sortChoresByPriority(chores.filter(chore => chore.status === 'doing'));
  const doneChores = chores.filter(chore => chore.status === 'done').slice(0, 5); // Show only recent 5

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return Circle;
      case 'doing': return PlayCircle;
      case 'done': return CheckCircle2;
      default: return Circle;
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return {
          icon: AlertTriangle,
          gradient: 'from-red-500 to-rose-500',
          bgLight: 'bg-red-50',
          bgDark: 'bg-red-950/20',
          textColor: 'text-red-600 dark:text-red-400'
        };
      case 'high':
        return {
          icon: Zap,
          gradient: 'from-orange-500 to-amber-500',
          bgLight: 'bg-orange-50',
          bgDark: 'bg-orange-950/20',
          textColor: 'text-orange-600 dark:text-orange-400'
        };
      case 'medium':
        return {
          icon: Pin,
          gradient: 'from-blue-500 to-cyan-500',
          bgLight: 'bg-blue-50',
          bgDark: 'bg-blue-950/20',
          textColor: 'text-blue-600 dark:text-blue-400'
        };
      case 'low':
        return {
          icon: FileText,
          gradient: 'from-gray-400 to-gray-500',
          bgLight: 'bg-gray-50',
          bgDark: 'bg-gray-800/20',
          textColor: 'text-gray-600 dark:text-gray-400'
        };
      default:
        return {
          icon: FileText,
          gradient: 'from-gray-400 to-gray-500',
          bgLight: 'bg-gray-50',
          bgDark: 'bg-gray-800/20',
          textColor: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'cleaning': return '🧹';
      case 'cooking': return '👨‍🍳';
      case 'maintenance': return '🔧';
      case 'shopping': return '🛒';
      case 'finance': return '💰';
      default: return '📋';
    }
  };

  const ChoreCard = ({ chore }: { chore: any }) => {
    const isOverdue = chore.dueDate && new Date(chore.dueDate) < new Date() && chore.status !== 'done';
    const isExpanded = expandedChore === chore.id;
    const StatusIcon = getStatusIcon(chore.status);
    const priorityConfig = getPriorityConfig(chore.priority);
    const PriorityIcon = priorityConfig.icon;
    
    const completedSubtasks = chore.subtasks?.filter((st: string) => st).length || 0;
    
    return (
      <div 
        className={`
          group relative overflow-hidden transition-all duration-300
          ${isExpanded ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
        `}
        style={{
          borderRadius: '20px',
          background: 'var(--glass-card)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--glass-border)',
          boxShadow: isExpanded 
            ? '0 20px 40px -10px rgba(0, 0, 0, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
            : '0 4px 24px -2px rgba(0, 0, 0, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Priority gradient accent */}
        <div 
          className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${priorityConfig.gradient} opacity-80`}
        />
        
        {/* Main content */}
        <div className="p-5 pl-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Header with title and status */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`
                  mt-0.5 transition-all duration-300
                  ${chore.status === 'done' ? 'text-green-500' : chore.status === 'doing' ? 'text-orange-500' : 'text-gray-400 dark:text-gray-600'}
                `}>
                  <StatusIcon size={20} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`
                    text-lg font-semibold leading-tight mb-1
                    ${chore.status === 'done' ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'}
                  `}>
                    {chore.title}
                  </h3>
                  
                  {chore.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {chore.description}
                    </p>
                  )}
                  
                  {/* Meta information */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {/* Assignee */}
                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                      <User size={14} />
                      <span className="font-medium">
                        {chore.assignedUser?.firstName || chore.assignedUser?.email?.split('@')[0] || 'Unassigned'}
                      </span>
                    </div>
                    
                    {/* Due date */}
                    {chore.dueDate && (
                      <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                        <Calendar size={14} />
                        <span>
                          {new Date(chore.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                    
                    {/* Duration */}
                    {chore.estimatedDuration && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Clock size={14} />
                        <span>{chore.estimatedDuration}m</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Tags and badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {/* Priority badge */}
                    <div className={`
                      flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                      ${priorityConfig.bgLight} dark:${priorityConfig.bgDark} ${priorityConfig.textColor}
                    `}>
                      <PriorityIcon size={12} />
                      <span>{chore.priority?.charAt(0).toUpperCase() + chore.priority?.slice(1) || 'Medium'}</span>
                    </div>
                    
                    {/* Category badge */}
                    {chore.category && chore.category !== 'general' && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        <span>{getCategoryIcon(chore.category)}</span>
                        <span>{chore.category.charAt(0).toUpperCase() + chore.category.slice(1)}</span>
                      </div>
                    )}
                    
                    {/* Subtasks indicator */}
                    {completedSubtasks > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        <Tag size={12} />
                        <span>{completedSubtasks} subtasks</span>
                      </div>
                    )}
                    
                    {/* Overdue badge */}
                    {isOverdue && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                        <AlertTriangle size={12} />
                        <span>Overdue</span>
                      </div>
                    )}
                    
                    {/* Streak badge */}
                    {chore.status === 'done' && chore.streak > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        <span>🔥</span>
                        <span>{chore.streak} day streak</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-start gap-2">
              <button
                onClick={() => setExpandedChore(isExpanded ? null : chore.id)}
                className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronRight 
                  size={16} 
                  className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} 
                />
              </button>
            </div>
          </div>
          
          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 animate-fade-in">
              {/* Notes */}
              {chore.notes && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                    {chore.notes}
                  </p>
                </div>
              )}
              
              {/* Subtasks */}
              {chore.subtasks && chore.subtasks.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subtasks</h4>
                  <div className="space-y-1">
                    {chore.subtasks.filter((st: string) => st).map((subtask: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Circle size={12} className="text-gray-400" />
                        <span>{subtask}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {chore.status === 'todo' && (
                  <button
                    onClick={() => onUpdateChore(chore.id, { status: 'doing' })}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                  >
                    Start Task
                  </button>
                )}
                {chore.status === 'doing' && (
                  <button
                    onClick={() => onUpdateChore(chore.id, { 
                      status: 'done', 
                      completedAt: new Date().toISOString()
                    })}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                  >
                    Complete
                  </button>
                )}
                {chore.status === 'done' && (
                  <button
                    onClick={() => onUpdateChore(chore.id, { 
                      status: 'todo', 
                      completedAt: null 
                    })}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    Reopen
                  </button>
                )}
                <button
                  onClick={() => onDeleteChore(chore.id)}
                  className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };



  // Full kanban board view for all chores
  return (
    <div className="space-y-6">
      {/* To-Do Column */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-headline font-semibold" style={{ color: 'var(--text-primary)' }}>To Do</h3>
          <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{
            background: 'rgba(0, 122, 255, 0.1)',
            color: 'var(--primary)'
          }}>
            {todoChores.length}
          </span>
        </div>
        <div className="space-y-3">
          {todoChores.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-6 text-center" style={{
              borderColor: 'var(--border-color)',
              opacity: '0.6'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>No pending chores</p>
            </div>
          ) : (
            todoChores.map(chore => <ChoreCard key={chore.id} chore={chore} />)
          )}
        </div>
      </div>

      {/* In Progress Column */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-headline font-semibold" style={{ color: 'var(--text-primary)' }}>In Progress</h3>
          <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{
            background: 'rgba(255, 159, 10, 0.1)',
            color: '#FF9F0A'
          }}>
            {doingChores.length}
          </span>
        </div>
        <div className="space-y-3">
          {doingChores.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-6 text-center" style={{
              borderColor: 'var(--border-color)',
              opacity: '0.6'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>No chores in progress</p>
            </div>
          ) : (
            doingChores.map(chore => <ChoreCard key={chore.id} chore={chore} />)
          )}
        </div>
      </div>

      {/* Done Column */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-headline font-semibold" style={{ color: 'var(--text-primary)' }}>Completed</h3>
          <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{
            background: 'rgba(48, 209, 88, 0.1)',
            color: '#30D158'
          }}>
            {doneChores.length}
          </span>
        </div>
        <div className="space-y-3">
          {doneChores.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-6 text-center" style={{
              borderColor: 'var(--border-color)',
              opacity: '0.6'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>No completed chores</p>
            </div>
          ) : (
            doneChores.map(chore => <ChoreCard key={chore.id} chore={chore} />)
          )}
        </div>
      </div>
    </div>
  );
}
