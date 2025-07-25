import { Card } from "@/components/ui/card";
import { Clock, Calendar, User, CheckCircle2, Circle, PlayCircle, Trash2 } from "lucide-react";
import { useState } from "react";

interface ChoresBoardProps {
  chores: any[];
  onUpdateChore: (id: string, updates: any) => void;
  onDeleteChore: (id: string) => void;
}

export default function ChoreBoard({ chores, onUpdateChore, onDeleteChore }: ChoresBoardProps) {
  const [selectedChoreId, setSelectedChoreId] = useState<string | null>(null);
  
  // Sort chores by priority and due date
  const sortChoresByPriority = (choreList: any[]) => {
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

  const todoChores = sortChoresByPriority(chores.filter(chore => chore.status === 'todo' || !chore.status));
  const doingChores = sortChoresByPriority(chores.filter(chore => chore.status === 'doing'));
  const doneChores = chores.filter(chore => chore.status === 'done').slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return Circle;
      case 'doing': return PlayCircle;
      case 'done': return CheckCircle2;
      default: return Circle;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'text-red-600 dark:text-red-500';
      case 'high': return 'text-orange-600 dark:text-orange-500';
      case 'medium': return 'text-blue-600 dark:text-blue-500';
      case 'low': return 'text-gray-500 dark:text-gray-400';
      default: return 'text-gray-500 dark:text-gray-400';
    }
  };

  const ChoreCard = ({ chore }: { chore: any }) => {
    const isOverdue = chore.dueDate && new Date(chore.dueDate) < new Date() && chore.status !== 'done';
    const isSelected = selectedChoreId === chore.id;
    const StatusIcon = getStatusIcon(chore.status);
    
    return (
      <Card 
        className={`
          relative overflow-hidden transition-all duration-200 cursor-pointer
          ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}
          ${isOverdue ? 'border-red-200 dark:border-red-900/30' : ''}
        `}
        onClick={() => setSelectedChoreId(isSelected ? null : chore.id)}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextStatus = chore.status === 'todo' ? 'doing' : chore.status === 'doing' ? 'done' : 'todo';
                  onUpdateChore(chore.id, { status: nextStatus });
                }}
                className={`
                  mt-0.5 transition-colors
                  ${chore.status === 'done' ? 'text-green-600 dark:text-green-500' : 'text-gray-400 dark:text-gray-500 hover:text-primary'}
                `}
              >
                <StatusIcon size={20} />
              </button>
              
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium text-gray-900 dark:text-white ${chore.status === 'done' ? 'line-through opacity-60' : ''}`}>
                  {chore.title}
                </h3>
                
                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {chore.priority && (
                    <span className={`font-medium ${getPriorityColor(chore.priority)}`}>
                      {chore.priority.charAt(0).toUpperCase() + chore.priority.slice(1)}
                    </span>
                  )}
                  
                  {chore.assignedToUser && (
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{chore.assignedToUser.firstName || 'Unassigned'}</span>
                    </div>
                  )}
                  
                  {chore.dueDate && (
                    <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-500 font-medium' : ''}`}>
                      <Calendar size={14} />
                      <span>
                        {new Date(chore.dueDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: new Date(chore.dueDate).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </span>
                    </div>
                  )}
                  
                  {chore.duration && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{chore.duration}</span>
                    </div>
                  )}
                </div>

                {/* Notes preview */}
                {chore.notes && !isSelected && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {chore.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChore(chore.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 size={16} className="text-red-600 dark:text-red-400" />
            </button>
          </div>

          {/* Expanded content */}
          {isSelected && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3 animate-in slide-in-from-top-2 duration-200">
              {chore.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{chore.notes}</p>
                </div>
              )}
              
              {chore.subtasks && chore.subtasks.filter((st: string) => st).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subtasks</h4>
                  <div className="space-y-1">
                    {chore.subtasks.filter((st: string) => st).map((subtask: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Circle size={12} />
                        <span>{subtask}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {chore.category && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Category:</span>
                  <span className="text-gray-700 dark:text-gray-300">{chore.category}</span>
                </div>
              )}
              
              {chore.recurrenceFrequency && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Repeats:</span>
                  <span className="text-gray-700 dark:text-gray-300 capitalize">{chore.recurrenceFrequency}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  const ColumnHeader = ({ title, count }: { title: string; count: number }) => (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {count} {count === 1 ? 'task' : 'tasks'}
      </p>
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Todo Column */}
      <div>
        <ColumnHeader title="To Do" count={todoChores.length} />
        <div className="space-y-3">
          {todoChores.map(chore => (
            <ChoreCard key={chore.id} chore={chore} />
          ))}
          {todoChores.length === 0 && (
            <Card className="p-8 text-center border-dashed">
              <p className="text-gray-500 dark:text-gray-400">No tasks to do</p>
            </Card>
          )}
        </div>
      </div>

      {/* Doing Column */}
      <div>
        <ColumnHeader title="In Progress" count={doingChores.length} />
        <div className="space-y-3">
          {doingChores.map(chore => (
            <ChoreCard key={chore.id} chore={chore} />
          ))}
          {doingChores.length === 0 && (
            <Card className="p-8 text-center border-dashed">
              <p className="text-gray-500 dark:text-gray-400">No tasks in progress</p>
            </Card>
          )}
        </div>
      </div>

      {/* Done Column */}
      <div>
        <ColumnHeader title="Done" count={doneChores.length} />
        <div className="space-y-3">
          {doneChores.map(chore => (
            <ChoreCard key={chore.id} chore={chore} />
          ))}
          {doneChores.length === 0 && (
            <Card className="p-8 text-center border-dashed">
              <p className="text-gray-500 dark:text-gray-400">No completed tasks</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}