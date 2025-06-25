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

  if (choreStreaks.length === 0 && totalCompletedToday === 0) return null;

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
        
        {choreStreaks.length > 0 && <div className="space-y-3">
          {choreStreaks.map((chore, index) => {
            const isFirst = index === 0;
            const badgeColors = [
              'from-yellow-400 to-orange-500', // Gold
              'from-gray-300 to-gray-500',     // Silver
              'from-amber-600 to-orange-700'   // Bronze
            ];
            
            return (
              <div key={chore.id} className={`flex items-center justify-between p-3 rounded-xl ${isFirst ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-ios-gray-2'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r ${badgeColors[index]} text-white text-ios-body font-bold shadow-md`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-ios-body font-semibold text-black">{chore.title}</p>
                    <p className="text-ios-caption text-ios-gray-5">
                      {chore.assignedUser?.firstName || 'Unassigned'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 bg-white rounded-full px-3 py-1 shadow-sm">
                    <span className="text-xl">🔥</span>
                    <span className="text-ios-subhead font-bold text-ios-orange">{chore.streak}</span>
                    <span className="text-ios-caption text-ios-gray-5">days</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>}
        
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