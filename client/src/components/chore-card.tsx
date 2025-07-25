import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Circle, 
  PlayCircle, 
  Clock, 
  User, 
  AlertTriangle,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface ChoreCardProps {
  chore: any;
  index: number;
  totalCards: number;
  onUpdateChore: (id: string, updates: any) => void;
  onDeleteChore: (id: string) => void;
  isActive: boolean;
  onActivate: () => void;
}

export default function ChoreCard({ 
  chore, 
  index, 
  totalCards, 
  onUpdateChore, 
  onDeleteChore,
  isActive,
  onActivate 
}: ChoreCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  
  // Calculate stacking position
  const stackOffset = isActive ? 0 : (index - (isActive ? 1 : 0)) * 8;
  const stackScale = isActive ? 1 : 1 - (index * 0.02);
  const stackBlur = isActive ? 0 : index * 0.5;
  
  const isOverdue = chore.dueDate && new Date(chore.dueDate) < new Date() && chore.status !== 'done';
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'todo':
        return {
          icon: Circle,
          label: 'To Do',
          color: 'var(--text-secondary)',
          bgColor: 'rgba(156, 163, 175, 0.1)'
        };
      case 'doing':
        return {
          icon: PlayCircle,
          label: 'In Progress',
          color: '#3B82F6',
          bgColor: 'rgba(59, 130, 246, 0.1)'
        };
      case 'done':
        return {
          icon: CheckCircle2,
          label: 'Complete',
          color: '#10B981',
          bgColor: 'rgba(16, 185, 129, 0.1)'
        };
      default:
        return {
          icon: Circle,
          label: 'To Do',
          color: 'var(--text-secondary)',
          bgColor: 'rgba(156, 163, 175, 0.1)'
        };
    }
  };
  
  const statusConfig = getStatusConfig(chore.status || 'todo');
  const StatusIcon = statusConfig.icon;
  
  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 150;
    const currentX = info.offset.x;
    
    if (Math.abs(currentX) > swipeThreshold) {
      // Swipe to complete/uncomplete
      if (currentX > 0 && chore.status !== 'done') {
        onUpdateChore(chore.id, { status: 'done', completedAt: new Date().toISOString() });
      } else if (currentX < 0 && chore.status === 'done') {
        onUpdateChore(chore.id, { status: 'todo', completedAt: null });
      }
    }
    
    setIsDragging(false);
    setDragDirection(null);
  };
  
  const handleDrag = (event: any, info: any) => {
    const currentX = info.offset.x;
    if (currentX > 10) {
      setDragDirection('right');
    } else if (currentX < -10) {
      setDragDirection('left');
    } else {
      setDragDirection(null);
    }
  };
  
  const cycleStatus = () => {
    const statusFlow = ['todo', 'doing', 'done'];
    const currentIndex = statusFlow.indexOf(chore.status || 'todo');
    const nextStatus = statusFlow[(currentIndex + 1) % statusFlow.length];
    
    onUpdateChore(chore.id, { 
      status: nextStatus,
      completedAt: nextStatus === 'done' ? new Date().toISOString() : null
    });
  };
  
  return (
    <motion.div
      className={`absolute inset-x-0 cursor-grab active:cursor-grabbing ${isActive ? 'z-30' : ''}`}
      style={{
        y: stackOffset,
        scale: stackScale,
        filter: `blur(${stackBlur}px)`,
        pointerEvents: isActive ? 'auto' : 'none',
        opacity: index > 3 ? 0 : 1,
        transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
      }}
      drag={isActive}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      onTap={() => !isActive && onActivate()}
      whileDrag={{ scale: 1.02 }}
      onDrag={handleDrag}
    >
      <div 
        className={`
          relative mx-4 overflow-hidden
          ${isDragging ? 'shadow-2xl' : 'shadow-lg'}
        `}
        style={{
          borderRadius: '24px',
          background: `linear-gradient(135deg, 
            rgba(255, 255, 255, ${chore.status === 'done' ? '0.6' : '0.95'}) 0%, 
            rgba(255, 255, 255, ${chore.status === 'done' ? '0.4' : '0.85'}) 100%)`,
          backdropFilter: 'blur(20px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Priority indicator */}
        {chore.priority === 'urgent' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
        )}
        {chore.priority === 'high' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-500" />
        )}
        
        {/* Main content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className={`text-xl font-semibold mb-1 ${chore.status === 'done' ? 'line-through opacity-60' : ''}`} 
                  style={{ color: 'var(--text-primary)' }}>
                {chore.title}
              </h3>
              {chore.description && (
                <p className={`text-sm ${chore.status === 'done' ? 'line-through opacity-50' : 'opacity-70'}`} 
                   style={{ color: 'var(--text-secondary)' }}>
                  {chore.description}
                </p>
              )}
            </div>
            
            {/* Status button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                cycleStatus();
              }}
              className="ml-4 p-3 rounded-2xl transition-all duration-200 hover:scale-110 active:scale-95"
              style={{
                background: statusConfig.bgColor,
                color: statusConfig.color
              }}
            >
              <StatusIcon size={24} />
            </button>
          </div>
          
          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm">
            {/* Assignee */}
            {chore.assignedToUser && (
              <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {chore.assignedToUser.firstName?.[0] || chore.assignedToUser.email?.[0]}
                  </span>
                </div>
                <span>{chore.assignedToUser.firstName || 'Unassigned'}</span>
              </div>
            )}
            
            {/* Due date */}
            {chore.dueDate && (
              <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500' : ''}`}>
                <Clock size={16} />
                <span>
                  {new Date(chore.dueDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            )}
            
            {/* Priority urgent indicator */}
            {isOverdue && (
              <div className="flex items-center gap-1.5 text-red-500">
                <AlertTriangle size={16} />
                <span className="text-xs font-medium">Overdue</span>
              </div>
            )}
          </div>
          
          {/* Progress indicator for subtasks */}
          {chore.subtasks && chore.subtasks.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Subtasks
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  0/{chore.subtasks.filter((st: string) => st).length}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
          )}
          
          {/* Category and duration */}
          <div className="flex items-center gap-3 mt-4">
            {chore.category && (
              <div className="px-3 py-1.5 rounded-full text-xs font-medium" 
                   style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                {chore.category}
              </div>
            )}
            {chore.estimatedDuration && (
              <div className="px-3 py-1.5 rounded-full text-xs font-medium" 
                   style={{ background: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                {chore.estimatedDuration} min
              </div>
            )}
          </div>
        </div>
        
        {/* Swipe indicators */}
        {isDragging && dragDirection && (
          <>
            {dragDirection === 'right' && (
              <div
                className="absolute inset-y-0 left-0 w-20 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, transparent 100%)',
                }}
              >
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
            )}
            {dragDirection === 'left' && (
              <div
                className="absolute inset-y-0 right-0 w-20 flex items-center justify-center"
                style={{
                  background: 'linear-gradient(-90deg, rgba(239, 68, 68, 0.2) 0%, transparent 100%)',
                }}
              >
                <Circle size={32} className="text-red-500" />
              </div>
            )}
          </>
        )}
        
        {/* Completion sparkle effect */}
        {chore.status === 'done' && (
          <div className="absolute top-4 right-4">
            <Sparkles size={20} className="text-green-500 animate-pulse" />
          </div>
        )}
      </div>
    </motion.div>
  );
}