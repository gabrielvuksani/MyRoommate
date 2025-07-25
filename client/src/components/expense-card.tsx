import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { 
  DollarSign,
  Calendar,
  Users,
  Repeat,
  CheckCircle,
  Circle,
  ChevronRight,
  Trash2,
  ShoppingBag,
  Home,
  Car,
  Utensils,
  Heart,
  Sparkles,
  Gift,
  Receipt,
  Zap,
  Film
} from "lucide-react";

interface ExpenseCardProps {
  expense: any;
  onSettleExpense?: (params: { splitId: string; settled: boolean }) => void;
  onDeleteExpense?: (id: string) => void;
  showSettlement?: boolean;
  index?: number;
  totalCards?: number;
  isActive?: boolean;
  onActivate?: () => void;
}

const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'groceries':
    case 'food': return Utensils;
    case 'utilities':
    case 'electric':
    case 'gas': return Zap;
    case 'rent': return Home;
    case 'transportation': return Car;
    case 'healthcare': return Heart;
    case 'entertainment': return Film;
    case 'shopping': return ShoppingBag;
    case 'other': return Gift;
    default: return Receipt;
  }
};

const getCategoryConfig = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'groceries':
    case 'food':
      return {
        gradient: 'from-emerald-500 to-green-600',
        light: 'rgba(16, 185, 129, 0.1)',
        dark: 'rgba(16, 185, 129, 0.05)',
        color: '#10B981',
        emoji: '🛒'
      };
    case 'utilities':
    case 'electric':
    case 'gas':
      return {
        gradient: 'from-blue-500 to-cyan-600',
        light: 'rgba(59, 130, 246, 0.1)',
        dark: 'rgba(59, 130, 246, 0.05)',
        color: '#3B82F6',
        emoji: '⚡'
      };
    case 'rent':
      return {
        gradient: 'from-purple-500 to-indigo-600',
        light: 'rgba(139, 92, 246, 0.1)',
        dark: 'rgba(139, 92, 246, 0.05)',
        color: '#8B5CF6',
        emoji: '🏠'
      };
    case 'transportation':
      return {
        gradient: 'from-orange-500 to-red-600',
        light: 'rgba(249, 115, 22, 0.1)',
        dark: 'rgba(249, 115, 22, 0.05)',
        color: '#F97316',
        emoji: '🚗'
      };
    case 'healthcare':
      return {
        gradient: 'from-rose-500 to-pink-600',
        light: 'rgba(244, 63, 94, 0.1)',
        dark: 'rgba(244, 63, 94, 0.05)',
        color: '#F43F5E',
        emoji: '💊'
      };
    case 'entertainment':
      return {
        gradient: 'from-yellow-500 to-amber-600',
        light: 'rgba(245, 158, 11, 0.1)',
        dark: 'rgba(245, 158, 11, 0.05)',
        color: '#F59E0B',
        emoji: '🎬'
      };
    case 'shopping':
      return {
        gradient: 'from-fuchsia-500 to-purple-600',
        light: 'rgba(217, 70, 239, 0.1)',
        dark: 'rgba(217, 70, 239, 0.05)',
        color: '#D946EF',
        emoji: '🛍️'
      };
    default:
      return {
        gradient: 'from-gray-500 to-slate-600',
        light: 'rgba(107, 114, 128, 0.1)',
        dark: 'rgba(107, 114, 128, 0.05)',
        color: '#6B7280',
        emoji: '💳'
      };
  }
};

