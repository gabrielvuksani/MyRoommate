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
            <p className="text-body font-semibold" style={{ color: 'var(--text-primary)' }}>
              {expense.title.charAt(0).toUpperCase() + expense.title.slice(1)}
            </p>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
              Paid by {expense.paidByUser?.firstName || expense.paidByUser?.email?.split('@')[0] || 'Unknown'}
            </p>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
              {new Date(expense.createdAt).toLocaleDateString()}
              {expense.isRecurring && expense.recurrenceFrequency && (
                <span> • 🔄 Repeats {expense.recurrenceFrequency}</span>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end space-x-2 mb-2">
            <p className="text-title-3 font-bold" style={{ color: 'var(--text-primary)' }}>${parseFloat(expense.amount).toFixed(2)}</p>
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
                className="px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: 'rgba(255, 59, 48, 0.1)',
                  color: '#FF3B30'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 59, 48, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)';
                }}
              >
                Delete
              </button>
            ) : null}
          </div>
          {!isFullySettled && (
            <span className="px-2 py-1 rounded-lg text-xs font-medium" style={{
              background: 'rgba(255, 159, 10, 0.1)',
              color: '#FF9F0A'
            }}>
              {`${totalSettled}/${totalSplits} settled`}
            </span>
          )}
        </div>
      </div>

      {expense.notes && (
        <div className="mb-3 p-3 rounded-lg" style={{ background: 'var(--surface-secondary)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            📝 {expense.notes}
          </p>
        </div>
      )}

      {/* Split Details */}
      <div className="space-y-2">
        {splits.map((split: any) => (
          <div key={split.id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{
            background: 'var(--surface-secondary)'
          }}>
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {split.user?.firstName || split.user?.email?.split('@')[0] || 'Unknown'}
            </span>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>${parseFloat(split.amount).toFixed(2)}</span>
              {showSettlement && onSettleExpense && (
                <button
                  onClick={() => onSettleExpense({ splitId: split.id, settled: !split.settled })}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: split.settled ? 'rgba(48, 209, 88, 0.1)' : 'rgba(0, 122, 255, 0.1)',
                    color: split.settled ? '#30D158' : '#007AFF'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = split.settled ? 'rgba(48, 209, 88, 0.2)' : 'rgba(0, 122, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = split.settled ? 'rgba(48, 209, 88, 0.1)' : 'rgba(0, 122, 255, 0.1)';
                  }}
                >
                  {split.settled ? 'Settled' : 'Settle'}
                </button>
              )}
              {!showSettlement && (
                <span className="px-2 py-1 rounded text-xs" style={{
                  background: split.settled ? 'rgba(48, 209, 88, 0.1)' : 'var(--surface-secondary)',
                  color: split.settled ? '#30D158' : 'var(--text-secondary)'
                }}>
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
