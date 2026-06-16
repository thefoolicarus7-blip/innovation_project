import React, { useState, useEffect } from 'react';
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
import api from '../services/api';

export const AppliedScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'let_it_go'>(
    'matches',
  );
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/applications?tab=${activeTab}`);
      setApplications(response.data.items);
    } catch (error) {
      console.error('Failed to fetch applications', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApplications();
    setRefreshing(false);
  };

  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: '#FAF9FB' }}
    >
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.avatarPlaceholder} />
          </TouchableOpacity>
          <Text style={styles.brandText}>SWIPE2WORK</Text>
          <Icon name="tune" size={24} color={Colors.primary} />
        </View>

        <View style={styles.subHeader}>
          <Text style={styles.eyebrow}>APPLIED OPPORTUNITIES</Text>
          <Text style={styles.pageTitle}>Your Applied Jobs</Text>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'matches' && styles.segmentActive,
            ]}
            onPress={() => setActiveTab('matches')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'matches' && styles.segmentTextActive,
              ]}
            >
              Matches
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'let_it_go' && styles.segmentActive,
            ]}
            onPress={() => setActiveTab('let_it_go')}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'let_it_go' && styles.segmentTextActive,
              ]}
            >
              Let It Go
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading && !refreshing ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView 
            style={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }
          >
            <View style={styles.headerSpacer} />
            {applications.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Text style={styles.noDataText}>No applications found here.</Text>
              </View>
            ) : (
              applications.map(app => (
                <View key={app._id} style={styles.jobCard}>
                  <Image source={{ uri: app.jobImage || 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=200' }} style={styles.jobImage} />
                  <View style={styles.jobInfoStack}>
                    <Text style={styles.jobTitle}>{app.jobTitle}</Text>
                    <Text style={styles.jobCompany}>Applied: {new Date(app.appliedAt).toLocaleDateString()}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        app.status === 'Rejected'
                          ? styles.statusRefused
                          : styles.statusMatches,
                      ]}
                    >
                      <Icon
                        name={
                          app.status === 'Rejected'
                            ? 'close-circle-outline'
                            : 'check-decagram'
                        }
                        size={14}
                        color={app.status === 'Rejected' ? '#C62828' : '#2E7D32'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          app.status === 'Rejected'
                            ? styles.statusTextRefused
                            : styles.statusTextMatches,
                        ]}
                      >
                        {app.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}
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
    marginBottom: 24,
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
  subHeader: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  eyebrow: {
    ...Typography.labelSm,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pageTitle: {
    ...Typography.displaySm,
    color: Colors.on_surface,
    fontWeight: 'bold',
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 8,
    backgroundColor: '#EBEBEF',
    borderRadius: 12,
    padding: 6,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    ...Typography.titleSm,
    color: Colors.on_surface_variant,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerSpacer: {
    height: 12,
  },
  bottomSpacer: {
    height: 100,
  },
  jobCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  jobImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: Colors.surface_variant,
  },
  jobInfoStack: {
    flex: 1,
    justifyContent: 'center',
  },
  jobTitle: {
    ...Typography.titleMd,
    color: Colors.on_surface,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  jobCompany: {
    ...Typography.bodyMd,
    color: Colors.outline,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusMatches: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  statusRefused: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
  },
  statusText: {
    ...Typography.labelSm,
    fontWeight: 'bold',
  },
  statusTextMatches: {
    color: '#2E7D32',
  },
  statusTextRefused: {
    color: '#C62828',
  },
});
