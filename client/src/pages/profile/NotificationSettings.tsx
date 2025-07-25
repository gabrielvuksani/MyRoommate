import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Bell, Smartphone, Monitor, AlertTriangle } from "lucide-react";

interface NotificationSettingsProps {
  notificationInfo: any;
  notificationSettings: any;
  handleNotificationToggle: (type: string, enabled: boolean) => void;
}

export default function NotificationSettings({
  notificationInfo,
  notificationSettings,
  handleNotificationToggle,
}: NotificationSettingsProps) {
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
                  notificationInfo.requiresInstall ? 'App Installation Required' : 'Limited Support'
                )}
              </span>
              
              {notificationInfo.permission && (
                <span 
                  className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    notificationInfo.permission === 'granted' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                      : notificationInfo.permission === 'denied'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                  }`}
                >
                  {notificationInfo.permission === 'granted' ? 'Allowed' : 
                   notificationInfo.permission === 'denied' ? 'Blocked' : 'Permission needed'}
                </span>
              )}
            </div>
            
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {notificationInfo.supportLevel === 'full' 
                ? 'You can receive notifications even when the app is closed.'
                : notificationInfo.supportLevel === 'partial'
                ? 'Notifications work while your browser is open.'
                : notificationInfo.requiresInstall
                ? 'Install the app to enable background notifications.'
                : 'Enable notifications in your browser settings.'}
            </p>
          </div>
        )}

        {/* Master Toggle */}
        <div className="flex items-center justify-between py-3 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <span style={{ color: 'var(--text-primary)' }}>Enable Notifications</span>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              {notificationInfo?.requiresInstall 
                ? 'Install the app first to enable notifications'
                : notificationInfo?.permission === 'denied'
                ? 'Blocked by browser - check your settings'
                : 'Get notified about household activities'}
            </p>
          </div>
          <Switch
            checked={notificationSettings?.enabled || false}
            onCheckedChange={(checked) => handleNotificationToggle('enabled', checked)}
            disabled={notificationInfo?.requiresInstall || notificationInfo?.permission === 'denied'}
          />
        </div>

        {/* Individual Notification Types - Only show when master is enabled AND permission granted */}
        {notificationSettings?.enabled && notificationInfo?.permission === 'granted' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>New Messages</span>
              <Switch
                checked={notificationSettings?.types?.messages || false}
                onCheckedChange={(checked) => handleNotificationToggle('messages', checked)}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Chore Assignments</span>
              <Switch
                checked={notificationSettings?.types?.chores || false}
                onCheckedChange={(checked) => handleNotificationToggle('chores', checked)}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>New Expenses</span>
              <Switch
                checked={notificationSettings?.types?.expenses || false}
                onCheckedChange={(checked) => handleNotificationToggle('expenses', checked)}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Calendar Events</span>
              <Switch
                checked={notificationSettings?.types?.calendar || false}
                onCheckedChange={(checked) => handleNotificationToggle('calendar', checked)}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Household Updates</span>
              <Switch
                checked={notificationSettings?.types?.household || false}
                onCheckedChange={(checked) => handleNotificationToggle('household', checked)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}