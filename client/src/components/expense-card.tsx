interface ExpenseCardProps {
  expense: any;
}

export default function ExpenseCard({ expense }: ExpenseCardProps) {
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

  const totalUserAmount = expense.splits
    .filter((split: any) => !split.settled)
    .reduce((sum: number, split: any) => sum + parseFloat(split.amount), 0);

  return (
    <div className="flex items-center justify-between py-2 border-b border-ios-gray-2 last:border-b-0">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 ${getCategoryColor(expense.category)} rounded-lg flex items-center justify-center`}>
          <span className="text-white text-ios-footnote">{getCategoryIcon(expense.category)}</span>
        </div>
        <div>
          <p className="text-ios-body font-medium text-black">{expense.title}</p>
          <p className="text-ios-footnote text-ios-gray-5">
            Split {expense.splits.length} ways • {new Date(expense.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-ios-body font-medium text-black">${parseFloat(expense.amount).toFixed(2)}</p>
        {totalUserAmount > 0 && (
          <p className="text-ios-footnote text-ios-green">+${totalUserAmount.toFixed(2)}</p>
        )}
      </div>
    </div>
  );
}
