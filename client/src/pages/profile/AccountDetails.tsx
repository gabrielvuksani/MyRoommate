import { Card, CardContent } from "@/components/ui/card";

interface AccountDetailsProps {
  user: any;
}

export default function AccountDetails({ user }: AccountDetailsProps) {
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
              title={String(user.id || '')}
            >
              {String(user.id || 'N/A')}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span style={{ color: 'var(--text-secondary)' }}>Member since</span>
            <span style={{ color: 'var(--text-primary)' }}>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}