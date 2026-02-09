import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useGoals, useApp } from '@/context/AppContext';
import { logProgress, completeGoal } from '@/lib/firebase';
import { getGoalProgress, getGoalTypeLabel, formatTime } from '@/lib/xp';
import AppBrandIcon, { CategoryIcon } from '@/components/ui/AppBrandIcon';

// ── Progress Ring ──────────────────────────────────────────────

function ProgressRing({ progress, size = 180 }: { progress: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  const ringColor = progress > 80 ? '#EF4444' : progress > 50 ? '#F4A261' : '#2D5A3D';

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
        <Text style={{ fontSize: 36, fontWeight: '800', color: '#1A1A1A' }}>
          {Math.round(progress)}%
        </Text>
        <Text style={{ fontSize: 13, color: '#8B9D77', marginTop: 2 }}>remaining</Text>
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────

export default function GoalDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser } = useApp();
  const goals = useGoals();

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

  const handleLogProgress = async () => {
    const amount = parseInt(logAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }
    if (!firebaseUser || !id) return;
    try {
      await logProgress(firebaseUser.uid, id, amount, selectedApp || undefined);
      setShowLogModal(false);
      setLogAmount('');
      setSelectedApp(null);
    } catch {
      Alert.alert('Error', 'Failed to log progress');
    }
  };

  const handleCompleteGoal = async () => {
    if (!firebaseUser || !id) return;
    Alert.alert(
      'Complete Goal',
      `Mark "${goal.name}" as complete for today? You'll earn ${goal.xpReward} XP!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await completeGoal(firebaseUser.uid, id);
            } catch {
              Alert.alert('Error', 'Failed to complete goal');
            }
          },
        },
      ]
    );
  };

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
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 1,
          }}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.2 }} numberOfLines={1}>
            {goal.name}
          </Text>
          <Text style={{ fontSize: 13, color: '#8B9D77', marginTop: 1 }}>{typeLabel}</Text>
        </View>

        <View style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: '#E8F5E9',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <MaterialCommunityIcons
            name={goal.type === 'overall_screen_time' ? 'cellphone' : goal.type === 'app_time_limit' ? 'timer-outline' : 'gesture-tap'}
            size={22}
            color="#2D5A3D"
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Ring Card */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: 28,
          alignItems: 'center',
          marginBottom: 12,
          width: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <ProgressRing progress={progress} />

          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#8B9D77' }}>
              {isTimeGoal ? 'Time used today' : 'Opens today'}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginTop: 4 }}>
              {isTimeGoal
                ? `${formatTime(goal.currentProgress)} / ${formatTime(goal.limit)}`
                : `${goal.currentProgress} / ${goal.limit}`
              }
            </Text>
          </View>

          {goal.isCompleted ? (
            <View style={{
              marginTop: 20,
              backgroundColor: '#E8F5E9',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#2D5A3D" />
              <Text style={{ color: '#2D5A3D', fontWeight: '700', fontSize: 15, marginLeft: 8 }}>
                Completed!
              </Text>
              <Text style={{ color: '#F4A261', fontWeight: '700', marginLeft: 8 }}>
                +{goal.xpReward} XP
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleCompleteGoal}
              style={{
                marginTop: 20,
                backgroundColor: '#2D5A3D',
                paddingHorizontal: 28,
                paddingVertical: 14,
                borderRadius: 14,
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>
                Mark as Complete (+{goal.xpReward} XP)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tracked Apps */}
        {((goal.targetCategories || []).length > 0 || goal.targetApps.length > 0) && (
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B9D77', marginBottom: 12 }}>
              Tracked Apps
            </Text>
            {(goal.targetCategories || []).map((catId) => {
              const cat = require('@/lib/types').APP_CATEGORIES.find((c: any) => c.id === catId);
              return (
                <View key={catId} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F0EDE5',
                }}>
                  <View style={{ marginRight: 12, width: 24, alignItems: 'center' }}>
                    <CategoryIcon categoryId={catId} size={20} />
                  </View>
                  <Text style={{ fontSize: 15, color: '#1A1A1A', flex: 1 }}>
                    {cat?.name || catId}
                  </Text>
                  <View style={{
                    backgroundColor: '#E8F5E9',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}>
                    <Text style={{ fontSize: 11, color: '#2D5A3D', fontWeight: '600' }}>Category</Text>
                  </View>
                </View>
              );
            })}
            {goal.targetApps.map((appName, i) => (
              <View key={appName} style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                borderBottomWidth: i < goal.targetApps.length - 1 ? 1 : 0,
                borderBottomColor: '#F0EDE5',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ marginRight: 12, width: 24, alignItems: 'center' }}>
                    <AppBrandIcon appName={appName} size={20} />
                  </View>
                  <Text style={{ fontSize: 15, color: '#1A1A1A' }}>{appName}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedApp(appName);
                    setShowLogModal(true);
                  }}
                  style={{
                    backgroundColor: '#F5F5F0',
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
            ))}
          </View>
        )}

        {/* Quick Log */}
        {goal.targetApps.length === 0 && (goal.targetCategories || []).length === 0 && !goal.isCompleted && (
          <TouchableOpacity
            onPress={() => setShowLogModal(true)}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              width: '100%',
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

        {/* Goal Info */}
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          width: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B9D77', marginBottom: 12 }}>
            Goal Info
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
            <Text style={{ fontSize: 14, color: '#8B9D77' }}>Daily Limit</Text>
            <Text style={{ fontSize: 14, color: '#1A1A1A', fontWeight: '600' }}>
              {isTimeGoal ? formatTime(goal.limit) : `${goal.limit} opens`}
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: '#F0EDE5' }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
            <Text style={{ fontSize: 14, color: '#8B9D77' }}>XP Reward</Text>
            <Text style={{ fontSize: 14, color: '#F4A261', fontWeight: '700' }}>
              +{goal.xpReward} XP
            </Text>
          </View>

          <View style={{ height: 1, backgroundColor: '#F0EDE5' }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
            <Text style={{ fontSize: 14, color: '#8B9D77' }}>Consecutive Misses</Text>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: goal.consecutiveMisses > 0 ? '#EF4444' : '#2D5A3D',
            }}>
              {goal.consecutiveMisses}
            </Text>
          </View>
        </View>
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
