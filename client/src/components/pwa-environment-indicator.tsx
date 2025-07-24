/**
 * PWA Environment Indicator
 * Shows current app environment (PWA vs Browser) for testing
 */

import { useState, useEffect } from 'react';
import { pwaDetection } from '@/lib/pwa-detection';
import { unifiedNotifications } from '@/lib/unified-notifications';
import { Smartphone, Monitor, Globe, AlertTriangle } from 'lucide-react';

export function PWAEnvironmentIndicator() {
  const [environment, setEnvironment] = useState<any>(null);
  const [notificationInfo, setNotificationInfo] = useState<any>(null);

  useEffect(() => {
    const env = pwaDetection.getEnvironment();
    const notifInfo = unifiedNotifications.getEnvironmentInfo();
    
    setEnvironment(env);
    setNotificationInfo(notifInfo);
  }, []);

  if (!environment) return null;

  const getEnvironmentIcon = () => {
    if (environment.isInstalled) {
      return <Smartphone className="w-4 h-4 text-green-600" />;
    }
    if (environment.platform === 'desktop') {
      return <Monitor className="w-4 h-4 text-blue-600" />;
    }
    return <Globe className="w-4 h-4 text-orange-600" />;
  };

  const getEnvironmentText = () => {
    if (environment.isInstalled) {
      return `PWA - ${environment.platform}`;
    }
    return `Browser - ${environment.platform}`;
  };

  const getNotificationStrategy = () => {
    if (!notificationInfo) return 'Unknown';
    
    switch (notificationInfo.strategy) {
      case 'pwa': return 'Push Notifications';
      case 'web': return 'Web Notifications';
      case 'none': return 'No Notifications';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-surface backdrop-blur-xl border border-border rounded-lg p-3 shadow-lg max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        {getEnvironmentIcon()}
        <span className="text-sm font-medium text-primary">
          {getEnvironmentText()}
        </span>
      </div>
      
      <div className="text-xs text-secondary space-y-1">
        <div>Display: {environment.displayMode}</div>
        <div>Notifications: {getNotificationStrategy()}</div>
        {notificationInfo?.permission && (
          <div>Permission: {notificationInfo.permission}</div>
        )}
        {environment.canInstall && (
          <div className="flex items-center gap-1 text-orange-600">
            <AlertTriangle className="w-3 h-3" />
            Can install PWA
          </div>
        )}
      </div>
    </div>
  );
}