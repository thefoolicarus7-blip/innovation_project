import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { authService, jobService } from '../services/api';
import { useAuth } from '../auth/AuthContext';

export const ProfileScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dailyStats = await jobService.getDailyStats();
      setStats(dailyStats);
    } catch (error) {
      console.error('Failed to fetch profile stats', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            {user?.profileImageUrl ? (
              <Image 
                source={{ uri: user.profileImageUrl }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileInitials}>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.editImageButton}
              onPress={() => navigation.navigate('DocumentUpload')}
            >
              <Icon name="camera" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
          <View style={[styles.badge, user?.isVerified === 'true' ? styles.verifiedBadge : styles.pendingBadge]}>
            <Icon 
              name={user?.isVerified === 'true' ? "check-decagram" : "clock-outline"} 
              size={16} 
              color={user?.isVerified === 'true' ? "#006C4A" : "#E53935"} 
            />
            <Text style={[styles.badgeText, user?.isVerified === 'true' ? styles.verifiedText : styles.pendingText]}>
              {user?.isVerified === 'true' ? 'Verified Profile' : 'Verification Pending'}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.appliedToday || 0}</Text>
            <Text style={styles.statLabel}>Applied Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.applyLimit || 10}</Text>
            <Text style={styles.statLabel}>Daily Limit</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('DocumentUpload')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Icon name="file-document-outline" size={24} color="#1976D2" />
              </View>
              <Text style={styles.menuItemText}>Documents & Verification</Text>
            </View>
            <Icon name="chevron-right" size={24} color={Colors.outline} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Icon name="bell-outline" size={24} color="#7B1FA2" />
              </View>
              <Text style={styles.menuItemText}>Job Alerts</Text>
            </View>
            <Icon name="chevron-right" size={24} color={Colors.outline} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Icon name="shield-check-outline" size={24} color="#F57C00" />
              </View>
              <Text style={styles.menuItemText}>Privacy & Security</Text>
            </View>
            <Icon name="chevron-right" size={24} color={Colors.outline} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { marginTop: 24 }]} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
                <Icon name="logout" size={24} color="#D32F2F" />
              </View>
              <Text style={[styles.menuItemText, { color: '#D32F2F' }]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9FB',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
  },
  profileInitials: {
    ...Typography.headlineMd,
    color: '#FFF',
    fontWeight: 'bold',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.secondary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  userName: {
    ...Typography.headlineSm,
    color: Colors.on_surface,
    fontWeight: 'bold',
  },
  userEmail: {
    ...Typography.bodyMd,
    color: Colors.outline,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  verifiedBadge: {
    backgroundColor: '#E8F5E9',
  },
  pendingBadge: {
    backgroundColor: '#FFEBEE',
  },
  badgeText: {
    ...Typography.labelLg,
    marginLeft: 6,
    fontWeight: 'bold',
  },
  verifiedText: {
    color: '#006C4A',
  },
  pendingText: {
    color: '#E53935',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    ...Typography.headlineMd,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...Typography.labelMd,
    color: Colors.outline,
    marginTop: 4,
  },
  menuContainer: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    ...Typography.titleLg,
    color: Colors.on_surface,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    ...Typography.titleMd,
    color: Colors.on_surface,
    fontWeight: '600',
  },
  versionText: {
    ...Typography.bodySm,
    color: Colors.outline,
    textAlign: 'center',
    marginTop: 40,
  },
});
