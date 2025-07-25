import { useState } from "react";
import { DollarSign, Calendar, Users, Repeat, CheckCircle, Clock, X, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ExpenseCardProps {
  expense: any;
  onSettleExpense?: (params: { splitId: string; settled: boolean }) => void;
  onDeleteExpense?: (id: string) => void;
  showSettlement?: boolean;
}

export default function ExpenseCard({ expense, onSettleExpense, onDeleteExpense, showSettlement = true }: ExpenseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  
  const getCategoryConfig = (category: string) => {
    const configs: { [key: string]: { emoji: string; color: string; bg: string } } = {
      groceries: { emoji: '🛒', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
      food: { emoji: '🍕', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
      utilities: { emoji: '⚡', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
      electric: { emoji: '💡', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
      gas: { emoji: '🔥', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)' },
      rent: { emoji: '🏠', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)' },
      internet: { emoji: '📶', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)' },
      transportation: { emoji: '🚗', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' },
      dining: { emoji: '🍽️', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)' },
      entertainment: { emoji: '🎬', color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)' },
      cleaning: { emoji: '🧹', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)' },
      maintenance: { emoji: '🔧', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.08)' },
      other: { emoji: '💰', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.08)' }
    };
    
    return configs[category?.toLowerCase()] || configs.other;
  };

  const categoryConfig = getCategoryConfig(expense.category);
  const splits = expense.splits || [];
  const totalSettled = splits.filter((split: any) => split.settled).length;
  const totalSplits = splits.length;
  const isFullySettled = totalSplits > 0 && totalSettled === totalSplits;
  const settlementPercentage = totalSplits > 0 ? (totalSettled / totalSplits) * 100 : 0;

  const formatAmount = (amount: string | number) => {
    return parseFloat(amount.toString()).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const currentUserId = user?.id;
  const mySplit = splits.find((split: any) => split.userId === currentUserId);
  const didIPay = expense.paidBy === currentUserId;
  
  // Calculate what I owe or what others owe me
  let myOwedAmount = 0;
  let myOwingAmount = 0;
  
  if (didIPay) {
    // I paid, so others owe me their unsettled portions
    myOwedAmount = splits
      .filter((split: any) => split.userId !== currentUserId && !split.settled)
      .reduce((sum: number, split: any) => sum + parseFloat(split.amount), 0);
  } else if (mySplit && !mySplit.settled) {
    // Someone else paid, I owe my portion
    myOwingAmount = parseFloat(mySplit.amount);
  }

  return (
    <div 
      className={`
        relative overflow-hidden transition-all duration-300 cursor-pointer
        ${isExpanded ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
      `}
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        borderRadius: '20px',
        background: 'var(--glass-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Settlement progress bar */}
      {settlementPercentage > 0 && settlementPercentage < 100 && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full transition-all duration-500 bg-green-500"
            style={{ width: `${settlementPercentage}%` }}
          />
        </div>
      )}
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1">
            {/* Category icon */}
            <div 
              className="p-2 rounded-xl flex-shrink-0"
              style={{
                background: categoryConfig.bg,
                color: categoryConfig.color
              }}
            >
              <span className="text-lg">{categoryConfig.emoji}</span>
            </div>
            
            {/* Expense info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {expense.title.charAt(0).toUpperCase() + expense.title.slice(1)}
              </h3>
              
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>Paid by {expense.paidByUser?.firstName || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{formatDate(expense.createdAt)}</span>
                </div>
                {expense.isRecurring && (
                  <div className="flex items-center gap-1">
                    <Repeat size={12} />
                    <span className="capitalize">{expense.recurrenceFrequency}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Amount and status */}
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              ${formatAmount(expense.amount)}
            </div>
            {isFullySettled ? (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-0.5">
                <CheckCircle size={12} />
                <span>Settled</span>
              </div>
            ) : settlementPercentage > 0 ? (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {Math.round(settlementPercentage)}% settled
              </div>
            ) : null}
          </div>
        </div>
        
        {/* Quick split info */}
        {!isExpanded && splits.length > 0 && (
          <div className="ml-11 space-y-1">
            {myOwingAmount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600 dark:text-red-400 font-medium">You owe</span>
                <span className="text-red-600 dark:text-red-400 font-bold">${formatAmount(myOwingAmount)}</span>
              </div>
            )}
            {myOwedAmount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600 dark:text-green-400 font-medium">Others owe you</span>
                <span className="text-green-600 dark:text-green-400 font-bold">
                  ${formatAmount(myOwedAmount)}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 animate-fade-in">
            {expense.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                {expense.description}
              </p>
            )}
            
            {/* Split details */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                Split Details
              </h4>
              {splits.map((split: any) => (
                <div 
                  key={split.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    background: split.settled 
                      ? 'rgba(16, 185, 129, 0.05)' 
                      : 'var(--surface-secondary)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                      ${split.settled ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}
                    `}>
                      {split.user?.firstName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {split.user?.firstName || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {split.userId === expense.paidBy ? 'Paid' : 'Owes'} ${formatAmount(split.amount)}
                      </p>
                    </div>
                  </div>
                  
                  {showSettlement && !split.settled && split.userId !== expense.paidBy && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSettleExpense?.({ splitId: split.id, settled: true });
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-all hover:scale-105 active:scale-95"
                    >
                      Settle
                    </button>
                  )}
                  
                  {split.settled && (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle size={12} />
                      <span>Settled</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Actions */}
            {!isFullySettled && onDeleteExpense && (
              <div className="flex justify-end mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteExpense(expense.id);
                  }}
                  className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}