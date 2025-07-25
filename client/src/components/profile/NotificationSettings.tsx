import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Smartphone, Monitor, AlertTriangle } from "lucide-react";
import { unifiedNotifications } from "@/lib/unified-notifications";

interface NotificationSettingsProps {
  canShowNotifications: boolean;
  notificationInfo: any;
  notificationSettings: any;
  isTestingNotification: boolean;
  onToggle: (type: string, enabled: boolean) => void;
  onTest: () => void;
}

export const NotificationSettings = React.memo(({ 
  canShowNotifications, 
  notificationInfo, 
  notificationSettings,
  isTestingNotification,
  onToggle,
  onTest
}: NotificationSettingsProps) => {
  if (!canShowNotifications) return null;

  const notificationTypes = [
    { id: 'messages', label: 'New Messages', description: 'When someone sends a message' },
    { id: 'chores', label: 'Chore Updates', description: 'When chores are assigned or completed' },
    { id: 'expenses', label: 'Expense Updates', description: 'When expenses are added or settled' },
    { id: 'calendar', label: 'Calendar Events', description: 'When events are created or updated' },
    { id: 'household', label: 'Household Updates', description: 'When members join or leave' },
  ];

  return (
    <Card className="glass-card" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)'
    }}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Notifications
          </h3>
          <Bell className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </div>

        {/* Environment Info */}
        {notificationInfo && (
          <div className="mb-6 p-4 rounded-xl" style={{ 
            background: 'var(--surface-secondary)',
            border: '1px solid var(--border)'
          }}>
            <div className="flex items-center gap-2 mb-2">
              {notificationInfo.supportLevel === 'full' && <Smartphone className="w-4 h-4 text-green-600" />}
              {notificationInfo.supportLevel === 'partial' && <Monitor className="w-4 h-4 text-blue-600" />}
              {notificationInfo.supportLevel === 'none' && <AlertTriangle className="w-4 h-4 text-orange-600" />}

              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {notificationInfo.supportLevel === 'full' && 'Full Support - Push Notifications'}
                {notificationInfo.supportLevel === 'partial' && 'Partial Support - Browser Notifications'}
                {notificationInfo.supportLevel === 'none' && (
                  notificationInfo.requiresInstall ? 'Install App for Notifications' : 'Notifications Blocked'
                )}
              </span>
            </div>
            {notificationInfo.supportLevel === 'none' && notificationInfo.requiresInstall && (
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {notificationInfo.environment?.platform.includes('iOS') 
                  ? 'Add to Home Screen from Safari to enable push notifications'
                  : 'Install the app to enable push notifications'}
              </p>
            )}
          </div>
        )}

        {/* Master Toggle */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border transition-colors" style={{ 
            borderColor: 'var(--border)',
            background: notificationSettings?.enabled ? 'var(--surface-secondary)' : 'transparent'
          }}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Enable Notifications
                </p>
                {notificationInfo?.permission && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    notificationInfo.permission === 'granted' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : notificationInfo.permission === 'denied'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {notificationInfo.permission === 'granted' ? 'Allowed' : 
                     notificationInfo.permission === 'denied' ? 'Blocked' : 'Permission needed'}
                  </span>
                )}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Receive notifications for household activities
              </p>
            </div>
            <Switch
              checked={notificationSettings?.enabled || false}
              onCheckedChange={(checked) => onToggle('enabled', checked)}
              disabled={notificationInfo?.permission === 'denied' || notificationInfo?.requiresInstall}
            />
          </div>

          {/* Individual Notification Types - Only show when enabled AND permission granted */}
          {notificationSettings?.enabled && notificationInfo?.permission === 'granted' && (
            <div className="space-y-3 mt-4">
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Notification Types
              </p>
              {notificationTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between p-3 rounded-lg" style={{ 
                  background: 'var(--surface-secondary)' 
                }}>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {type.label}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {type.description}
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings?.types?.[type.id] ?? true}
                    onCheckedChange={(checked) => onToggle(type.id, checked)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

NotificationSettings.displayName = 'NotificationSettings';