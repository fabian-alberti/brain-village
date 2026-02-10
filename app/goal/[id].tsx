import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useGoals, useApp, useUser } from '@/context/AppContext';
import { getGoalProgress, getGoalTypeLabel, formatTime, getBaseXpForGoal, getAppCountMultiplier, getTotalTrackedApps, calculateFinalXp, getStreakMultiplier } from '@/lib/xp';
import { useDeviceApps } from '@/hooks/useDeviceApps';
import AppBrandIcon, { CategoryIcon } from '@/components/ui/AppBrandIcon';

// Helper to blur active element on web before navigation
const blurActiveElement = () => {
  if (Platform.OS === 'web' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

// ── Progress Ring ──────────────────────────────────────────────

function ProgressRing({ progress, size = 170 }: { progress: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  const ringColor = '#2D5A3D';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={center} cy={center} r={radius}
          stroke="#F0EDE5" strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={center} cy={center} r={radius}
          stroke={ringColor} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 38, fontWeight: '800', color: '#1A1A1A' }}>
          {Math.round(progress)}%
        </Text>
        <Text style={{ fontSize: 13, color: '#8B9D77', marginTop: 2, fontStyle: 'italic' }}>remaining</Text>
      </View>
    </View>
  );
}

// ── Completed Graphic ──────────────────────────────────────────