export default function ExpenseCard({ 
  expense, 
  onSettleExpense, 
  onDeleteExpense, 
  showSettlement = true,
  index = 0,
  totalCards = 1,
  isActive = false,
  onActivate
}: ExpenseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const categoryConfig = getCategoryConfig(expense.category);
  const CategoryIcon = getCategoryIcon(expense.category);
  const splits = expense.splits || [];
  const totalSettled = splits.filter((split: any) => split.settled).length;
  const totalSplits = splits.length;
  const isFullySettled = totalSplits > 0 && totalSettled === totalSplits;
  const settlementProgress = totalSplits > 0 ? (totalSettled / totalSplits) : 0;
  
  // Calculate card offset for stacking effect
  const cardOffset = isActive ? 0 : (index - (isActive ? 1 : 0)) * 12;
  const scale = isActive ? 1 : 1 - (index * 0.02);
  const zIndex = totalCards - index;
  
  const handleDelete = () => {
    if (onDeleteExpense) {
      onDeleteExpense(expense.id);
    }
  };

  return (
    <motion.div
      className="cursor-pointer"
      initial={{ 
        y: 50, 
        opacity: 0,
        scale: 0.95 
      }}
      animate={{ 
        y: 0,
        scale: 1,
        opacity: 1
      }}
      exit={{ 
        x: 300,
        opacity: 0,
        scale: 0.8,
        rotate: 15
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        delay: index * 0.05
      }}
      style={{ 
        zIndex: 1
      }}
    >
      <div 
        className={`
          relative overflow-hidden rounded-2xl
          shadow-lg hover:shadow-xl
          transition-all duration-500
        `}
        style={{
          background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))',
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          minHeight: '160px'
        }}
      >
        {/* Gradient accent bar */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${categoryConfig.gradient}`}
          style={{ opacity: 0.8 }}
        />
        
        {/* Main content */}
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div 
                className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  bg-gradient-to-br ${categoryConfig.gradient}
                  shadow-md
                `}
              >
                <span className="text-xl">{categoryConfig.emoji}</span>
              </div>
              
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {expense.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {expense.creator?.firstName || expense.creator?.email?.split('@')[0]} • {new Date(expense.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xl font-bold" style={{ color: categoryConfig.color }}>
                ${expense.amount.toFixed(2)}
              </p>
              {expense.isRecurring && (
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <Repeat size={12} />
                  <span>Monthly</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Settlement progress */}
          {showSettlement && totalSplits > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Settlement Progress
                </span>
                <span className="text-xs font-bold" style={{ color: categoryConfig.color }}>
                  {totalSettled}/{totalSplits} settled
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-secondary)' }}>
                <motion.div
                  className={`h-full bg-gradient-to-r ${categoryConfig.gradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${settlementProgress * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
          
          {/* Quick stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Users size={14} />
              <span>{totalSplits} people</span>
            </div>
            {expense.notes && (
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                <Receipt size={14} />
                <span>Has notes</span>
              </div>
            )}
            {isFullySettled && (
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle size={14} />
                <span className="font-medium">Fully settled</span>
              </div>
            )}
          </div>
          
          {/* Expand button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`
              absolute bottom-4 right-4 p-2 rounded-xl
              transition-all duration-200 hover:scale-110
              ${isExpanded ? 'bg-gradient-to-r ' + categoryConfig.gradient + ' text-white shadow-md' : 'bg-white/50 dark:bg-gray-800/50'}
            `}
          >
            <ChevronRight 
              size={18} 
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              style={{ color: isExpanded ? 'white' : 'var(--text-secondary)' }}
            />
          </motion.button>
        </div>
        
        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-4">
                {/* Notes */}
                {expense.notes && (
                  <div className="p-4 rounded-2xl" style={{ background: 'var(--surface-secondary)' }}>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Notes
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {expense.notes}
                    </p>
                  </div>
                )}
                
                {/* Splits */}
                <div className="space-y-2">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Split Details
                  </p>
                  {splits.map((split: any) => (
                    <div
                      key={split.id}
                      className="flex items-center justify-between p-3 rounded-xl transition-all duration-200"
                      style={{ 
                        background: split.settled ? 'var(--surface-tertiary)' : 'var(--surface-secondary)',
                        opacity: split.settled ? 0.7 : 1
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                          style={{ background: categoryConfig.light }}
                        >
                          {split.user?.firstName?.[0] || split.user?.email?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {split.user?.firstName || split.user?.email?.split('@')[0]}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            ${split.amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {showSettlement && onSettleExpense && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSettleExpense({ splitId: split.id, settled: !split.settled });
                          }}
                          className={`
                            p-2 rounded-lg transition-all duration-200
                            ${split.settled ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}
                          `}
                        >
                          {split.settled ? <CheckCircle size={20} /> : <Circle size={20} />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Delete button */}
                {onDeleteExpense && !isFullySettled && (
                  <div className="pt-2">
                    {!showDeleteConfirm ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full p-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} />
                        <span className="text-sm font-medium">Delete Expense</span>
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                          }}
                          className="flex-1 p-3 rounded-xl bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-colors"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(false);
                          }}
                          className="flex-1 p-3 rounded-xl text-sm font-medium transition-colors"
                          style={{ 
                            background: 'var(--surface-secondary)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}