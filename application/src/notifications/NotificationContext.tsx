import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService, AppNotification } from '../services/notificationService';
import { pushNotificationService } from '../services/pushNotificationService';
import { useAuth } from '../auth/AuthContext';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isPolling: boolean;
  markAllRead: () => Promise<void>;
  markOneRead: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const unreadCount = notifications.filter(n => !n.read).length;

  /** Load from storage on mount */
  const loadStored = useCallback(async () => {
    if (!user?.id) return;
    const stored = await notificationService.getStoredNotifications(user.id);
    setNotifications(stored);
  }, [user?.id]);

  /** Poll server for new status changes */
  const poll = useCallback(async () => {
    if (!user?.id) return;
    setIsPolling(true);
    try {
      const current = await notificationService.getStoredNotifications(user.id);
      const currentIds = new Set(current.map(n => n.id));

      let updated = await notificationService.checkForUpdates(user.id, current);
      updated = await notificationService.checkRejections(user.id, updated);

      const newOnes = updated.filter(n => !currentIds.has(n.id));
      if (newOnes.length === 1) {
        await pushNotificationService.showJobNotification(newOnes[0]);
      } else if (newOnes.length > 1) {
        await pushNotificationService.showBatchNotification(newOnes.length);
      }

      setNotifications(updated);
    } finally {
      setIsPolling(false);
    }
  }, [user]);

  /** Public refresh (pull-to-refresh) */
  const refresh = useCallback(async () => {
    await poll();
  }, [poll]);

  const markAllRead = useCallback(async () => {
    if (!user?.id) return;
    const updated = await notificationService.markAllRead(user.id, notifications);
    setNotifications(updated);
  }, [notifications, user?.id]);

  const markOneRead = useCallback(
    async (id: string) => {
      if (!user?.id) return;
      const updated = await notificationService.markOneRead(user.id, notifications, id);
      setNotifications(updated);
    },
    [notifications, user?.id],
  );

  // Start/stop polling based on auth state
  useEffect(() => {
    if (!user) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setNotifications([]);
      return;
    }

    pushNotificationService.init();
    loadStored();
    poll(); // immediate first poll

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active' &&
        user
      ) {
        poll();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [poll, user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isPolling,
        markAllRead,
        markOneRead,
        refresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
