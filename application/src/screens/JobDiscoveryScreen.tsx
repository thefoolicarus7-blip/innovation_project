
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { jobService } from '../services/api';
import { useAuth } from '../auth/AuthContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

type SwipeDirection = 'left' | 'right' | 'up';

type JobCardProps = {
  job: any;
  index: number;
  currentIndex: number;
  position: Animated.ValueXY;
  panHandlers?: any;
};

const JobCard = memo(
  ({
    job,
    index,
    currentIndex,
    position,
    panHandlers,
  }: JobCardProps) => {
    const isFirst = index === currentIndex;

    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['-10deg', '0deg', '10deg'],
      extrapolate: 'clamp',
    });

    const scale = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: [1.04, 1, 1.04],
      extrapolate: 'clamp',
    });

    const opacity = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 1.5, 0, SCREEN_WIDTH / 1.5],
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });

    const likeOpacity = position.x.interpolate({
      inputRange: [0, 120],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    const nopeOpacity = position.x.interpolate({
      inputRange: [-120, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const superOpacity = position.y.interpolate({
      inputRange: [-120, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const animatedCardStyle = isFirst
      ? {
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate },
          { scale },
        ],
        opacity,
        zIndex: 999,
        elevation: 20,
      }
      : {
        top: (index - currentIndex) * 8,
        transform: [
          {
            scale: 0.95 - (index - currentIndex) * 0.02,
          },
        ],
        zIndex: 1,
      };

    return (
      <Animated.View
        collapsable={false}
        style={[styles.cardContainer, animatedCardStyle]}
        {...(isFirst ? panHandlers : {})}
      >
        <ImageBackground
          source={{
            uri:
              job.image ||
              'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=600',
          }}
          style={styles.cardImage}
          imageStyle={styles.cardImageRadius}
        >
          {/* Swipe Labels */}

          {isFirst && (
            <>
              <Animated.View
                style={[styles.likeBadge, { opacity: likeOpacity }]}
              >
                <Text style={styles.likeText}>APPLY</Text>
              </Animated.View>

              <Animated.View
                style={[styles.nopeBadge, { opacity: nopeOpacity }]}
              >
                <Text style={styles.nopeText}>PASS</Text>
              </Animated.View>

              <Animated.View
                style={[styles.superBadge, { opacity: superOpacity }]}
              >
                <Text style={styles.superText}>SUPER</Text>
              </Animated.View>
            </>
          )}

          <View style={styles.cardOverlay}>
            <View style={styles.matchPill}>
              <View style={styles.matchDot} />
              <Text style={styles.matchText}>
                {job.match || '90%'} Match
              </Text>
            </View>

            <View style={styles.cardInfo}>
              <View style={styles.infoPill}>
                <Icon name="currency-usd" size={16} color="#FFF" />
                <Text style={styles.infoPillText}>
                  {job.salary || 'Competitive'}
                </Text>
              </View>

              <View style={styles.infoPill}>
                <Icon name="map-marker" size={16} color="#FFF" />
                <Text style={styles.infoPillText}>
                  {job.location || 'Remote'}
                </Text>
              </View>

              <Text style={styles.jobTitle}>{job.title}</Text>

              <Text style={styles.jobCompany}>
                {job.companyName || 'Secret Company'} ·{' '}
                {job.type || 'Full-time'}
              </Text>
            </View>
          </View>
        </ImageBackground>
      </Animated.View>
    );
  },
);

export const JobDiscoveryScreen = ({ navigation }: any) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<any>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const position = useRef(new Animated.ValueXY()).current;
  const { user } = useAuth();

  // Fix stale closure by keeping track of state in refs for the PanResponder
  const jobsRef = useRef(jobs);
  const currentIndexRef = useRef(currentIndex);
  const isSwipingRef = useRef(isSwiping);

  useEffect(() => { jobsRef.current = jobs; }, [jobs]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { isSwipingRef.current = isSwiping; }, [isSwiping]);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchJobs();
      hasFetched.current = true;
    }
  }, []);

  const fetchJobs = async () => {
    if (loading && jobs.length > 0) return; // Already loading
    try {
      console.log('[JobDiscovery] Fetching jobs...');
      setLoading(true);
      const data = await jobService.listJobs();
      console.log('[JobDiscovery] Jobs fetched:', data.items?.length || 0);
      setJobs(data.items || []);
      setDailyStats(data.dailyStats || null);
      setCurrentIndex(0);
    } catch (error) {
      console.error('[JobDiscovery] Failed to fetch jobs', error);
      Alert.alert('Error', 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const swipeAction = useCallback(
    async (direction: SwipeDirection) => {
      // Use refs to get absolute latest values
      const currentJobs = jobsRef.current;
      const index = currentIndexRef.current;
      const swiping = isSwipingRef.current;

      console.log(`[Swipe] Attempting: ${direction}, index=${index}, jobsCount=${currentJobs.length}, isSwiping=${swiping}`);

      if (index >= currentJobs.length || swiping) {
        console.log('[Swipe] Aborted: Index out of bounds or already swiping');
        return;
      }

      const currentJob = currentJobs[index];

      // Block unverified users from applying (Right or Up swipe)
      if ((direction === 'right' || direction === 'up') && user?.isVerified !== 'true') {
        Alert.alert(
          'Verification Required',
          'Your profile must be verified before you can apply for jobs.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Verify Now', onPress: () => navigation.navigate('DocumentUpload') },
          ]
        );
        resetPosition();
        return;
      }

      setIsSwiping(true);

      let x = 0;
      let y = 0;
      if (direction === 'left') x = -SCREEN_WIDTH * 1.5;
      if (direction === 'right') x = SCREEN_WIDTH * 1.5;
      if (direction === 'up') y = -SCREEN_WIDTH * 1.5;

      Animated.timing(position, {
        toValue: { x, y },
        duration: 250,
        useNativeDriver: true,
      }).start(async () => {
        const swipedJobId = currentJob.id;
        position.setValue({ x: 0, y: 0 });
        setCurrentIndex(prev => prev + 1);

        try {
          console.log(`[Swipe] Calling API: jobId=${swipedJobId}, direction=${direction}`);
          const res = await jobService.swipe(swipedJobId, direction);
          if (res?.dailyStats) setDailyStats(res.dailyStats);
        } catch (error: any) {
          console.error('[Swipe] API Error:', error);
          Alert.alert('Action Failed', error?.response?.data?.message || 'Error recording swipe.');
        } finally {
          setIsSwiping(false);
        }
      });
    },
    [navigation, position, user?.isVerified],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isSwipingRef.current && currentIndexRef.current < jobsRef.current.length,
      onMoveShouldSetPanResponder: (_, gs) => (Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10) && !isSwipingRef.current,
      onPanResponderMove: (_, gs) => {
        position.setValue({ x: gs.dx, y: gs.dy });
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx > 120) swipeAction('right');
        else if (gs.dx < -120) swipeAction('left');
        else if (gs.dy < -120) swipeAction('up');
        else resetPosition();
      },
      onPanResponderTerminate: () => resetPosition(),
    }),
  ).current;

  const renderCards = () => {
    return jobs
      .slice(currentIndex, currentIndex + 3)
      .map((job, idx) => {
        const actualIndex = currentIndex + idx;
        return (
          <JobCard
            key={`${job.id}-${actualIndex}`}
            job={job}
            index={actualIndex}
            currentIndex={currentIndex}
            position={position}
            panHandlers={actualIndex === currentIndex ? panResponder.panHandlers : undefined}
          />
        );
      })
      .reverse();
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
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <View style={styles.avatarPlaceholder} />
          </TouchableOpacity>
          <Text style={styles.brandText}>SWIPE2WORK</Text>
          <TouchableOpacity>
            <Icon name="tune" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.subHeader}>
          <Text style={styles.eyebrow}>
            {dailyStats ? `${dailyStats.appliedToday}/${dailyStats.applyLimit} APPLIED TODAY` : 'NEW OPPORTUNITY'}
          </Text>
          <Text style={styles.pageTitle}>Handpicked for you</Text>
          {!user?.isVerified && (
            <TouchableOpacity style={styles.verificationWarning} onPress={() => navigation.navigate('DocumentUpload')}>
              <Icon name="alert-circle" size={16} color="#E53935" />
              <Text style={styles.verificationWarningText}>Verification Pending: Tap to upload documents</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.deckContainer}>
          {currentIndex >= jobs.length ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.noMoreJobs}>No more jobs left!</Text>
              <TouchableOpacity onPress={fetchJobs} style={styles.refreshButton}>
                <Text style={styles.refreshText}>REFRESH</Text>
              </TouchableOpacity>
            </View>
          ) : (
            renderCards()
          )}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity disabled={isSwiping} style={styles.actionButton} onPress={() => swipeAction('left')}>
            <Icon name="close" size={32} color="#E53935" />
          </TouchableOpacity>
          <TouchableOpacity disabled={isSwiping} style={[styles.actionButton, styles.superLikeButton]} onPress={() => swipeAction('up')}>
            <Icon name="star" size={36} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity disabled={isSwiping} style={styles.actionButton} onPress={() => swipeAction('right')}>
            <Icon name="heart" size={32} color="#006C4A" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF9FB' },
  container: { flex: 1, backgroundColor: '#F7F8FC' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, marginBottom: 24 },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary_container },
  brandText: { ...Typography.titleMd, color: Colors.primary, fontWeight: 'bold', letterSpacing: 1 },
  subHeader: { paddingHorizontal: 24, marginBottom: 16 },
  eyebrow: { ...Typography.labelSm, color: Colors.primary, fontWeight: 'bold', marginBottom: 4 },
  pageTitle: { ...Typography.displaySm, color: Colors.on_surface, fontWeight: 'bold' },
  verificationWarning: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  verificationWarningText: { color: '#E53935', fontSize: 12, fontWeight: '600', marginLeft: 8, flexShrink: 1 },
  deckContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 10 },
  cardContainer: { position: 'absolute', left: 20, right: 20, top: 20, bottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 10 },
  cardImage: { width: '100%', height: '100%' },
  cardImageRadius: { borderRadius: 24 },
  cardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.38)', borderRadius: 24, padding: 20, justifyContent: 'space-between' },
  matchPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  matchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.secondary_fixed, marginRight: 6 },
  matchText: { ...Typography.labelMd, color: '#FFF', fontWeight: '600' },
  cardInfo: { justifyContent: 'flex-end' },
  infoPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginBottom: 8 },
  infoPillText: { color: '#FFF', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  jobTitle: { ...Typography.displaySm, color: '#FFF', fontWeight: 'bold', marginBottom: 4 },
  jobCompany: { ...Typography.bodyMd, color: '#E0E0E0' },
  actionsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  actionButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  superLikeButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary },
  emptyContainer: { alignItems: 'center' },
  noMoreJobs: { ...Typography.titleLg, color: Colors.outline },
  refreshButton: { marginTop: 20 },
  refreshText: { color: Colors.primary, fontWeight: 'bold' },
  likeBadge: { position: 'absolute', top: 60, left: 20, zIndex: 999, borderWidth: 3, borderColor: '#00E676', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, transform: [{ rotate: '-15deg' }], backgroundColor: 'rgba(0,0,0,0.3)' },
  likeText: { color: '#00E676', fontSize: 28, fontWeight: '900' },
  nopeBadge: { position: 'absolute', top: 60, right: 20, zIndex: 999, borderWidth: 3, borderColor: '#FF5252', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, transform: [{ rotate: '15deg' }], backgroundColor: 'rgba(0,0,0,0.3)' },
  nopeText: { color: '#FF5252', fontSize: 28, fontWeight: '900' },
  superBadge: { position: 'absolute', top: 120, alignSelf: 'center', zIndex: 999, borderWidth: 3, borderColor: '#FFD740', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)' },
  superText: { color: '#FFD740', fontSize: 26, fontWeight: '900' },
});
