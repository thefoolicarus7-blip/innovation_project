import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { useAuth } from '../auth/AuthContext';

export const SplashScreen = ({ navigation }: any) => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (user) {
          if (user.isVerified === 'false') {
            navigation.replace('VerifyEmail', { email: user.email });
          } else {
            navigation.replace('Main');
          }
        } else {
          navigation.replace('Login');
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, user, navigation]);

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: '#001453' }}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, '#001453']} // lighter blue to deep blue
          style={styles.gradient}
        >
          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Icon name="briefcase" size={48} color={Colors.on_primary} />
            </View>

            <Text style={styles.title}>Swipe2Work</Text>

            <Text style={styles.subtitle}>THE KINETIC CAREER CURATOR</Text>

            <View style={styles.divider} />

            <Text style={styles.description}>
              Swipe your way to success in Nepal's most premium job market
              experience.
            </Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.loaderBar} />
            <Text style={styles.loaderText}>INITIALIZING CANVAS</Text>
          </View>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Light translucent circle overlay
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...Typography.displayLg,
    color: Colors.on_primary,
    fontWeight: 'bold',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.bodyMd,
    color: Colors.on_primary,
    opacity: 0.85,
    letterSpacing: 2,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  divider: {
    width: 48,
    height: 3,
    backgroundColor: Colors.secondary_fixed, // subtle green indicator
    marginBottom: 20,
    borderRadius: 2,
  },
  description: {
    ...Typography.bodyMd,
    color: Colors.on_primary,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  loaderBar: {
    width: 4,
    height: 24,
    backgroundColor: Colors.secondary_fixed_dim,
    borderRadius: 2,
    marginBottom: 16,
  },
  loaderText: {
    ...Typography.labelSm,
    color: Colors.on_primary,
    opacity: 0.5,
    letterSpacing: 1.5,
  },
});
