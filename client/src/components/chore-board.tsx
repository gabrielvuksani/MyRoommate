import { Card, CardContent } from "@/components/ui/card";

interface ChoresBoardProps {
  chores: any[];
  onUpdateChore: (id: string, updates: any) => void;
  onDeleteChore: (id: string) => void;
}

export default function ChoreBoard({ chores, onUpdateChore, onDeleteChore }: ChoresBoardProps) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'border-ios-blue';
      case 'doing': return 'border-ios-orange';
      case 'done': return 'border-ios-green';
      default: return 'border-ios-gray-3';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-ios-blue';
      case 'doing': return 'bg-ios-orange';
      case 'done': return 'bg-ios-green';
      default: return 'bg-ios-gray-3';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-blue-100 text-blue-700';
      case 'low': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '🔥';
      case 'high': return '⚡';
      case 'medium': return '📌';
      case 'low': return '📝';
      default: return '📝';
    }
  };

  const ChoreCard = ({ chore }: { chore: any }) => {
    const isOverdue = chore.dueDate && new Date(chore.dueDate) < new Date() && chore.status !== 'done';
    
    return (
      <div className="rounded-xl p-4 hover:shadow-sm transition-shadow" style={{
        border: '1px solid var(--border-color)',
        background: 'var(--surface)'
      }}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-body font-semibold mb-1" style={{ color: 'var(--primary)' }}>{chore.title}</h3>
            {chore.description && (
              <p className="text-footnote mb-2" style={{ color: 'var(--text-secondary)' }}>{chore.description}</p>
            )}
            <div className="flex items-center gap-2 text-footnote" style={{ color: 'var(--text-secondary)' }}>
              <span>{chore.assignedUser?.firstName || chore.assignedUser?.email?.split('@')[0] || 'Unassigned'}</span>
              {chore.dueDate && (
                <>
                  <span>•</span>
                  <span className={isOverdue ? 'font-medium' : ''} style={{
                    color: isOverdue ? '#FF453A' : 'var(--text-secondary)'
                  }}>
                    Due {new Date(chore.dueDate).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {chore.priority && (
              <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{
                background: chore.priority === 'urgent' ? 'rgba(255, 69, 58, 0.1)' :
                           chore.priority === 'high' ? 'rgba(255, 159, 10, 0.1)' :
                           chore.priority === 'medium' ? 'rgba(0, 122, 255, 0.1)' :
                           'var(--surface-secondary)',
                color: chore.priority === 'urgent' ? '#FF453A' :
                      chore.priority === 'high' ? '#FF9F0A' :
                      chore.priority === 'medium' ? 'var(--primary)' :
                      'var(--text-secondary)'
              }}>
                {getPriorityIcon(chore.priority)} {chore.priority?.charAt(0).toUpperCase() + chore.priority?.slice(1)}
              </span>
            )}
            
            <div className="px-2 py-1 rounded-lg text-xs font-medium" style={{
              background: chore.status === 'todo' ? 'rgba(0, 122, 255, 0.1)' :
                         chore.status === 'doing' ? 'rgba(255, 159, 10, 0.1)' :
                         'rgba(48, 209, 88, 0.1)',
              color: chore.status === 'todo' ? 'var(--primary)' :
                    chore.status === 'doing' ? '#FF9F0A' :
                    '#30D158'
            }}>
              {chore.status === 'todo' ? 'To Do' : 
               chore.status === 'doing' ? 'In Progress' : 'Completed'}
            </div>
          </div>
        </div>

        {isOverdue && (
          <div className="mb-3">
            <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{
              background: 'rgba(255, 69, 58, 0.1)',
              color: '#FF453A'
            }}>
              ⚠️ Overdue
            </span>
          </div>
        )}

        {chore.status === 'done' && chore.streak > 0 && (
          <div className="mb-3">
            <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{
              background: 'rgba(48, 209, 88, 0.1)',
              color: '#30D158'
            }}>
              🔥 {chore.streak} day streak
            </span>
          </div>
        )}
        
        <div className="flex space-x-2">
          {chore.status === 'todo' && (
            <button
              onClick={() => onUpdateChore(chore.id, { status: 'doing' })}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: 'rgba(0, 122, 255, 0.1)',
                color: 'var(--primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 122, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)';
              }}
            >
              Start
            </button>
          )}
          {chore.status === 'doing' && (
            <button
              onClick={() => onUpdateChore(chore.id, { 
                status: 'done', 
                completedAt: new Date().toISOString()
              })}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: 'rgba(48, 209, 88, 0.1)',
                color: '#30D158'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(48, 209, 88, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(48, 209, 88, 0.1)';
              }}
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
              className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: 'rgba(0, 122, 255, 0.1)',
                color: 'var(--primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 122, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)';
              }}
            >
              Reopen
            </button>
          )}
          <button
            onClick={() => onDeleteChore(chore.id)}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: 'rgba(255, 69, 58, 0.1)',
              color: '#FF453A'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 69, 58, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)';
            }}
          >
            Delete
          </button>
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
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{
              background: 'rgba(0, 122, 255, 0.1)',
              border: '2px solid var(--primary)'
            }}>
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--primary)' }}></div>
            </div>
            <h3 className="text-headline font-semibold" style={{ color: 'var(--text-primary)' }}>To Do</h3>
          </div>
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
              borderColor: 'var(--border-color)'
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
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{
              background: 'rgba(255, 159, 10, 0.1)',
              border: '2px solid #FF9F0A'
            }}>
              <div className="w-2 h-2 rounded-full" style={{ background: '#FF9F0A' }}></div>
            </div>
            <h3 className="text-headline font-semibold" style={{ color: 'var(--text-primary)' }}>In Progress</h3>
          </div>
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
              borderColor: 'var(--border-color)'
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
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{
              background: 'rgba(48, 209, 88, 0.1)',
              border: '2px solid #30D158'
            }}>
              <div className="w-2 h-2 rounded-full" style={{ background: '#30D158' }}></div>
            </div>
            <h3 className="text-headline font-semibold" style={{ color: 'var(--text-primary)' }}>Completed</h3>
          </div>
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
              borderColor: 'var(--border-color)'
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
