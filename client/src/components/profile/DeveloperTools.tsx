import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Bell } from "lucide-react";
import { PersistentLoading } from "@/lib/persistentLoading";
import { unifiedNotifications } from "@/lib/unified-notifications";

interface DeveloperToolsProps {
  notificationInfo: any;
  notificationSettings: any;
  isTestingNotification: boolean;
  onTestNotification: () => void;
}

export const DeveloperTools = React.memo(({ 
  notificationInfo, 
  notificationSettings,
  isTestingNotification,
  onTestNotification
}: DeveloperToolsProps) => {
  const handleRefresh = React.useCallback(async () => {
    try {
      PersistentLoading.show("Refreshing app data...");
      
      // Clear all browser cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear IndexedDB
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases?.() || [];
        await Promise.all(databases.map(db => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        }));
      }
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }
      
      setTimeout(() => {
        PersistentLoading.hide();
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      console.error("Refresh error:", error);
      PersistentLoading.hide();
      window.location.href = "/";
    }
  }, []);

  return (
    <Card className="glass-card" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)'
    }}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Developer Tools
        </h3>
        <div className="space-y-3">
          <Button
            onClick={handleRefresh}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-blue-700"
          >
            <RefreshCw size={20} />
            <span>Refresh App & Data</span>
          </Button>
          <Button
            onClick={onTestNotification}
            disabled={isTestingNotification || (!notificationSettings?.enabled && !notificationInfo?.requiresInstall)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bell size={20} className={isTestingNotification ? "animate-pulse" : ""} />
            <span>
              {isTestingNotification ? "Sending test notification..." : 
               notificationInfo?.requiresInstall ? "Install App for Notifications" :
               notificationInfo?.permission === 'denied' ? "Enable in Browser Settings" :
               "Test Notifications"}
            </span>
          </Button>
          
          {/* PWA Environment Information */}
          <div className="mt-4 p-4 rounded-xl border" style={{ 
            background: 'var(--surface-secondary)', 
            borderColor: 'var(--border)' 
          }}>
            <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
              Environment Info
            </h4>
            <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <div>Platform: {notificationInfo?.environment?.platform || 'Unknown'}</div>
              <div>Installed: {notificationInfo?.environment?.isInstalled ? 'Yes' : 'No'}</div>
              <div>Strategy: {notificationInfo?.strategy || 'None'}</div>
              <div>Permission: {notificationInfo?.environment?.permission || 'N/A'}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

DeveloperTools.displayName = 'DeveloperTools';