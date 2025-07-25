import { useState } from "react";
import ChoreCard from "./chore-card";
import { CheckCircle2, Circle, PlayCircle, AlertTriangle, ArrowRight } from "lucide-react";

interface ChoresBoardProps {
  chores: any[];
  onUpdateChore: (id: string, updates: any) => void;
  onDeleteChore: (id: string) => void;
}

export default function ChoreBoard({ chores, onUpdateChore, onDeleteChore }: ChoresBoardProps) {
  const [activeStack, setActiveStack] = useState<'todo' | 'doing' | 'done'>('todo');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  
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
  const doneChores = chores.filter(chore => chore.status === 'done').slice(-10).reverse(); // Show recent 10

  const getChoresForStack = (status: string) => {
    switch (status) {
      case 'todo': return todoChores;
      case 'doing': return doingChores;
      case 'done': return doneChores;
      default: return [];
    }
  };

  const currentStackChores = getChoresForStack(activeStack);
  
  const stackConfigs = [
    {
      id: 'todo',
      label: 'To Do',
      icon: Circle,
      count: todoChores.length,
      color: 'var(--text-secondary)',
      bgGradient: 'from-gray-500 to-gray-600'
    },
    {
      id: 'doing',
      label: 'In Progress',
      icon: PlayCircle,
      count: doingChores.length,
      color: '#3B82F6',
      bgGradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'done',
      label: 'Complete',
      icon: CheckCircle2,
      count: doneChores.length,
      color: '#10B981',
      bgGradient: 'from-green-500 to-emerald-500'
    }
  ];
  
  const handleStackChange = (stackId: 'todo' | 'doing' | 'done') => {
    setActiveStack(stackId);
    setActiveCardIndex(0);
  };
  
  const hasUrgentTasks = todoChores.some(chore => 
    chore.priority === 'urgent' || 
    (chore.dueDate && new Date(chore.dueDate) < new Date())
  );

  return (
    <div className="space-y-6">
      {/* Stack selector */}
      <div className="flex gap-3 px-6">
        {stackConfigs.map((stack) => {
          const Icon = stack.icon;
          const isActive = activeStack === stack.id;
          
          return (
            <button
              key={stack.id}
              onClick={() => handleStackChange(stack.id as 'todo' | 'doing' | 'done')}
              className={`
                flex-1 relative overflow-hidden rounded-2xl p-4 transition-all duration-300
                ${isActive ? 'scale-105 shadow-lg' : 'scale-100 hover:scale-102'}
              `}
              style={{
                background: isActive 
                  ? `linear-gradient(135deg, ${stack.color}15 0%, ${stack.color}05 100%)`
                  : 'var(--surface-secondary)',
                backdropFilter: 'blur(10px)',
                border: isActive ? `2px solid ${stack.color}30` : '2px solid transparent'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon size={20} style={{ color: isActive ? stack.color : 'var(--text-secondary)' }} />
                {stack.count > 0 && (
                  <span 
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: isActive ? `${stack.color}20` : 'var(--surface-tertiary)',
                      color: isActive ? stack.color : 'var(--text-secondary)'
                    }}
                  >
                    {stack.count}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-left" style={{ color: 'var(--text-primary)' }}>
                {stack.label}
              </p>
              
              {/* Active indicator */}
              {isActive && (
                <div 
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stack.bgGradient}`}
                />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Urgent tasks alert */}
      {hasUrgentTasks && activeStack === 'todo' && (
        <div className="mx-6 p-4 rounded-2xl bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              You have urgent or overdue tasks that need attention
            </p>
          </div>
        </div>
      )}
      
      {/* Cards stack */}
      <div className="relative" style={{ height: '480px' }}>
        {currentStackChores.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                {stackConfigs.find(s => s.id === activeStack)?.icon && (
                  <Circle size={32} className="text-gray-400 dark:text-gray-600" />
                )}
              </div>
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                No {activeStack === 'todo' ? 'tasks to do' : activeStack === 'doing' ? 'tasks in progress' : 'completed tasks'}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {activeStack === 'todo' ? 'Create a new chore to get started' : 
                 activeStack === 'doing' ? 'Start working on a task' : 
                 'Complete some tasks to see them here'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {currentStackChores.map((chore, index) => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                index={index}
                totalCards={currentStackChores.length}
                onUpdateChore={onUpdateChore}
                onDeleteChore={onDeleteChore}
                isActive={index === activeCardIndex}
                onActivate={() => setActiveCardIndex(index)}
              />
            ))}
            
            {/* Stack navigation */}
            {currentStackChores.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-4">
                {currentStackChores.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveCardIndex(index)}
                    className={`
                      w-2 h-2 rounded-full transition-all duration-300
                      ${index === activeCardIndex ? 'w-8 bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
                    `}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Quick stats */}
      {chores.length > 0 && (
        <div className="grid grid-cols-3 gap-3 px-6">
          <div className="text-center p-3 rounded-xl" style={{ background: 'var(--surface-secondary)' }}>
            <p className="text-2xl font-bold text-green-600">{doneChores.length}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Completed</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: 'var(--surface-secondary)' }}>
            <p className="text-2xl font-bold text-blue-600">{doingChores.length}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>In Progress</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: 'var(--surface-secondary)' }}>
            <p className="text-2xl font-bold text-orange-600">
              {todoChores.filter(c => c.priority === 'urgent' || c.priority === 'high').length}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>High Priority</p>
          </div>
        </div>
      )}
    </div>
  );
}
