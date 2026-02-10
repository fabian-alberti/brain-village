import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Dimensions,
  ScrollView,
  Image,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  Animated as RNAnimated,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useUser } from '@/context/AppContext';
import { TEST_MODE } from '@/context/AppContext';
import { getLevelProgress, getLevelFromXp, getXpForNextLevel, LEVEL_THRESHOLDS } from '@/lib/xp';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* eslint-disable @typescript-eslint/no-var-requires */
const VILLAGE_IMAGES = {
  good: {
    1: require('../../assets/Village States/good state/Level 1 Village.png'),
    2: require('../../assets/Village States/good state/Level 2 Village.png'),
    3: require('../../assets/Village States/good state/Level 3 Village.png'),
    4: require('../../assets/Village States/good state/Level 4 Village.png'),
    5: require('../../assets/Village States/good state/Level 5 Village.png'),
  } as Record<number, any>,
  bad: {
    1: require('../../assets/Village States/bad state/Level 1 Village bad.png'),
    2: require('../../assets/Village States/bad state/Level 2 Village bad.png'),
    3: require('../../assets/Village States/bad state/Level 3 Village bad.png'),
    4: require('../../assets/Village States/bad state/Level 4 Village bad.png'),
    5: require('../../assets/Village States/bad state/Level 5 Village bad.png'),
  } as Record<number, any>,
};
/* eslint-enable @typescript-eslint/no-var-requires */

const LEVEL_NAMES = [
  'Humble Beginnings',
  'Cozy Cottage',
  'Growing Town',
  'Bustling Village',
  'Thriving Kingdom',
];

// ── Village display state (derived from consecutiveMisses) ──────

type DisplayState = 'flourishing' | 'doomed' | 'devastated';

function getDisplayState(consecutiveMisses: number): DisplayState {
  if (consecutiveMisses >= 2) return 'devastated';
  if (consecutiveMisses === 1) return 'doomed';
  return 'flourishing';
}

const STATE_CONFIG: Record<DisplayState, { label: string; subtitle: string; bg: string; text: string }> = {
  flourishing: {
    label: 'Flourishing',
    subtitle: 'Your Society is flourishing',
    bg: '#E8F5E9',
    text: '#2D5A3D',
  },
  doomed: {
    label: 'Doomed',
    subtitle: 'Your Society is doomed',
    bg: '#FFF3E0',
    text: '#E67E22',
  },
  devastated: {
    label: 'Devastated',
    subtitle: 'Your Society has been devastated',
    bg: '#FEF2F2',
    text: '#EF4444',
  },
};

// ── XP presets for the test panel ───────────────────────────────

const XP_PRESETS = [
  { label: '0', value: 0 },
  { label: '50', value: 50 },
  { label: '150', value: 150 },
  { label: '350', value: 350 },
  { label: '700', value: 700 },
  { label: '1200', value: 1200 },
];

const STATE_OPTIONS: { label: string; misses: number; state: DisplayState }[] = [
  { label: 'Flourishing', misses: 0, state: 'flourishing' },
  { label: 'Doomed', misses: 1, state: 'doomed' },
  { label: 'Devastated', misses: 2, state: 'devastated' },
];

// ── Level-Up Celebration ────────────────────────────────────────

const LEVEL_UP_STORAGE_KEY = 'brainvillage_lastSeenLevel';

