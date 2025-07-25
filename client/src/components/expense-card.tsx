import { DollarSign, Calendar, Users, Repeat, CheckCircle, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface ExpenseCardProps {
  expense: any;
  onSettleExpense?: (params: { splitId: string; settled: boolean }) => void;
  onDeleteExpense?: (id: string) => void;
  showSettlement?: boolean;
}

export default function ExpenseCard({ expense, onSettleExpense, onDeleteExpense, showSettlement = true }: ExpenseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'groceries':
      case 'food': return '🛒';
      case 'utilities':
      case 'electric':
      case 'gas': return '⚡';
      case 'rent': return '🏠';
      case 'entertainment': return '🎬';
      case 'transport': return '🚗';
      case 'healthcare': return '🏥';
      default: return '💳';
    }
  };

  const splits = expense.splits || [];
  const totalSettled = splits.filter((split: any) => split.settled).length;
  const totalSplits = splits.length;
  const isFullySettled = totalSplits > 0 && totalSettled === totalSplits;

  return (
    <Card 
      className={`
        relative overflow-hidden transition-all duration-200 cursor-pointer group
        ${isExpanded ? 'ring-2 ring-primary' : 'hover:shadow-md'}
      `}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Category icon */}
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">{getCategoryIcon(expense.category)}</span>
            </div>
            
            {/* Expense details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {expense.title.charAt(0).toUpperCase() + expense.title.slice(1)}
                </h3>
                <span className="font-semibold text-lg text-gray-900 dark:text-white">
                  ${expense.amount.toFixed(2)}
                </span>
              </div>
              
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>Paid by {expense.paidByUser?.firstName || 'Unknown'}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>
                    {new Date(expense.createdAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: new Date(expense.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    })}
                  </span>
                </div>
                
                {expense.isRecurring && expense.recurrenceFrequency && (
                  <div className="flex items-center gap-1">
                    <Repeat size={14} />
                    <span className="capitalize">{expense.recurrenceFrequency}</span>
                  </div>
                )}
              </div>

              {/* Settlement status */}
              {showSettlement && totalSplits > 0 && (
                <div className="mt-3">
                  {isFullySettled ? (
                    <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-500 font-medium">
                      <CheckCircle size={16} />
                      <span>Fully settled</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${(totalSettled / totalSplits) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {totalSettled}/{totalSplits}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-start gap-1">
            {!isFullySettled && onDeleteExpense && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteExpense(expense.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={16} className="text-red-600 dark:text-red-400" />
              </button>
            )}
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && splits.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Split Details</h4>
            
            {splits.map((split: any) => (
              <div key={split.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {split.user?.firstName?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {split.user?.firstName || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
                      px-3 py-1 text-xs font-medium rounded-full transition-all
                      ${split.settled 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {split.settled ? 'Settled' : 'Mark settled'}
                  </button>
                )}
              </div>
            ))}
            
            {expense.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">{expense.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}