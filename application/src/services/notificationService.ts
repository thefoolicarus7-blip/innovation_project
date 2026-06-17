import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface AppNotification {
  id: string;
  applicationId: string;
  jobTitle: string;
  companyName?: string;
  jobImage?: string;
  status: 'Selected' | 'Rejected' | 'Interview' | 'Shortlisted';
  message: string;
  timestamp: string;
  read: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = 'swipe2work_notifications';
const LAST_CHECKED_KEY = 'swipe2work_last_notification_check';

export const notificationService = {
  /** Load persisted notifications from local storage */
  getStoredNotifications: async (userId: string): Promise<AppNotification[]> => {
    try {
      const raw = await AsyncStorage.getItem(`${NOTIFICATIONS_STORAGE_KEY}_${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /** Persist notifications to local storage */
  saveNotifications: async (userId: string, notifications: AppNotification[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        `${NOTIFICATIONS_STORAGE_KEY}_${userId}`,
        JSON.stringify(notifications),
      );
    } catch (e) {
      console.warn('Failed to save notifications', e);
    }
  },

  /** Mark all notifications as read */
  markAllRead: async (userId: string, notifications: AppNotification[]): Promise<AppNotification[]> => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    await notificationService.saveNotifications(userId, updated);
    return updated;
  },

  /** Mark a single notification as read */
  markOneRead: async (
    userId: string,
    notifications: AppNotification[],
    id: string,
  ): Promise<AppNotification[]> => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n,
    );
    await notificationService.saveNotifications(userId, updated);
    return updated;
  },

  /** Poll server for new application status updates */
  checkForUpdates: async (
    userId: string,
    existingNotifications: AppNotification[],
  ): Promise<AppNotification[]> => {
    try {
      const response = await api.get('/applications?tab=matches&limit=50');
      const applications: any[] = response.data.items ?? [];

      const existingIds = new Set(existingNotifications.map(n => n.applicationId));
      const existingStatusMap = new Map(
        existingNotifications.map(n => [n.applicationId, n.status]),
      );

      const newNotifications: AppNotification[] = [];

      for (const app of applications) {
        const status = app.status as string;
        const notifiableStatuses = ['Selected', 'Rejected', 'Interview', 'Shortlisted'];

        if (!notifiableStatuses.includes(status)) continue;

        // If we've never seen this app, or its status changed — create notification
        const prevStatus = existingStatusMap.get(app._id);
        if (!existingIds.has(app._id) || prevStatus !== status) {
          const notif: AppNotification = {
            id: `${app._id}_${status}_${Date.now()}`,
            applicationId: app._id,
            jobTitle: app.jobTitle ?? 'Job Application',
            companyName: app.companyName,
            jobImage: app.jobImage,
            status: status as AppNotification['status'],
            message: buildMessage(app.jobTitle, status),
            timestamp: new Date().toISOString(),
            read: false,
          };
          newNotifications.push(notif);
        }
      }

      if (newNotifications.length > 0) {
        // Remove stale notifications for the same applicationId, add new ones
        const updatedApplicationIds = new Set(newNotifications.map(n => n.applicationId));
        const filteredExisting = existingNotifications.filter(
          n => !updatedApplicationIds.has(n.applicationId),
        );
        const merged = [...newNotifications, ...filteredExisting].slice(0, 100);
        await notificationService.saveNotifications(userId, merged);
        return merged;
      }

      return existingNotifications;
    } catch (e) {
      console.warn('Notification poll failed', e);
      return existingNotifications;
    }
  },

  /** Also check the let_it_go (rejected) tab */
  checkRejections: async (
    userId: string,
    existingNotifications: AppNotification[],
  ): Promise<AppNotification[]> => {
    try {
      const response = await api.get('/applications?tab=let_it_go&limit=50');
      const applications: any[] = response.data.items ?? [];

      const existingIds = new Set(existingNotifications.map(n => n.applicationId));

      const newNotifications: AppNotification[] = [];

      for (const app of applications) {
        if (!existingIds.has(app._id) && app.status === 'Rejected') {
          const notif: AppNotification = {
            id: `${app._id}_Rejected_${Date.now()}`,
            applicationId: app._id,
            jobTitle: app.jobTitle ?? 'Job Application',
            companyName: app.companyName,
            jobImage: app.jobImage,
            status: 'Rejected',
            message: buildMessage(app.jobTitle, 'Rejected'),
            timestamp: new Date().toISOString(),
            read: false,
          };
          newNotifications.push(notif);
        }
      }

      if (newNotifications.length > 0) {
        const merged = [...newNotifications, ...existingNotifications].slice(0, 100);
        await notificationService.saveNotifications(userId, merged);
        return merged;
      }

      return existingNotifications;
    } catch {
      return existingNotifications;
    }
  },
};

function buildMessage(jobTitle: string, status: string): string {
  const title = jobTitle ?? 'your application';
  switch (status) {
    case 'Selected':
      return `🎉 Congratulations! You've been selected for "${title}". Check your email for next steps.`;
    case 'Interview':
      return `📅 You've been invited to interview for "${title}". Get ready to impress!`;
    case 'Shortlisted':
      return `⭐ Great news! You've been shortlisted for "${title}". Stay tuned for updates.`;
    case 'Rejected':
      return `We regret to inform you that your application for "${title}" was not successful. Keep going — the right opportunity is ahead!`;
    default:
      return `Your application for "${title}" has been updated to: ${status}.`;
  }
}
