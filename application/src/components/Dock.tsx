import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { useNotifications } from '../notifications/NotificationContext';

interface DockProps {
  activeScreen: 'JobDiscovery' | 'Applied' | 'Notifications' | 'Profile';
  navigation: any;
}

export const Dock: React.FC<DockProps> = ({ activeScreen, navigation }) => {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  const tabs: {
    key: DockProps['activeScreen'];
    icon: string;
    label: string;
  }[] = [
    { key: 'JobDiscovery', icon: 'briefcase-search', label: 'DISCOVER' },
    { key: 'Applied', icon: 'file-document-outline', label: 'APPLIED' },
    { key: 'Notifications', icon: 'bell-outline', label: 'ALERTS' },
    { key: 'Profile', icon: 'account-outline', label: 'PROFILE' },
  ];

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bottomNav}>
        {tabs.map(tab => {
          const isActive = activeScreen === tab.key;
          const showBadge = tab.key === 'Notifications' && unreadCount > 0;

          return (
            <TouchableOpacity
              key={tab.key}
              style={isActive ? styles.navItemActive : styles.navItem}
              onPress={() => !isActive && navigation.navigate(tab.key)}
            >
              {/* Icon with optional notification badge */}
              <View style={styles.iconWrapper}>
                <Icon
                  name={
                    isActive && tab.key === 'Notifications'
                      ? 'bell'
                      : tab.icon
                  }
                  size={22}
                  color={isActive ? '#FFF' : Colors.outline_variant}
                />
                {showBadge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={isActive ? styles.navItemTextActive : styles.navItemText}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FAF9FB',
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    width: '100%',
    padding: 6,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
  },
  navItemText: {
    fontSize: 9,
    color: Colors.outline_variant,
    marginTop: 3,
    fontWeight: 'bold',
  },
  navItemActive: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
  },
  navItemTextActive: {
    fontSize: 9,
    color: '#FFF',
    marginTop: 3,
    fontWeight: 'bold',
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#D32F2F',
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
