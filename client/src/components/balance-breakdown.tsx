import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { QuickAvatar } from './ProfileAvatar';

interface BalanceBreakdownProps {
  expenses: any[];
  currentUserId: string;
  householdMembers: any[];
}

export default function BalanceBreakdown({ expenses, currentUserId, householdMembers }: BalanceBreakdownProps) {
  const balanceDetails = useMemo(() => {
    // Calculate individual balances between the current user and each household member
    const memberBalances: Record<string, { owesMe: number; iOweThey: number; member: any }> = {};

    // Initialize member balances for all household members except current user
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
      if (!expense.splits || !Array.isArray(expense.splits)) return;

      // For each expense, process all splits
      expense.splits.forEach((split: any) => {
        // Skip if split is already settled
        if (split.settled) return;

        const splitAmount = parseFloat(split.amount) || 0;
        if (splitAmount <= 0) return; // Skip invalid amounts

        // Case 1: Current user paid for this expense
        if (expense.paidBy === currentUserId) {
          // Other users owe the current user their split amounts
          if (split.userId !== currentUserId && memberBalances[split.userId]) {
            memberBalances[split.userId].owesMe += splitAmount;
          }
        }
        // Case 2: Someone else paid, and current user has a split
        else if (split.userId === currentUserId && expense.paidBy && memberBalances[expense.paidBy]) {
          // Current user owes the payer
          memberBalances[expense.paidBy].iOweThey += splitAmount;
        }
      });
    });

    // Calculate net balances and create final array
    const netBalances = Object.entries(memberBalances)
      .map(([userId, balance]) => {
        const netAmount = balance.owesMe - balance.iOweThey;
        return {
          userId,
          member: balance.member,
          netAmount: Math.round(netAmount * 100) / 100, // Round to 2 decimal places
          owesMe: Math.round(balance.owesMe * 100) / 100,
          iOweThey: Math.round(balance.iOweThey * 100) / 100,
          hasBalance: Math.abs(netAmount) >= 0.01 // Only show if balance is at least 1 cent
        };
      })
      .filter(b => b.hasBalance) // Only show non-zero balances
      .sort((a, b) => Math.abs(b.netAmount) - Math.abs(a.netAmount)); // Sort by absolute amount

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Simplified Balances
          </h3>
          <span className="text-xs px-2 py-1 rounded-lg" style={{ 
            background: 'var(--surface-secondary)',
            color: 'var(--text-secondary)' 
          }}>
            {balanceDetails.length} {balanceDetails.length === 1 ? 'balance' : 'balances'}
          </span>
        </div>

        <div className="space-y-3">
          {balanceDetails.map(({ userId, member, netAmount, owesMe, iOweThey }) => {
            const displayName = member.user?.firstName || member.user?.email?.split('@')[0] || 'Unknown';
            const isOwedToMe = netAmount > 0;

            return (
              <div 
                key={userId}
                className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.02]"
                style={{ 
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border-color)'
                }}
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
                    <p className="text-xs font-medium" style={{ 
                      color: isOwedToMe ? '#10b981' : '#ef4444' 
                    }}>
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
                        simplified from ${owesMe.toFixed(2)} ↔ ${iOweThey.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 space-y-1">
          <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
            These are net balances after simplifying mutual debts
          </p>
          <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
            Click any expense card below to see full details and splits
          </p>
        </div>
      </CardContent>
    </Card>
  );
}