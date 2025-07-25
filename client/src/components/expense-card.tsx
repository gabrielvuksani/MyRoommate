import { DollarSign, Calendar, Users, Repeat, FileText, CheckCircle, AlertCircle, MoreVertical, Trash2 } from "lucide-react";
import { useState } from "react";

interface ExpenseCardProps {
  expense: any;
  onSettleExpense?: (params: { splitId: string; settled: boolean }) => void;
  onDeleteExpense?: (id: string) => void;
  showSettlement?: boolean;
}

export default function ExpenseCard({ expense, onSettleExpense, onDeleteExpense, showSettlement = true }: ExpenseCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const getCategoryConfig = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'groceries':
      case 'food':
        return {
          icon: '🛒',
          gradient: 'from-green-500 to-emerald-500',
          bgLight: 'bg-green-50',
          bgDark: 'bg-green-950/20',
          textColor: 'text-green-600 dark:text-green-400'
        };
      case 'utilities':
      case 'electric':
      case 'gas':
        return {
          icon: '⚡',
          gradient: 'from-blue-500 to-cyan-500',
          bgLight: 'bg-blue-50',
          bgDark: 'bg-blue-950/20',
          textColor: 'text-blue-600 dark:text-blue-400'
        };
      case 'rent':
        return {
          icon: '🏠',
          gradient: 'from-purple-500 to-pink-500',
          bgLight: 'bg-purple-50',
          bgDark: 'bg-purple-950/20',
          textColor: 'text-purple-600 dark:text-purple-400'
        };
      case 'entertainment':
        return {
          icon: '🎬',
          gradient: 'from-orange-500 to-amber-500',
          bgLight: 'bg-orange-50',
          bgDark: 'bg-orange-950/20',
          textColor: 'text-orange-600 dark:text-orange-400'
        };
      default:
        return {
          icon: '💳',
          gradient: 'from-gray-500 to-gray-600',
          bgLight: 'bg-gray-50',
          bgDark: 'bg-gray-800/20',
          textColor: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const categoryConfig = getCategoryConfig(expense.category);
  const splits = expense.splits || [];
  const totalSettled = splits.filter((split: any) => split.settled).length;
  const totalSplits = splits.length;
  const isFullySettled = totalSplits > 0 && totalSettled === totalSplits;
  const settlementPercentage = totalSplits > 0 ? (totalSettled / totalSplits) * 100 : 0;

  return (
    <div 
      className={`
        group relative overflow-hidden transition-all duration-300
        ${showDetails ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
      `}
      style={{
        borderRadius: '20px',
        background: 'var(--glass-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        boxShadow: showDetails 
          ? '0 20px 40px -10px rgba(0, 0, 0, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
          : '0 4px 24px -2px rgba(0, 0, 0, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Category gradient accent */}
      <div 
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${categoryConfig.gradient} opacity-80`}
      />
      
      {/* Main content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - expense info */}
          <div className="flex items-start gap-4 flex-1">
            {/* Category icon */}
            <div className={`
              w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
              bg-gradient-to-br ${categoryConfig.gradient} shadow-lg
            `}>
              <span className="text-white text-xl">{categoryConfig.icon}</span>
            </div>
            
            {/* Expense details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {expense.title.charAt(0).toUpperCase() + expense.title.slice(1)}
              </h3>
              
              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Users size={14} />
                  <span>Paid by {expense.paidByUser?.firstName || expense.paidByUser?.email?.split('@')[0] || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>{new Date(expense.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                {expense.isRecurring && expense.recurrenceFrequency && (
                  <div className="flex items-center gap-1.5">
                    <Repeat size={14} />
                    <span className="capitalize">{expense.recurrenceFrequency}</span>
                  </div>
                )}
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {/* Category badge */}
                <div className={`
                  flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                  ${categoryConfig.bgLight} dark:${categoryConfig.bgDark} ${categoryConfig.textColor}
                `}>
                  <span>{expense.category?.charAt(0).toUpperCase() + expense.category?.slice(1) || 'General'}</span>
                </div>
                
                {/* Split type badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  <span>{expense.splitType === 'equal' ? '⚖️' : expense.splitType === 'percentage' ? '📊' : '✏️'}</span>
                  <span>{expense.splitType === 'equal' ? 'Equal Split' : expense.splitType === 'percentage' ? 'Percentage' : 'Custom'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - amount and actions */}
          <div className="flex flex-col items-end gap-3">
            {/* Amount */}
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${parseFloat(expense.amount).toFixed(2)}
              </div>
              
              {/* Settlement status */}
              {isFullySettled ? (
                <div className="flex items-center gap-1.5 mt-1 text-green-600 dark:text-green-400">
                  <CheckCircle size={14} />
                  <span className="text-xs font-medium">Fully Settled</span>
                </div>
              ) : (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {totalSettled}/{totalSplits} settled
                  </div>
                  <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                      style={{ width: `${settlementPercentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MoreVertical size={16} className="text-gray-500" />
              </button>
              {!isFullySettled && onDeleteExpense && (
                <button
                  onClick={() => onDeleteExpense(expense.id)}
                  className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Notes */}
        {expense.notes && (
          <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-start gap-2">
              <FileText size={14} className="text-gray-500 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{expense.notes}</p>
            </div>
          </div>
        )}
        
        {/* Expanded content - Splits */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 animate-fade-in">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Split Details</h4>
            <div className="space-y-2">
              {splits.map((split: any) => (
                <div 
                  key={split.id} 
                  className={`
                    flex items-center justify-between p-3 rounded-xl transition-all duration-200
                    ${split.settled 
                      ? 'bg-green-50 dark:bg-green-900/20' 
                      : 'bg-gray-50 dark:bg-gray-800/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                      ${split.settled 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }
                    `}>
                      {split.user?.firstName?.[0] || split.user?.email?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {split.user?.firstName || split.user?.email?.split('@')[0] || 'Unknown'}
                      </p>
                      <p className={`text-xs ${split.settled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {split.settled ? 'Settled' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${parseFloat(split.amount).toFixed(2)}
                    </span>
                    {!split.settled && onSettleExpense && (
                      <button
                        onClick={() => onSettleExpense({ splitId: split.id, settled: true })}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-md transform hover:scale-[1.02] transition-all duration-200"
                      >
                        Mark Settled
                      </button>
                    )}
                    {split.settled && onSettleExpense && (
                      <button
                        onClick={() => onSettleExpense({ splitId: split.id, settled: false })}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}