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
      <div className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-body font-semibold text-primary mb-1">{chore.title}</h3>
            {chore.description && (
              <p className="text-footnote text-secondary mb-2">{chore.description}</p>
            )}
            <div className="flex items-center gap-2 text-footnote text-secondary">
              <span>{chore.assignedUser?.firstName || chore.assignedUser?.email?.split('@')[0] || 'Unassigned'}</span>
              {chore.dueDate && (
                <>
                  <span>•</span>
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    Due {new Date(chore.dueDate).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {chore.priority && (
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(chore.priority)}`}>
                {getPriorityIcon(chore.priority)} {chore.priority?.charAt(0).toUpperCase() + chore.priority?.slice(1)}
              </span>
            )}
            
            <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
              chore.status === 'done' ? 'bg-green-100 text-green-700' :
              chore.status === 'doing' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {chore.status === 'todo' ? 'To Do' : 
               chore.status === 'doing' ? 'In Progress' : 'Completed'}
            </div>
          </div>
        </div>

        {isOverdue && (
          <div className="mb-3">
            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-medium">
              ⚠️ Overdue
            </span>
          </div>
        )}

        {chore.status === 'done' && chore.streak > 0 && (
          <div className="mb-3">
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-medium">
              🔥 {chore.streak} day streak
            </span>
          </div>
        )}
        
        <div className="flex space-x-2">
          {chore.status === 'todo' && (
            <button
              onClick={() => onUpdateChore(chore.id, { status: 'doing' })}
              className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-medium transition-colors"
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
              className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-medium transition-colors"
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
              className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-medium transition-colors"
            >
              Reopen
            </button>
          )}
          <button
            onClick={() => onDeleteChore(chore.id)}
            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors"
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
          <h3 className="text-headline font-semibold text-primary">To Do</h3>
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
            {todoChores.length}
          </span>
        </div>
        <div className="space-y-3">
          {todoChores.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
              <p className="text-secondary">No pending chores</p>
            </div>
          ) : (
            todoChores.map(chore => <ChoreCard key={chore.id} chore={chore} />)
          )}
        </div>
      </div>

      {/* In Progress Column */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-headline font-semibold text-primary">In Progress</h3>
          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs font-medium">
            {doingChores.length}
          </span>
        </div>
        <div className="space-y-3">
          {doingChores.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
              <p className="text-secondary">No chores in progress</p>
            </div>
          ) : (
            doingChores.map(chore => <ChoreCard key={chore.id} chore={chore} />)
          )}
        </div>
      </div>

      {/* Done Column */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-headline font-semibold text-primary">Completed</h3>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-medium">
            {doneChores.length}
          </span>
        </div>
        <div className="space-y-3">
          {doneChores.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
              <p className="text-secondary">No completed chores</p>
            </div>
          ) : (
            doneChores.map(chore => <ChoreCard key={chore.id} chore={chore} />)
          )}
        </div>
      </div>
    </div>
  );
}
