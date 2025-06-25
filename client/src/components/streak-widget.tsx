import { Card, CardContent } from "@/components/ui/card";

interface StreakWidgetProps {
  chores: any[];
}

export default function StreakWidget({ chores }: StreakWidgetProps) {
  // Get chores with streaks
  const choreStreaks = chores
    .filter(chore => chore.streak && chore.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3);

  const totalCompletedToday = chores.filter(chore => 
    chore.status === 'done' && 
    chore.completedAt && 
    new Date(chore.completedAt).toDateString() === new Date().toDateString()
  ).length;

  if (choreStreaks.length === 0) return null;

  return (
    <Card className="smart-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-ios-headline font-semibold text-black">Streak Leaders</h3>
          <div className="flex items-center space-x-1">
            <span className="text-ios-subhead font-bold text-ios-green">{totalCompletedToday}</span>
            <span className="text-ios-caption text-ios-gray-5">today</span>
          </div>
        </div>
        
        <div className="space-y-3">
          {choreStreaks.map((chore, index) => (
            <div key={chore.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-red-500 text-white text-ios-caption font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="text-ios-body font-medium text-black">{chore.title}</p>
                  <p className="text-ios-caption text-ios-gray-5">
                    {chore.assignedUser?.firstName || 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <span className="text-xl">🔥</span>
                  <span className="text-ios-body font-bold text-ios-orange">{chore.streak}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {totalCompletedToday > 0 && (
          <div className="mt-4 pt-3 border-t border-ios-gray-3">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg">🎉</span>
              <span className="text-ios-caption text-ios-gray-5">
                {totalCompletedToday} {totalCompletedToday === 1 ? 'chore' : 'chores'} completed today
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}