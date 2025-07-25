import { useState } from "react";
import { CheckCircle2, Circle, Clock, ChevronRight, Trash2 } from "lucide-react";

interface ChoresBoardProps {
  chores: any[];
  onUpdateChore: (id: string, updates: any) => void;
  onDeleteChore: (id: string) => void;
}

export default function ChoreBoard({ chores, onUpdateChore, onDeleteChore }: ChoresBoardProps) {
  const [expandedChore, setExpandedChore] = useState<string | null>(null);
  
  // Sort chores by priority and due date
  const sortChores = (choreList: any[]) => {
    const priorityOrder: { [key: string]: number } = { urgent: 4, high: 3, medium: 2, low: 1 };
    return choreList.sort((a, b) => {
      const aPriority = priorityOrder[a.priority?.toLowerCase()] || 1;
      const bPriority = priorityOrder[b.priority?.toLowerCase()] || 1;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      return 0;
    });
  };

  const todoChores = sortChores(chores.filter(chore => chore.status === 'todo' || !chore.status));
  const doingChores = sortChores(chores.filter(chore => chore.status === 'doing'));
  const doneChores = chores.filter(chore => chore.status === 'done').slice(0, 3);

  const formatDueDate = (date: string) => {
    const due = new Date(date);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `${diffDays} days`;
    return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const ChoreCard = ({ chore, status }: { chore: any; status: string }) => {
    const isExpanded = expandedChore === chore.id;
    const isOverdue = chore.dueDate && new Date(chore.dueDate) < new Date() && status !== 'done';
    
    const handleStatusToggle = () => {
      if (status === 'todo') {
        onUpdateChore(chore.id, { status: 'doing' });
      } else if (status === 'doing') {
        onUpdateChore(chore.id, { status: 'done', completedAt: new Date().toISOString() });
      } else if (status === 'done') {
        onUpdateChore(chore.id, { status: 'todo', completedAt: null });
      }
    };
    
    return (
      <div 
        className="group relative overflow-hidden"
        style={{
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          transition: 'all 0.2s ease'
        }}
      >
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setExpandedChore(isExpanded ? null : chore.id)}
        >
          <div className="flex items-start gap-3">
            {/* Status Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleStatusToggle();
              }}
              className="mt-0.5 flex-shrink-0"
              style={{ transition: 'all 0.2s ease' }}
            >
              {status === 'done' ? (
                <CheckCircle2 
                  size={22} 
                  style={{ color: 'var(--success-color)' }}
                  fill="currentColor"
                />
              ) : (
                <Circle 
                  size={22} 
                  style={{ 
                    color: status === 'doing' ? 'var(--primary)' : 'var(--text-tertiary)',
                    strokeWidth: status === 'doing' ? 2.5 : 2
                  }}
                />
              )}
            </button>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 
                className={`text-base font-medium mb-1 ${status === 'done' ? 'line-through opacity-60' : ''}`}
                style={{ color: 'var(--text-primary)' }}
              >
                {chore.title}
              </h3>
              
              {/* Metadata */}
              <div className="flex items-center gap-3 text-sm">
                {/* Assignee */}
                <span style={{ color: 'var(--text-secondary)' }}>
                  {chore.assignedUser?.firstName || chore.assignedUser?.email?.split('@')[0] || 'Unassigned'}
                </span>
                
                {/* Due Date */}
                {chore.dueDate && (
                  <div className="flex items-center gap-1">
                    <Clock size={14} style={{ color: isOverdue ? 'var(--danger-color)' : 'var(--text-tertiary)' }} />
                    <span style={{ 
                      color: isOverdue ? 'var(--danger-color)' : 'var(--text-secondary)',
                      fontWeight: isOverdue ? 500 : 400
                    }}>
                      {formatDueDate(chore.dueDate)}
                    </span>
                  </div>
                )}
                
                {/* Priority */}
                {chore.priority && chore.priority !== 'low' && (
                  <span 
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: chore.priority === 'urgent' ? 'var(--danger-bg)' :
                                 chore.priority === 'high' ? 'var(--warning-bg)' :
                                 'var(--info-bg)',
                      color: chore.priority === 'urgent' ? 'var(--danger-color)' :
                            chore.priority === 'high' ? 'var(--warning-color)' :
                            'var(--info-color)'
                    }}
                  >
                    {chore.priority}
                  </span>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight 
                size={18} 
                style={{ 
                  color: 'var(--text-tertiary)',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Expanded Content */}
        {isExpanded && (
          <div 
            className="px-4 pb-4 animate-fade-in"
            style={{ borderTop: '1px solid var(--border-color)' }}
          >
            {chore.description && (
              <p className="text-sm py-3" style={{ color: 'var(--text-secondary)' }}>
                {chore.description}
              </p>
            )}
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {chore.category && (
                  <span>{chore.category}</span>
                )}
                {chore.estimatedDuration && (
                  <span>{chore.estimatedDuration} min</span>
                )}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChore(chore.id);
                }}
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={16} style={{ color: 'var(--danger-color)' }} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ChoreSection = ({ title, chores, status }: { title: string; chores: any[]; status: string }) => {
    if (chores.length === 0 && status !== 'todo') return null;
    
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-medium px-1" style={{ color: 'var(--text-secondary)' }}>
          {title} · {chores.length}
        </h2>
        <div className="space-y-2">
          {chores.length === 0 ? (
            <div 
              className="text-center py-8 rounded-2xl"
              style={{ 
                background: 'var(--surface-secondary)',
                border: '1px dashed var(--border-color)'
              }}
            >
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                No tasks yet
              </p>
            </div>
          ) : (
            chores.map(chore => (
              <ChoreCard key={chore.id} chore={chore} status={status} />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ChoreSection title="To Do" chores={todoChores} status="todo" />
      <ChoreSection title="In Progress" chores={doingChores} status="doing" />
      {doneChores.length > 0 && (
        <ChoreSection title="Recently Completed" chores={doneChores} status="done" />
      )}
    </div>
  );
}