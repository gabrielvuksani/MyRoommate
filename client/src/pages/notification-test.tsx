import { useState } from 'react';
import { notificationService } from '@/lib/notifications';

export default function NotificationTestPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testNotifications = async () => {
    setIsLoading(true);
    setTestResult('Testing notification system...');
    
    try {
      // First test: Check service worker registration
      if (!('serviceWorker' in navigator)) {
        setTestResult('❌ Service Worker not supported');
        return;
      }
      
      // Second test: Check notification permissions
      const permission = await notificationService.requestPermission();
      if (!permission) {
        setTestResult('❌ Notification permission denied');
        return;
      }
      
      // Third test: Subscribe to push notifications
      const subscribed = await notificationService.subscribeToPush();
      if (!subscribed) {
        setTestResult('❌ Failed to subscribe to push notifications');
        return;
      }
      
      // Fourth test: Send test notification via server
      const response = await fetch('/api/push/test', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setTestResult('✅ Enhanced notification system is working! Check for background notification.');
      } else {
        setTestResult('❌ Failed to send test notification');
      }
      
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Notification System Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={testNotifications}
            disabled={isLoading}
            className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-xl font-medium disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Enhanced Notifications'}
          </button>
          
          {testResult && (
            <div className="p-4 bg-card text-card-foreground rounded-xl">
              {testResult}
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Test Instructions:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Click "Test Enhanced Notifications"</li>
              <li>Allow notification permissions</li>
              <li>Close the app completely</li>
              <li>Wait 15+ minutes</li>
              <li>Test notification should still appear instantly</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}