const SPARKLE_COUNT = 12;
const SPARKLE_CONFIGS = Array.from({ length: SPARKLE_COUNT }, (_, i) => {
  const angle = (i / SPARKLE_COUNT) * 2 * Math.PI;
  const dist = 80 + (i % 3) * 25;
  return {
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist,
    size: 6 + (i % 4) * 2,
    color: ['#F4A261', '#FFD700', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD'][i % 6],
  };
});

function LevelUpCelebration({
  newLevel,
  levelName,
  villageImage,
  onDismiss,
}: {
  newLevel: number;
  levelName: string;
  villageImage: any;
  onDismiss: () => void;
}) {
  const backdropOpacity = useRef(new RNAnimated.Value(0)).current;
  const badgeScale = useRef(new RNAnimated.Value(0)).current;
  const glowOpacity = useRef(new RNAnimated.Value(0)).current;
  const titleOpacity = useRef(new RNAnimated.Value(0)).current;
  const titleTranslateY = useRef(new RNAnimated.Value(30)).current;
  const subtitleOpacity = useRef(new RNAnimated.Value(0)).current;
  const imageOpacity = useRef(new RNAnimated.Value(0)).current;
  const imageScale = useRef(new RNAnimated.Value(0.6)).current;
  const buttonOpacity = useRef(new RNAnimated.Value(0)).current;
  const sparkleAnims = useRef(
    Array.from({ length: SPARKLE_COUNT }, () => ({
      opacity: new RNAnimated.Value(0),
      scale: new RNAnimated.Value(0),
      translateX: new RNAnimated.Value(0),
      translateY: new RNAnimated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Sparkle burst animations
    const sparkleAnimations = sparkleAnims.map((s, i) =>
      RNAnimated.sequence([
        RNAnimated.delay(250 + i * 40),
        RNAnimated.parallel([
          RNAnimated.sequence([
            RNAnimated.timing(s.opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
            RNAnimated.timing(s.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
          ]),
          RNAnimated.timing(s.scale, { toValue: 1, duration: 400, useNativeDriver: true }),
          RNAnimated.timing(s.translateX, {
            toValue: SPARKLE_CONFIGS[i].dx, duration: 700, useNativeDriver: true,
          }),
          RNAnimated.timing(s.translateY, {
            toValue: SPARKLE_CONFIGS[i].dy, duration: 700, useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Orchestrated animation sequence
    RNAnimated.parallel([
      // Backdrop fade in
      RNAnimated.timing(backdropOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),

      // Badge bounce in
      RNAnimated.sequence([
        RNAnimated.delay(200),
        RNAnimated.spring(badgeScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
      ]),

      // Glow pulse
      RNAnimated.sequence([
        RNAnimated.delay(200),
        RNAnimated.timing(glowOpacity, { toValue: 0.6, duration: 300, useNativeDriver: true }),
        RNAnimated.timing(glowOpacity, { toValue: 0.25, duration: 800, useNativeDriver: true }),
      ]),

      // Sparkle burst
      ...sparkleAnimations,

      // Title slide up
      RNAnimated.sequence([
        RNAnimated.delay(700),
        RNAnimated.parallel([
          RNAnimated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          RNAnimated.timing(titleTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]),

      // Subtitle fade in
      RNAnimated.sequence([
        RNAnimated.delay(1000),
        RNAnimated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),

      // Village image scale + fade
      RNAnimated.sequence([
        RNAnimated.delay(1300),
        RNAnimated.parallel([
          RNAnimated.timing(imageOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
          RNAnimated.spring(imageScale, { toValue: 1, friction: 5, tension: 40, useNativeDriver: true }),
        ]),
      ]),

      // Continue button
      RNAnimated.sequence([
        RNAnimated.delay(1900),
        RNAnimated.timing(buttonOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleDismiss = useCallback(() => {
    RNAnimated.timing(backdropOpacity, {
      toValue: 0, duration: 300, useNativeDriver: true,
    }).start(() => onDismiss());
  }, [onDismiss, backdropOpacity]);

  return (
    <RNAnimated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: 'rgba(0,0,0,0.88)',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: backdropOpacity,
          zIndex: 1000,
        },
      ]}
    >
      {/* Badge + Sparkle area */}
      <View style={{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center', overflow: 'visible', marginBottom: 20 }}>
        {/* Sparkles */}
        {sparkleAnims.map((s, i) => (
          <RNAnimated.View
            key={i}
            style={{
              position: 'absolute',
              left: 44 - SPARKLE_CONFIGS[i].size / 2,
              top: 44 - SPARKLE_CONFIGS[i].size / 2,
              width: SPARKLE_CONFIGS[i].size,
              height: SPARKLE_CONFIGS[i].size,
              borderRadius: SPARKLE_CONFIGS[i].size / 2,
              backgroundColor: SPARKLE_CONFIGS[i].color,
              opacity: s.opacity,
              transform: [
                { translateX: s.translateX },
                { translateY: s.translateY },
                { scale: s.scale },
              ],
            }}
          />
        ))}

        {/* Glow */}
        <RNAnimated.View
          style={{
            position: 'absolute',
            left: 44 - 70,
            top: 44 - 70,
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: '#F4A261',
            opacity: glowOpacity,
          }}
        />

        {/* Badge */}
        <RNAnimated.View style={{ transform: [{ scale: badgeScale }] }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: '#F4A261',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: '#FFD700',
            }}
          >
            <Text style={{ fontSize: 34, fontWeight: '900', color: '#FFF' }}>
              {newLevel}
            </Text>
          </View>
        </RNAnimated.View>
      </View>

      {/* Congratulations title */}
      <RNAnimated.View
        style={{
          opacity: titleOpacity,
          transform: [{ translateY: titleTranslateY }],
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: '900',
            color: '#FFFFFF',
            textAlign: 'center',
            letterSpacing: -0.5,
          }}
        >
          Congratulations!
        </Text>
      </RNAnimated.View>

      {/* Subtitle */}
      <RNAnimated.View style={{ opacity: subtitleOpacity, alignItems: 'center', marginTop: 10 }}>
        <Text
          style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            marginBottom: 6,
          }}
        >
          Your village has evolved to
        </Text>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: '#F4A261',
            textAlign: 'center',
          }}
        >
          Level {newLevel} — {levelName}
        </Text>
      </RNAnimated.View>

      {/* Village Image */}
      <RNAnimated.View
        style={{
          opacity: imageOpacity,
          transform: [{ scale: imageScale }],
          marginTop: 24,
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        <Image
          source={villageImage}
          resizeMode="contain"
          style={{
            width: SCREEN_WIDTH * 0.65,
            height: SCREEN_WIDTH * 0.65,
          }}
        />
      </RNAnimated.View>

      {/* Continue Button */}
      <RNAnimated.View style={{ opacity: buttonOpacity, marginTop: 32 }}>
        <TouchableOpacity
          onPress={handleDismiss}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#2D5A3D',
            paddingHorizontal: 52,
            paddingVertical: 16,
            borderRadius: 16,
            shadowColor: '#2D5A3D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: 0.3,
            }}
          >
            Continue
          </Text>
        </TouchableOpacity>
      </RNAnimated.View>
    </RNAnimated.View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────

export default function VillageScreen() {
  const user = useUser();
  const [levelExpanded, setLevelExpanded] = useState(true);

  // Test mode overrides (null = use real data)
  const [testXp, setTestXp] = useState<number | null>(null);
  const [testMisses, setTestMisses] = useState<number | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [xpInput, setXpInput] = useState('');
  const [showStateInfo, setShowStateInfo] = useState(false);

  // Resolve values: use test overrides if set, otherwise real data
  const totalXp = testXp ?? (user?.totalXp ?? 0);
  const consecutiveMisses = testMisses ?? (user?.consecutiveMisses ?? 0);
  const level = getLevelFromXp(totalXp);

  const levelProgress = getLevelProgress(totalXp);
  const xpForNext = getXpForNextLevel(level);
  const currentLevelXp = LEVEL_THRESHOLDS[level - 1];
  const isMaxLevel = level >= 5;
  const levelName = LEVEL_NAMES[level - 1] || 'Unknown';

  // ── Level-up celebration state & detection ──
  const [pendingLevelUp, setPendingLevelUp] = useState<{ oldLevel: number; newLevel: number } | null>(null);
  const [showLevelUpCelebration, setShowLevelUpCelebration] = useState(false);
  const [initialLevelLoaded, setInitialLevelLoaded] = useState(false);
  const storedLevelRef = useRef(0);
  const levelRef = useRef(level);
  levelRef.current = level;

  const isUserLoaded = user !== null;

  // Load last-seen level from storage once user data is ready
  useEffect(() => {
    if (!isUserLoaded) return;
    AsyncStorage.getItem(LEVEL_UP_STORAGE_KEY).then(stored => {
      if (stored !== null) {
        storedLevelRef.current = parseInt(stored, 10);
      } else {
        // First time: save current level, no celebration
        storedLevelRef.current = levelRef.current;
        AsyncStorage.setItem(LEVEL_UP_STORAGE_KEY, levelRef.current.toString());
      }
      setInitialLevelLoaded(true);
    });
  }, [isUserLoaded]);

  // Detect level changes after initial load
  useEffect(() => {
    if (!initialLevelLoaded) return;
    if (level > storedLevelRef.current) {
      setPendingLevelUp({ oldLevel: storedLevelRef.current, newLevel: level });
      storedLevelRef.current = level;
      AsyncStorage.setItem(LEVEL_UP_STORAGE_KEY, level.toString());
    } else if (level !== storedLevelRef.current) {
      storedLevelRef.current = level;
      AsyncStorage.setItem(LEVEL_UP_STORAGE_KEY, level.toString());
    }
  }, [level, initialLevelLoaded]);

  // Show celebration when tab is focused and there's a pending level-up
  useFocusEffect(
    useCallback(() => {
      if (pendingLevelUp && !showLevelUpCelebration) {
        const timer = setTimeout(() => {
          setShowLevelUpCelebration(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [pendingLevelUp, showLevelUpCelebration])
  );

  const dismissCelebration = useCallback(() => {
    setShowLevelUpCelebration(false);
    setPendingLevelUp(null);
  }, []);

  const displayState = getDisplayState(consecutiveMisses);
  const stateConfig = STATE_CONFIG[displayState];

  const toggleLevel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLevelExpanded(prev => !prev);
  };

  const handleSetCustomXp = () => {
    const parsed = parseInt(xpInput, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setTestXp(parsed);
      setXpInput('');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFBF2' }}>
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      {/* ── Header ─────────────────────────────────── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: '800',
            color: '#1A1A1A',
            letterSpacing: -0.5,
          }}>
            Your Brain Village
          </Text>
          <TouchableOpacity
            onPress={() => setShowStateInfo(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: 14,
              paddingRight: 10,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: stateConfig.bg,
            }}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: '700',
              color: stateConfig.text,
            }}>
              {stateConfig.label}
            </Text>
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color={stateConfig.text}
              style={{ marginLeft: 5, opacity: 0.7 }}
            />
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 14, color: '#8B9D77', marginTop: 4 }}>
          {stateConfig.subtitle}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* ── Collapsible Level Section ────────────── */}
        <View style={{
          marginHorizontal: 16,
          marginTop: 12,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
          {/* Toggle header */}
          <TouchableOpacity
            onPress={toggleLevel}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              paddingBottom: levelExpanded ? 0 : 16,
            }}
          >
            {levelExpanded ? (
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#8B9D77' }}>
                Level
              </Text>
            ) : (
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>
                Level {level}{'    '}
                <Text style={{ fontWeight: '500', color: '#8B9D77' }}>{levelName}</Text>
              </Text>
            )}
            <MaterialCommunityIcons
              name={levelExpanded ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#8B9D77"
            />
          </TouchableOpacity>

          {/* Expanded content */}
          {levelExpanded && (
            <View style={{ padding: 16, paddingTop: 12 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#2D5A3D',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 18 }}>
                      {level}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>
                      {levelName}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#8B9D77', marginTop: 2 }}>
                      Level {level} of 5
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#F4A261' }}>
                    {totalXp} XP
                  </Text>
                  {!isMaxLevel && (
                    <Text style={{ fontSize: 11, color: '#8B9D77', marginTop: 2 }}>
                      to next level
                    </Text>
                  )}
                </View>
              </View>

              {/* Progress bar */}
              <View style={{
                height: 10,
                backgroundColor: '#E8F5E9',
                borderRadius: 5,
                overflow: 'hidden',
              }}>
                <View style={{
                  height: '100%',
                  backgroundColor: '#2D5A3D',
                  borderRadius: 5,
                  width: isMaxLevel ? '100%' : `${Math.max(levelProgress, 2)}%`,
                }} />
              </View>

              {!isMaxLevel && (
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 6,
                }}>
                  <Text style={{ fontSize: 11, color: '#B0BCA4' }}>{currentLevelXp} XP</Text>
                  <Text style={{ fontSize: 11, color: '#B0BCA4' }}>{xpForNext} XP</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Village Image ────────────────────────── */}
        <View style={{ alignItems: 'center', marginTop: 16, paddingHorizontal: 16 }}>
          <Image
            source={VILLAGE_IMAGES[displayState === 'devastated' ? 'bad' : 'good'][Math.max(1, Math.min(5, level))]}
            resizeMode="contain"
            style={{
              width: SCREEN_WIDTH - 32,
              height: SCREEN_WIDTH - 32,
            }}
          />
        </View>
      </ScrollView>

      {/* ── State Info Modal ─────────────────────────── */}
      <Modal
        visible={showStateInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStateInfo(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowStateInfo(false)}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 24,
                width: '100%',
                maxWidth: 340,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 10,
              }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 6 }}>
                  Village States
                </Text>
                <Text style={{ fontSize: 13, color: '#8B9D77', marginBottom: 20 }}>
                  Your village state depends on how consistently you meet your goal.
                </Text>

                {STATE_OPTIONS.map((option, index) => {
                  const cfg = STATE_CONFIG[option.state];
                  const descriptions: Record<DisplayState, string> = {
                    flourishing: 'You are on track! Your goal was met yesterday. Keep it up to watch your village thrive.',
                    doomed: 'You missed your goal yesterday. Complete it today to restore your village before it gets worse.',
                    devastated: 'You have missed your goal for two or more consecutive days. Your village is in ruins — time to turn things around!',
                  };
                  return (
                    <View key={option.state} style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      marginBottom: index < STATE_OPTIONS.length - 1 ? 16 : 0,
                    }}>
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: cfg.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        marginTop: 2,
                      }}>
                        <MaterialCommunityIcons
                          name={option.state === 'flourishing' ? 'emoticon-happy-outline' : option.state === 'doomed' ? 'emoticon-neutral-outline' : 'emoticon-sad-outline'}
                          size={20}
                          color={cfg.text}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: cfg.text, marginBottom: 2 }}>
                          {option.label}
                        </Text>
                        <Text style={{ fontSize: 13, color: '#5A6B4D', lineHeight: 19 }}>
                          {descriptions[option.state]}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                <TouchableOpacity
                  onPress={() => setShowStateInfo(false)}
                  activeOpacity={0.7}
                  style={{
                    marginTop: 20,
                    backgroundColor: '#F5F5F0',
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A' }}>Got it</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Test Mode FAB ──────────────────────────── */}
      {TEST_MODE && (
        <TouchableOpacity
          onPress={() => setShowTestPanel(true)}
          activeOpacity={0.8}
          style={{
            position: 'absolute',
            bottom: Platform.OS === 'ios' ? 100 : 80,
            right: 20,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#2D5A3D',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <MaterialCommunityIcons name="wrench" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* ── Test Panel Modal ───────────────────────── */}
      <Modal
        visible={showTestPanel}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTestPanel(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <TouchableWithoutFeedback onPress={() => setShowTestPanel(false)}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>

          <View style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 10,
          }}>
            {/* Handle bar */}
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E8E8E8' }} />
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 20 }}>
                Test Controls
              </Text>

              {/* ── XP Presets ───────────────────────── */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B9D77', marginBottom: 10 }}>
                Set XP (current: {totalXp})
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {XP_PRESETS.map((preset) => {
                  const active = testXp === preset.value;
                  return (
                    <TouchableOpacity
                      key={preset.value}
                      onPress={() => setTestXp(preset.value)}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 10,
                        backgroundColor: active ? '#2D5A3D' : '#F5F5F0',
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: active ? '#FFFFFF' : '#1A1A1A',
                      }}>
                        {preset.label} XP
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom XP input */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                <TextInput
                  value={xpInput}
                  onChangeText={setXpInput}
                  placeholder="Custom XP..."
                  placeholderTextColor="#B0BCA4"
                  keyboardType="number-pad"
                  style={{
                    flex: 1,
                    backgroundColor: '#F5F5F0',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: '#1A1A1A',
                  }}
                />
                <TouchableOpacity
                  onPress={handleSetCustomXp}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: '#2D5A3D',
                    borderRadius: 10,
                    paddingHorizontal: 16,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Set</Text>
                </TouchableOpacity>
              </View>

              {/* ── Village State ─────────────────────── */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B9D77', marginBottom: 10 }}>
                Village State
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {STATE_OPTIONS.map((option) => {
                  const active = getDisplayState(consecutiveMisses) === option.state;
                  const cfg = STATE_CONFIG[option.state];
                  return (
                    <TouchableOpacity
                      key={option.state}
                      onPress={() => setTestMisses(option.misses)}
                      activeOpacity={0.7}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: active ? cfg.bg : '#F5F5F0',
                        borderWidth: active ? 1.5 : 0,
                        borderColor: active ? cfg.text : 'transparent',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: active ? cfg.text : '#8B9D77',
                      }}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Reset Button ──────────────────────── */}
              <TouchableOpacity
                onPress={() => {
                  setTestXp(null);
                  setTestMisses(null);
                  setShowTestPanel(false);
                }}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: '#F5F5F0',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#8B9D77' }}>
                  Reset to Real Data
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>

      {/* Level-Up Celebration Overlay */}
      {showLevelUpCelebration && (
        <LevelUpCelebration
          newLevel={level}
          levelName={levelName}
          villageImage={VILLAGE_IMAGES[displayState === 'devastated' ? 'bad' : 'good'][Math.max(1, Math.min(5, level))]}
          onDismiss={dismissCelebration}
        />
      )}
    </View>
  );
}