function CompletedGraphic({ size = 150 }: { size?: number }) {
  return (
    <Image
      source={require('@/assets/achievement.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

// ── Failed Graphic ─────────────────────────────────────────────

function FailedGraphic({ size = 150 }: { size?: number }) {
  return (
    <Image
      source={require('@/assets/dissatisfaction.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

// ── Screen ─────────────────────────────────────────────────────

export default function GoalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { logGoalProgress, markGoalComplete, removeGoal, toggleGoalActive } = useApp();
  const goals = useGoals();
  const user = useUser();
  const { categories: deviceCategories } = useDeviceApps();

  const [showLogModal, setShowLogModal] = useState(false);
  const [logAmount, setLogAmount] = useState('');
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const goal = goals.find(g => g.id === id);

  if (!goal) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF2', alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#B0BCA4" />
        <Text style={{ fontSize: 16, color: '#8B9D77', marginTop: 12 }}>Goal not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, backgroundColor: '#2D5A3D', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: '#FFF', fontWeight: '600' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const progress = getGoalProgress(goal);
  const typeLabel = getGoalTypeLabel(goal.type);
  const isTimeGoal = goal.type !== 'app_opens_limit';
  const hasExceededLimit = goal.currentProgress > goal.limit && !goal.isCompleted;

  // XP breakdown (use device-filtered categories for accurate app counts)
  const pureBaseXp = getBaseXpForGoal(goal.type, goal.limit);
  const appMult = getAppCountMultiplier(goal.targetApps, goal.targetCategories || [], deviceCategories);
  const totalTrackedApps = getTotalTrackedApps(goal.targetApps, goal.targetCategories || [], deviceCategories);
  const currentStreak = user?.currentStreak ?? 0;
  const nextStreak = currentStreak + 1; // what it'll be after completing
  const streakMultiplier = getStreakMultiplier(nextStreak);
  const finalXp = calculateFinalXp(goal.xpReward, nextStreak);

  const handleLogProgress = async () => {
    const amount = parseInt(logAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }
    if (!id) return;
    try {
      await logGoalProgress(id, amount, selectedApp || undefined);
      setShowLogModal(false);
      setLogAmount('');
      setSelectedApp(null);
    } catch {
      Alert.alert('Error', 'Failed to log progress');
    }
  };

  const handleCompleteGoal = async () => {
    if (!id) return;

    const doComplete = async () => {
      try {
        await markGoalComplete(id);
      } catch {
        Alert.alert('Error', 'Failed to complete goal');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Mark "${goal.name}" as complete for today? You'll earn ${finalXp} XP!`
      );
      if (confirmed) await doComplete();
    } else {
      Alert.alert(
        'Complete Goal',
        `Mark "${goal.name}" as complete for today? You'll earn ${finalXp} XP!`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete', onPress: doComplete },
        ]
      );
    }
  };

  const handleEdit = () => {
    blurActiveElement();
    router.push({ pathname: '/goal/create', params: { edit: id } });
  };

  const handleDelete = async () => {
    const doDelete = async () => {
      try {
        await removeGoal(goal.id);
        router.back();
      } catch {
        Alert.alert('Error', 'Failed to delete goal');
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete "${goal.name}"?`);
      if (confirmed) await doDelete();
    } else {
      Alert.alert(
        'Delete Goal',
        `Are you sure you want to delete "${goal.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const appProgress = goal.appProgress || {};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF2' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <MaterialCommunityIcons name="chevron-left" size={22} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.2 }} numberOfLines={1}>
            {goal.name}
          </Text>
          <Text style={{ fontSize: 13, color: '#8B9D77', marginTop: 1 }}>{typeLabel}</Text>
        </View>

        <View style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: '#E8F5E9',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <MaterialCommunityIcons
            name={goal.type === 'overall_screen_time' ? 'cellphone' : goal.type === 'app_time_limit' ? 'timer-outline' : 'gesture-tap'}
            size={20}
            color="#2D5A3D"
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Progress Card ────────────────────────────── */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 20,
          marginBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D5A3D', marginBottom: 16 }}>
            Progress
          </Text>

          <View style={{ alignItems: 'center' }}>
            {/* Show graphic based on state: completed, failed, or in-progress */}
            {goal.isCompleted ? (
              <>
                <CompletedGraphic />
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#2D5A3D', marginTop: 16 }}>
                  Goal Reached!
                </Text>
                <Text style={{ fontSize: 14, color: '#8B9D77', marginTop: 4 }}>
                  You stayed within your limit today
                </Text>
              </>
            ) : hasExceededLimit ? (
              <>
                <FailedGraphic />
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#D32F2F', marginTop: 16 }}>
                  Limit Exceeded
                </Text>
                <Text style={{ fontSize: 14, color: '#999', marginTop: 4 }}>
                  You went over your daily limit
                </Text>
              </>
            ) : (
              <ProgressRing progress={progress} />
            )}

            <Text style={{ fontSize: 14, color: '#8B9D77', marginTop: 16 }}>
              {isTimeGoal ? 'Time used today' : 'Opens today'}
            </Text>
            <Text style={{
              fontSize: 20,
              fontWeight: '800',
              color: hasExceededLimit ? '#D32F2F' : '#1A1A1A',
              marginTop: 4,
            }}>
              {isTimeGoal
                ? `${formatTime(goal.currentProgress)} / ${formatTime(goal.limit)}`
                : `${goal.currentProgress} / ${goal.limit}`
              }
            </Text>

            {goal.isCompleted ? (
              <View style={{
                marginTop: 16,
                backgroundColor: '#E8F5E9',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <MaterialCommunityIcons name="check-circle" size={18} color="#2D5A3D" />
                <Text style={{ color: '#2D5A3D', fontWeight: '700', fontSize: 14, marginLeft: 6 }}>
                  Completed!
                </Text>
                <Text style={{ color: '#F4A261', fontWeight: '700', fontSize: 14, marginLeft: 6 }}>
                  +{finalXp} XP
                </Text>
              </View>
            ) : (
              <>
                {hasExceededLimit ? (
                  <View style={{
                    marginTop: 16,
                    backgroundColor: '#FBE9E7',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <MaterialCommunityIcons name="alert-circle" size={18} color="#D32F2F" />
                    <Text style={{ color: '#D32F2F', fontWeight: '700', fontSize: 14, marginLeft: 6 }}>
                      Limit exceeded
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleCompleteGoal}
                    style={{
                      marginTop: 16,
                      backgroundColor: '#2D5A3D',
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>
                      Mark as Complete (+{finalXp} XP)
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        {/* ── Tracked Apps Card ────────────────────────── */}
        {((goal.targetCategories || []).length > 0 || goal.targetApps.length > 0) && (() => {
          // Build a flat list of all trackable apps: expand categories into individual apps
          const allApps: { appName: string; categoryName?: string }[] = [];
          const addedApps = new Set<string>();

          // First, expand categories into their individual apps (using device-filtered list)
          for (const catId of (goal.targetCategories || [])) {
            const cat = deviceCategories.find(c => c.id === catId);
            if (cat) {
              for (const app of cat.apps) {
                if (!addedApps.has(app.name)) {
                  allApps.push({ appName: app.name, categoryName: cat.name });
                  addedApps.add(app.name);
                }
              }
            }
          }

          // Then add individually selected apps (skip duplicates from categories)
          for (const appName of goal.targetApps) {
            if (!addedApps.has(appName)) {
              allApps.push({ appName });
              addedApps.add(appName);
            }
          }

          return (
            <View style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D5A3D', marginBottom: 12 }}>
                Tracked Apps
              </Text>

              {allApps.map(({ appName, categoryName }, i) => {
                const isLast = i === allApps.length - 1;
                const logged = appProgress[appName] || 0;
                const loggedDisplay = isTimeGoal ? formatTime(logged) : `${logged}`;
                return (
                  <View key={appName} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: '#F0EDE5',
                  }}>
                    <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#F5F5F0', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <AppBrandIcon appName={appName} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, color: '#1A1A1A', fontWeight: '500' }} numberOfLines={1}>
                        {appName}
                      </Text>
                      {categoryName && (
                        <Text style={{ fontSize: 11, color: '#B0BCA4', marginTop: 1 }}>
                          {categoryName}
                        </Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginRight: 12 }}>
                      {loggedDisplay}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedApp(appName);
                        setShowLogModal(true);
                      }}
                      style={{
                        backgroundColor: '#F0F7F0',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: '#2D5A3D', fontWeight: '600' }}>
                        Log {isTimeGoal ? 'Time' : 'Open'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          );
        })()}

        {/* Quick Log (for overall goals with no specific apps) */}
        {goal.targetApps.length === 0 && (goal.targetCategories || []).length === 0 && !goal.isCompleted && (
          <TouchableOpacity
            onPress={() => setShowLogModal(true)}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#2D5A3D" />
            <Text style={{ color: '#2D5A3D', fontWeight: '700', fontSize: 15, marginLeft: 8 }}>
              Log {isTimeGoal ? 'Screen Time' : 'App Open'}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Goal Info Card ───────────────────────────── */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D5A3D', marginBottom: 12 }}>
            Goal Info
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
            <Text style={{ fontSize: 15, color: '#1A1A1A', fontWeight: '500' }}>Daily Limit</Text>
            <Text style={{ fontSize: 15, color: '#1A1A1A', fontWeight: '700' }}>
              {isTimeGoal ? formatTime(goal.limit) : `${goal.limit} opens`}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: '#F0EDE5' }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
            <Text style={{ fontSize: 15, color: '#1A1A1A', fontWeight: '500' }}>Base XP</Text>
            <Text style={{ fontSize: 15, color: '#1A1A1A', fontWeight: '700' }}>
              {pureBaseXp} XP
            </Text>
          </View>

          {appMult > 1 && (
            <>
              <View style={{ height: 1, backgroundColor: '#F0EDE5' }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                <View>
                  <Text style={{ fontSize: 15, color: '#1A1A1A', fontWeight: '500' }}>App Bonus</Text>
                  <Text style={{ fontSize: 12, color: '#8B9D77', marginTop: 2 }}>
                    {totalTrackedApps} {totalTrackedApps === 1 ? 'app' : 'apps'} tracked
                  </Text>
                </View>
                <Text style={{ fontSize: 15, color: '#2D5A3D', fontWeight: '700' }}>
                  x{appMult.toFixed(2)}
                </Text>
              </View>
            </>
          )}

          <View style={{ height: 1, backgroundColor: '#F0EDE5' }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
            <View>
              <Text style={{ fontSize: 15, color: '#1A1A1A', fontWeight: '500' }}>Total XP Reward</Text>
              <Text style={{ fontSize: 12, color: '#8B9D77', marginTop: 2 }}>
                ({goal.xpReward} + 5){streakMultiplier > 1 ? ` x ${streakMultiplier} streak` : ''}
              </Text>
            </View>
            <Text style={{ fontSize: 15, color: '#F4A261', fontWeight: '700' }}>
              +{finalXp} XP
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: '#F0EDE5' }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
            <Text style={{ fontSize: 15, color: '#1A1A1A', fontWeight: '500' }}>Consecutive Misses</Text>
            <Text style={{
              fontSize: 15,
              fontWeight: '700',
              color: goal.consecutiveMisses > 0 ? '#EF4444' : '#2D5A3D',
            }}>
              {goal.consecutiveMisses}
            </Text>
          </View>
        </View>

        {/* ── Active Status Card ────────────────────────── */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D5A3D', marginBottom: 4 }}>
                Status
              </Text>
              <Text style={{ fontSize: 13, color: '#8B9D77' }}>
                {goal.isActive
                  ? 'This goal is currently active'
                  : 'Activate to start tracking this goal'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => toggleGoalActive(goal.id)}
              activeOpacity={0.7}
              style={{
                width: 90,
                height: 32,
                borderRadius: 16,
                backgroundColor: goal.isActive ? '#2D5A3D' : '#D1D5DB',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 3,
              }}
            >
              {goal.isActive ? (
                <>
                  <Text style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginRight: 2 }}>
                    Active
                  </Text>
                  <View style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 2,
                    elevation: 2,
                  }} />
                </>
              ) : (
                <>
                  <View style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 2,
                    elevation: 2,
                  }} />
                  <Text style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginLeft: 2 }}>
                    Inactive
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Action Buttons ───────────────────────────── */}
        <TouchableOpacity
          onPress={handleEdit}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#2D5A3D',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#EF4444',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Delete</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Log Progress Modal ─────────────────────────── */}
      <Modal
        visible={showLogModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogModal(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          activeOpacity={1}
          onPress={() => {
            setShowLogModal(false);
            setLogAmount('');
            setSelectedApp(null);
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
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
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 }}>
              Log {isTimeGoal ? 'Screen Time' : 'App Open'}
            </Text>

            {selectedApp && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
                backgroundColor: '#F5F5F0',
                padding: 10,
                borderRadius: 10,
              }}>
                <AppBrandIcon appName={selectedApp} size={18} />
                <Text style={{ fontSize: 14, color: '#1A1A1A', marginLeft: 8, fontWeight: '500' }}>
                  {selectedApp}
                </Text>
              </View>
            )}

            <TextInput
              placeholder={isTimeGoal ? 'Minutes (e.g., 15)' : 'Number of opens'}
              placeholderTextColor="#B0BCA4"
              keyboardType="number-pad"
              value={logAmount}
              onChangeText={setLogAmount}
              autoFocus
              style={{
                backgroundColor: '#F5F5F0',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: '#1A1A1A',
                marginBottom: 20,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowLogModal(false);
                  setLogAmount('');
                  setSelectedApp(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#F5F5F0',
                  paddingVertical: 14,
                  borderRadius: 12,
                }}
              >
                <Text style={{ textAlign: 'center', color: '#8B9D77', fontWeight: '600', fontSize: 15 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogProgress}
                style={{
                  flex: 1,
                  backgroundColor: '#2D5A3D',
                  paddingVertical: 14,
                  borderRadius: 12,
                }}
              >
                <Text style={{ textAlign: 'center', color: '#FFF', fontWeight: '600', fontSize: 15 }}>
                  Log
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
