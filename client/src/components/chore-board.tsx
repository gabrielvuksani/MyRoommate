import { Card, CardContent } from "@/components/ui/card";

interface ChoresBoardProps {
  chores: any[];
  onUpdateChore: (id: string, updates: any) => void;
}

export default function ChoreBoard({ chores, onUpdateChore }: ChoresBoardProps) {
  const todoChores = chores.filter(chore => chore.status === 'todo');
  const doingChores = chores.filter(chore => chore.status === 'doing');
  const doneChores = chores.filter(chore => chore.status === 'done');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'border-ios-blue';
      case 'doing': return 'border-ios-orange';
      case 'done': return 'border-ios-green';
      default: return 'border-ios-gray-3';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-ios-blue';
      case 'doing': return 'bg-ios-orange';
      case 'done': return 'bg-ios-green';
      default: return 'bg-ios-gray-3';
    }
  };

  const ChoreCard = ({ chore }: { chore: any }) => {
    const isOverdue = chore.dueDate && new Date(chore.dueDate) < new Date() && chore.status !== 'done';
    
    return (
      <div className={`bg-ios-gray rounded-lg p-3 border-l-4 ${getStatusColor(chore.status)} ${chore.status === 'done' ? 'opacity-75' : ''}`}>
        <p className="text-ios-body font-medium text-black">{chore.title}</p>
        <p className="text-ios-footnote text-ios-gray-5 mt-1">
          {chore.assignedUser?.firstName || 'Unassigned'}
          {chore.dueDate && ` • Due ${new Date(chore.dueDate).toLocaleDateString()}`}
        </p>
        {isOverdue && (
          <div className="flex items-center mt-2 space-x-2">
            <span className="bg-ios-red text-white px-2 py-1 rounded text-ios-caption">Overdue</span>
          </div>
        )}
        {chore.status === 'done' && chore.streak > 0 && (
          <div className="flex items-center mt-2">
            <span className="text-ios-caption text-ios-green font-medium">🎉 Streak: {chore.streak} days</span>
          </div>
        )}
        
        <div className="flex space-x-2 mt-3">
          {chore.status === 'todo' && (
            <button
              onClick={() => onUpdateChore(chore.id, { status: 'doing' })}
              className="text-ios-caption text-ios-blue font-medium"
            >
              Start
            </button>
          )}
          {chore.status === 'doing' && (
            <button
              onClick={() => onUpdateChore(chore.id, { status: 'done', completedAt: new Date() })}
              className="text-ios-caption text-ios-green font-medium"
            >
              Complete
            </button>
          )}
          {chore.status === 'done' && (
            <button
              onClick={() => onUpdateChore(chore.id, { status: 'todo', completedAt: null })}
              className="text-ios-caption text-ios-blue font-medium"
            >
              Reopen
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* To-Do Column */}
      <Card className="card-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-ios-headline font-semibold text-black">To-Do</h2>
            <span className="bg-ios-gray-4 text-ios-gray-6 px-2 py-1 rounded-full text-ios-caption font-medium">
              {todoChores.length}
            </span>
          </div>
          <div className="space-y-3">
            {todoChores.length === 0 ? (
              <p className="text-ios-body text-ios-gray-5">No pending chores</p>
            ) : (
              todoChores.map(chore => <ChoreCard key={chore.id} chore={chore} />)
            )}
          </div>
        </CardContent>
      </Card>

      {/* In Progress Column */}
      <Card className="card-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-ios-headline font-semibold text-black">In Progress</h2>
            <span className="bg-ios-gray-4 text-ios-gray-6 px-2 py-1 rounded-full text-ios-caption font-medium">
              {doingChores.length}
            </span>
          </div>
          <div className="space-y-3">
            {doingChores.length === 0 ? (
              <p className="text-ios-body text-ios-gray-5">No chores in progress</p>
            ) : (
              doingChores.map(chore => <ChoreCard key={chore.id} chore={chore} />)
            )}
          </div>
        </CardContent>
      </Card>

      {/* Done Column */}
      <Card className="card-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-ios-headline font-semibold text-black">Completed</h2>
            <span className="bg-ios-gray-4 text-ios-gray-6 px-2 py-1 rounded-full text-ios-caption font-medium">
              {doneChores.length}
            </span>
          </div>
          <div className="space-y-3">
            {doneChores.length === 0 ? (
              <p className="text-ios-body text-ios-gray-5">No completed chores</p>
            ) : (
              doneChores.slice(0, 5).map(chore => <ChoreCard key={chore.id} chore={chore} />)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
