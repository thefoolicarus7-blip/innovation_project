import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import { AppNotification } from './notificationService';

const CHANNEL_ID = 'swipe2work_job_updates';

async function ensureChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Job Updates',
    importance: AndroidImportance.HIGH,
    description: 'Status updates for your job applications',
  });
}

function getTitle(status: AppNotification['status']): string {
  switch (status) {
    case 'Selected': return "You've been Selected!";
    case 'Interview': return 'Interview Invitation';
    case 'Shortlisted': return "You've been Shortlisted!";
    case 'Rejected': return 'Application Update';
  }
}

export const pushNotificationService = {
  init: async (): Promise<void> => {
    await ensureChannel();
    await notifee.requestPermission();
  },

  isPermissionGranted: async (): Promise<boolean> => {
    const settings = await notifee.getNotificationSettings();
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  },

  showJobNotification: async (notification: AppNotification): Promise<void> => {
    await ensureChannel();
    await notifee.displayNotification({
      id: notification.id,
      title: getTitle(notification.status),
      body: notification.message,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
        importance: AndroidImportance.HIGH,
      },
    });
  },

  showBatchNotification: async (count: number): Promise<void> => {
    await ensureChannel();
    await notifee.displayNotification({
      title: 'Job Application Updates',
      body: `You have ${count} new updates on your applications.`,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        pressAction: { id: 'default' },
        importance: AndroidImportance.HIGH,
      },
    });
  },
};
