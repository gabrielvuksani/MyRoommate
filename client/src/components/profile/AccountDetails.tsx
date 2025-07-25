import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface AccountDetailsProps {
  user: {
    id: string;
    createdAt?: string;
  } | null;
}

export const AccountDetails = React.memo(({ user }: AccountDetailsProps) => {
  if (!user) return null;

  // Sanitize and validate user ID
  const sanitizedUserId = React.useMemo(() => {
    if (!user.id) return 'N/A';
    return String(user.id).slice(0, 50); // Limit length for security
  }, [user.id]);

  // Format date securely
  const memberSince = React.useMemo(() => {
    if (!user.createdAt) return 'N/A';
    try {
      const date = new Date(user.createdAt);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  }, [user.createdAt]);

  return (
    <Card 
      className="glass-card" 
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)'
      }}
    >
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Account details
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>User ID</span>
            <span
              className="font-mono text-sm truncate ml-4"
              style={{ color: 'var(--text-primary)' }}
              title={sanitizedUserId}
            >
              {sanitizedUserId}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span style={{ color: 'var(--text-secondary)' }}>Member since</span>
            <span style={{ color: 'var(--text-primary)' }}>
              {memberSince}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

AccountDetails.displayName = 'AccountDetails';