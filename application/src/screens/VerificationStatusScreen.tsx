import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

export const VerificationStatusScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={Colors.on_surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Status</Text>
        <View style={{ width: 24 }} /> {/* Spacer to balance the back button */}
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name="shield-check" size={80} color="#006C4A" />
        </View>
        <Text style={styles.title}>Your KYC is successfully verified</Text>
        <Text style={styles.subtitle}>
          Your account is fully verified. You now have access to high-priority job matches and interviews.
        </Text>

        <TouchableOpacity style={styles.continueButton} onPress={() => navigation.goBack()}>
          <Text style={styles.continueButtonText}>Return to Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...Typography.titleLg,
    fontWeight: 'bold',
    color: Colors.on_surface,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 64, // offset the center slightly upwards
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#006C4A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    ...Typography.headlineSm,
    fontWeight: 'bold',
    color: Colors.on_surface,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    ...Typography.bodyLg,
    color: Colors.outline,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    ...Typography.titleMd,
    color: '#FFF',
    fontWeight: 'bold',
  },
});
