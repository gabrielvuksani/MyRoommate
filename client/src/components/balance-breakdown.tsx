import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, CheckCircle } from 'lucide-react';
import QuickAvatar from './ui/QuickAvatar';

interface BalanceBreakdownProps {
  expenses: any[];
  currentUserId: string;
  householdMembers: any[];
}

export default function BalanceBreakdown({ expenses, currentUserId, householdMembers }: BalanceBreakdownProps) {
  const balanceDetails = useMemo(() => {
    // Calculate individual balances between the current user and each household member
    const memberBalances: Record<string, { owesMe: number; iOweThey: number; member: any }> = {};
    
    // Initialize member balances
    householdMembers.forEach(member => {
      if (member.userId !== currentUserId) {
        memberBalances[member.userId] = {
          owesMe: 0,
          iOweThey: 0,
          member: member
        };
      }
    });
    
    // Process all expenses
    expenses.forEach(expense => {
      if (!expense.splits) return;
      
      expense.splits.forEach((split: any) => {
        if (split.settled) return; // Skip settled splits
        
        const amount = parseFloat(split.amount);
        
        if (expense.paidBy === currentUserId && split.userId !== currentUserId) {
          // I paid, they owe me
          if (memberBalances[split.userId]) {
            memberBalances[split.userId].owesMe += amount;
          }
        } else if (expense.paidBy !== currentUserId && split.userId === currentUserId) {
          // They paid, I owe them
          if (memberBalances[expense.paidBy]) {
            memberBalances[expense.paidBy].iOweThey += amount;
          }
        }
      });
    });
    
    // Calculate net balances
    const netBalances = Object.entries(memberBalances).map(([userId, balance]) => {
      const netAmount = balance.owesMe - balance.iOweThey;
      return {
        userId,
        member: balance.member,
        netAmount,
        owesMe: balance.owesMe,
        iOweThey: balance.iOweThey,
        simplified: netAmount !== 0
      };
    }).filter(b => b.simplified); // Only show non-zero balances
    
    // Sort by absolute amount (highest first)
    netBalances.sort((a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount));
    
    return netBalances;
  }, [expenses, currentUserId, householdMembers]);

  if (balanceDetails.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-3 text-center">
            <CheckCircle size={24} className="text-green-500" />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              All expenses are settled!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Who Owes Who
        </h3>
        
        <div className="space-y-3">
          {balanceDetails.map(({ userId, member, netAmount, owesMe, iOweThey }) => {
            const displayName = member.user?.firstName || member.user?.email?.split('@')[0] || 'Unknown';
            const isOwedToMe = netAmount > 0;
            
            return (
              <div 
                key={userId}
                className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: 'var(--surface-secondary)' }}
              >
                <div className="flex items-center space-x-3">
                  <QuickAvatar
                    user={member.user}
                    size="sm"
                    gradientType="blue"
                  />
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {displayName}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {isOwedToMe ? 'owes you' : 'you owe'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p 
                      className="font-bold text-lg"
                      style={{ color: isOwedToMe ? '#10b981' : '#ef4444' }}
                    >
                      ${Math.abs(netAmount).toFixed(2)}
                    </p>
                    {(owesMe > 0 && iOweThey > 0) && (
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        net of ${owesMe.toFixed(2)} - ${iOweThey.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <ArrowRight 
                    size={16} 
                    style={{ color: isOwedToMe ? '#10b981' : '#ef4444' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
            Tap on any expense card above to see details
          </p>
        </div>
      </CardContent>
    </Card>
  );
}