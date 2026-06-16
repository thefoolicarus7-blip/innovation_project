import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { StatusBar } from 'react-native';

export const SwipeGuideScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: Colors.primary }}
    >
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <View style={styles.container}>
        {/* Top Navbar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarPlaceholder} />
            <Text style={styles.brandText}>SWIPE2WORK</Text>
          </View>
          <Icon name="tune" size={24} color={Colors.primary} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Editorial Header */}
          <View style={styles.heroSection}>
            <Text style={styles.eyebrow}>The Kinetic Guide</Text>
            <Text style={styles.mainTitle}>Master the{'\n'}Motion.</Text>
            <Text style={styles.subtitle}>
              Curating your future is as simple as a single gesture.
            </Text>
          </View>

          {/* Bento Grid */}
          <View style={styles.bentoContainer}>
            {/* NOPE Card */}
            <View style={[styles.bentoCard, styles.nopeCard]}>
              <View style={styles.bentoHeader}>
                <Icon
                  name="chevron-double-left"
                  size={28}
                  color={Colors.error}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.nopeCardTitle}>Swipe Left</Text>
              </View>
              <Text style={styles.bentoDesc}>
                Not the right fit? Swipe left to skip and refine your discovery
                feed.
              </Text>
              <View style={[styles.badge, styles.nopeBadge]}>
                <Text style={styles.nopeBadgeText}>NOPE</Text>
              </View>
            </View>

            {/* APPLY Card */}
            <View style={[styles.bentoCard, styles.applyCard]}>
              <View style={styles.bentoHeader}>
                <Text style={styles.applyCardTitle}>Swipe Right</Text>
                <Icon
                  name="chevron-double-right"
                  size={28}
                  color={Colors.secondary}
                  style={{ marginLeft: 8 }}
                />
              </View>
              <Text style={styles.applyDesc}>
                Found your dream role? Swipe right to instantly submit your
                application.
              </Text>
              <View style={[styles.badge, styles.applyBadge]}>
                <Text style={styles.applyBadgeText}>APPLY</Text>
              </View>
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate('Main')}
            >
              <Text style={styles.startButtonText}>Start Swiping</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}>
              By starting, you agree to our{' '}
              <Text style={styles.underlineText}>Terms of Discovery</Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary_container,
    marginRight: 12,
  },
  brandText: {
    ...Typography.titleMd,
    color: Colors.primary,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 32,
  },
  eyebrow: {
    ...Typography.labelMd,
    color: Colors.tertiary,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  mainTitle: {
    ...Typography.displayLg,
    color: Colors.primary,
    fontWeight: 'heavy',
    lineHeight: 48,
  },
  subtitle: {
    ...Typography.bodyLg,
    color: Colors.on_surface_variant,
    marginTop: 16,
    maxWidth: '85%',
  },
  bentoContainer: {
    gap: 20,
    marginBottom: 40,
  },
  bentoCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
  },
  nopeCard: {
    backgroundColor: Colors.surface_container_low,
  },
  applyCard: {
    backgroundColor: 'rgba(130, 245, 193, 0.3)',
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nopeCardTitle: {
    ...Typography.headlineSm,
    color: Colors.on_surface,
    fontWeight: 'bold',
  },
  applyCardTitle: {
    ...Typography.headlineSm,
    color: Colors.on_secondary_container,
    fontWeight: 'bold',
  },
  bentoDesc: {
    ...Typography.bodyMd,
    color: Colors.on_surface_variant,
    lineHeight: 24,
    marginBottom: 20,
  },
  applyDesc: {
    ...Typography.bodyMd,
    color: Colors.on_secondary_container,
    lineHeight: 24,
    marginBottom: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
  },
  nopeBadge: {
    borderColor: Colors.error,
    transform: [{ rotate: '-12deg' }],
  },
  applyBadge: {
    borderColor: Colors.secondary,
    transform: [{ rotate: '12deg' }],
  },
  nopeBadgeText: {
    color: Colors.error,
    fontWeight: '900',
    letterSpacing: 1,
  },
  applyBadgeText: {
    color: Colors.secondary,
    fontWeight: '900',
    letterSpacing: 1,
  },
  ctaSection: {
    alignItems: 'center',
  },
  startButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 32,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 24,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsText: {
    ...Typography.bodySm,
    color: Colors.on_surface_variant,
    opacity: 0.6,
  },
  underlineText: {
    textDecorationLine: 'underline',
  },
});
