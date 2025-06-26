interface ExpenseCardProps {
  expense: any;
  onSettleExpense?: (params: { splitId: string; settled: boolean }) => void;
  onDeleteExpense?: (id: string) => void;
  showSettlement?: boolean;
}

export default function ExpenseCard({ expense, onSettleExpense, onDeleteExpense, showSettlement = true }: ExpenseCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'groceries':
      case 'food':
        return '🛒';
      case 'utilities':
      case 'electric':
      case 'gas':
        return '⚡';
      case 'rent':
        return '🏠';
      case 'entertainment':
        return '🍕';
      default:
        return '💳';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'groceries':
      case 'food':
        return 'bg-ios-green';
      case 'utilities':
      case 'electric':
      case 'gas':
        return 'bg-ios-blue';
      case 'rent':
        return 'bg-ios-red';
      case 'entertainment':
        return 'bg-ios-orange';
      default:
        return 'bg-ios-gray-5';
    }
  };

  const splits = expense.splits || [];
  const totalSettled = splits.filter((split: any) => split.settled).length;
  const totalSplits = splits.length;
  const isFullySettled = totalSplits > 0 && totalSettled === totalSplits;

  return (
    <div className="rounded-xl p-4" style={{
      border: '1px solid var(--border-color)',
      background: 'var(--surface)'
    }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
            background: expense.category === 'groceries' || expense.category === 'food' ? '#30D158' :
                       expense.category === 'utilities' ? 'var(--primary)' :
                       expense.category === 'rent' ? '#AF52DE' :
                       expense.category === 'entertainment' ? '#FF9F0A' :
                       'var(--text-secondary)'
          }}>
            <span className="text-white text-lg">{getCategoryIcon(expense.category)}</span>
          </div>
          <div>
            <p className="text-body font-semibold" style={{ color: 'var(--primary)' }}>{expense.title}</p>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
              Paid by {expense.paidByUser?.firstName || expense.paidByUser?.email?.split('@')[0] || 'Unknown'}
            </p>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
              {new Date(expense.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end space-x-2 mb-2">
            <p className="text-title-3 font-bold" style={{ color: 'var(--primary)' }}>${parseFloat(expense.amount).toFixed(2)}</p>
            {isFullySettled ? (
              <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{
                background: 'rgba(48, 209, 88, 0.1)',
                color: '#30D158'
              }}>
                Settled
              </span>
            ) : onDeleteExpense ? (
              <button
                onClick={() => onDeleteExpense(expense.id)}
                className="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-medium transition-colors"
              >
                Delete
              </button>
            ) : null}
          </div>
          {!isFullySettled && (
            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700">
              {`${totalSettled}/${totalSplits} settled`}
            </span>
          )}
        </div>
      </div>

      {/* Split Details */}
      <div className="space-y-2">
        {splits.map((split: any) => (
          <div key={split.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">
              {split.user?.firstName || split.user?.email?.split('@')[0] || 'Unknown'}
            </span>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">${parseFloat(split.amount).toFixed(2)}</span>
              {showSettlement && onSettleExpense && (
                <button
                  onClick={() => onSettleExpense({ splitId: split.id, settled: !split.settled })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    split.settled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {split.settled ? 'Settled' : 'Settle'}
                </button>
              )}
              {!showSettlement && (
                <span className={`px-2 py-1 rounded text-xs ${
                  split.settled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {split.settled ? 'Settled' : 'Pending'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
