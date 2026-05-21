import { useEffect, useState } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('Notifications are not supported in this browser');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  const showNotification = (options: NotificationOptions): boolean => {
    if (!isSupported || permission !== 'granted') {
      console.warn('Notifications are not enabled');
      return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/src/assets/logo.png',
        tag: options.tag,
        requireInteraction: true,
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click events
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  };

  const showMessageNotification = (senderName: string, message: string) => {
    return showNotification({
      title: `New message from ${senderName}`,
      body: message.length > 50 ? message.substring(0, 50) + '...' : message,
      tag: 'new-message',
    });
  };

  const showFileNotification = (senderName: string, fileName: string) => {
    return showNotification({
      title: `File shared by ${senderName}`,
      body: `${fileName} has been shared with you`,
      tag: 'file-shared',
    });
  };

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showMessageNotification,
    showFileNotification,
  };
}
