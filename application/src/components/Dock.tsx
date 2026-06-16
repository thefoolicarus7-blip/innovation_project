import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';

interface DockProps {
  activeScreen: 'JobDiscovery' | 'Applied' | 'Profile';
  navigation: any;
}

export const Dock: React.FC<DockProps> = ({ activeScreen, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={
            activeScreen === 'JobDiscovery'
              ? styles.navItemActive
              : styles.navItem
          }
          onPress={() =>
            activeScreen !== 'JobDiscovery' &&
            navigation.navigate('JobDiscovery')
          }
        >
          <Icon
            name="briefcase-search"
            size={24}
            color={
              activeScreen === 'JobDiscovery' ? '#FFF' : Colors.outline_variant
            }
          />
          <Text
            style={
              activeScreen === 'JobDiscovery'
                ? styles.navItemTextActive
                : styles.navItemText
            }
          >
            DISCOVER
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            activeScreen === 'Applied' ? styles.navItemActive : styles.navItem
          }
          onPress={() =>
            activeScreen !== 'Applied' && navigation.navigate('Applied')
          }
        >
          <Icon
            name="file-document-outline"
            size={24}
            color={activeScreen === 'Applied' ? '#FFF' : Colors.outline_variant}
          />
          <Text
            style={
              activeScreen === 'Applied'
                ? styles.navItemTextActive
                : styles.navItemText
            }
          >
            APPLIED
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            activeScreen === 'Profile' ? styles.navItemActive : styles.navItem
          }
          onPress={() =>
            activeScreen !== 'Profile' && navigation.navigate('Profile')
          }
        >
          <Icon
            name="account-outline"
            size={24}
            color={activeScreen === 'Profile' ? '#FFF' : Colors.outline_variant}
          />
          <Text
            style={
              activeScreen === 'Profile'
                ? styles.navItemTextActive
                : styles.navItemText
            }
          >
            PROFILE
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FAF9FB',
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    width: '100%',
    padding: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navItemText: {
    fontSize: 10,
    color: Colors.outline_variant,
    marginTop: 4,
    fontWeight: 'bold',
  },
  navItemActive: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  navItemTextActive: {
    fontSize: 10,
    color: '#FFF',
    marginTop: 4,
    fontWeight: 'bold',
  },
});
