import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { useNotifications } from '../notifications/NotificationContext';
import { AppNotification } from '../services/notificationService';

const STATUS_CONFIG: Record<
  AppNotification['status'],
  {
    icon: string;
    iconColor: string;
    bg: string;
    border: string;
    labelColor: string;
    label: string;
    headerBg: string;
  }
> = {
  Selected: {
    icon: 'party-popper',
    iconColor: '#1B5E20',
    bg: '#E8F5E9',
    border: '#A5D6A7',
    labelColor: '#1B5E20',
    label: 'Selected 🎉',
    headerBg: '#C8E6C9',
  },
  Interview: {
    icon: 'calendar-clock',
    iconColor: '#0D47A1',
    bg: '#E3F2FD',
    border: '#90CAF9',
    labelColor: '#0D47A1',
    label: 'Interview Invite 📅',
    headerBg: '#BBDEFB',
  },
  Shortlisted: {
    icon: 'star-circle',
    iconColor: '#E65100',
    bg: '#FFF3E0',
    border: '#FFCC80',
    labelColor: '#E65100',
    label: 'Shortlisted ⭐',
    headerBg: '#FFE0B2',
  },
  Rejected: {
    icon: 'close-circle',
    iconColor: '#B71C1C',
    bg: '#FFEBEE',
    border: '#EF9A9A',
    labelColor: '#B71C1C',
    label: 'Not Selected',
    headerBg: '#FFCDD2',
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const NotificationsScreen = ({ navigation }: any) => {
  const { notifications, unreadCount, isPolling, markAllRead, markOneRead, refresh } =
    useNotifications();

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
  }, [markAllRead]);

  const handleNotificationPress = useCallback(
    async (notif: AppNotification) => {
      if (!notif.read) {
        await markOneRead(notif.id);
      }
    },
    [markOneRead],
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#FAF9FB' }}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.avatarPlaceholder} />
          </TouchableOpacity>
          <Text style={styles.brandText}>SWIPE2WORK</Text>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 80 }} />
          )}
        </View>

        {/* Sub Header */}
        <View style={styles.subHeader}>
          <Text style={styles.eyebrow}>UPDATES</Text>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isPolling}
              onRefresh={refresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: 8 }} />

          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <Icon name="bell-sleep-outline" size={56} color={Colors.outline_variant} />
              </View>
              <Text style={styles.emptyTitle}>You're all caught up!</Text>
              <Text style={styles.emptySubtitle}>
                We'll notify you here when employers update your application status.
              </Text>
            </View>
          ) : (
            notifications.map(notif => {
              const cfg = STATUS_CONFIG[notif.status] ?? STATUS_CONFIG.Rejected;
              return (
                <TouchableOpacity
                  key={notif.id}
                  activeOpacity={0.85}
                  onPress={() => handleNotificationPress(notif)}
                  style={[
                    styles.notifCard,
                    { borderColor: cfg.border, backgroundColor: notif.read ? '#FFF' : cfg.bg },
                  ]}
                >
                  {/* Unread dot */}
                  {!notif.read && <View style={[styles.unreadDot, { backgroundColor: cfg.iconColor }]} />}

                  {/* Top row: image + status chip + time */}
                  <View style={styles.notifTop}>
                    {notif.jobImage ? (
                      <Image source={{ uri: notif.jobImage }} style={styles.jobImage} />
                    ) : (
                      <View style={[styles.jobImageFallback, { backgroundColor: cfg.headerBg }]}>
                        <Icon name={cfg.icon} size={26} color={cfg.iconColor} />
                      </View>
                    )}

                    <View style={styles.notifMeta}>
                      <View style={[styles.statusChip, { backgroundColor: cfg.headerBg, borderColor: cfg.border }]}>
                        <Icon name={cfg.icon} size={13} color={cfg.iconColor} style={{ marginRight: 4 }} />
                        <Text style={[styles.statusChipText, { color: cfg.iconColor }]}>
                          {cfg.label}
                        </Text>
                      </View>
                      <Text style={styles.timeText}>{timeAgo(notif.timestamp)}</Text>
                    </View>
                  </View>

                  {/* Job title */}
                  <Text style={styles.jobTitle} numberOfLines={2}>
                    {notif.jobTitle}
                  </Text>
                  {notif.companyName ? (
                    <Text style={styles.companyName}>{notif.companyName}</Text>
                  ) : null}

                  {/* Message */}
                  <Text style={styles.message}>{notif.message}</Text>
                </TouchableOpacity>
              );
            })
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary_container,
  },
  brandText: {
    ...Typography.titleMd,
    color: Colors.primary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  markAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markAllText: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: '600',
  },
  subHeader: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  eyebrow: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pageTitle: {
    ...Typography.displaySm,
    color: Colors.on_surface,
    fontWeight: 'bold',
  },
  unreadBadge: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface_container,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    ...Typography.titleMd,
    color: Colors.on_surface,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.bodyMd,
    color: Colors.outline,
    textAlign: 'center',
    lineHeight: 22,
  },
  notifCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  notifTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  jobImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.surface_variant,
  },
  jobImageFallback: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifMeta: {
    flex: 1,
    gap: 6,
  },
  statusChip: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeText: {
    ...Typography.labelSm,
    color: Colors.outline,
  },
  jobTitle: {
    ...Typography.titleMd,
    color: Colors.on_surface,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  companyName: {
    ...Typography.bodyMd,
    color: Colors.outline,
    marginBottom: 8,
  },
  message: {
    ...Typography.bodyMd,
    color: Colors.on_surface_variant,
    lineHeight: 20,
    marginTop: 6,
  },
});
