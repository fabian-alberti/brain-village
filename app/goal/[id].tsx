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
import Svg, { Path, Circle, G } from 'react-native-svg';
import { useGoals, useApp } from '@/context/AppContext';
import { logProgress, completeGoal } from '@/lib/firebase';
import { getGoalProgress, getGoalTypeLabel, formatTime } from '@/lib/xp';

// Back arrow icon
function BackIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke="#1A1A1A"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Progress ring component
function ProgressRing({ progress, size = 200 }: { progress: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#E8EDE5"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progress > 30 ? '#2D5A3D' : progress > 0 ? '#F4A261' : '#9B2335'}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View 
        className="absolute inset-0 items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Text className="text-4xl font-bold text-[#1A1A1A]">
          {Math.round(progress)}%
        </Text>
        <Text className="text-sm text-[#8B9D77]">remaining</Text>
      </View>
    </View>
  );
}

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
      <SafeAreaView className="flex-1 bg-[#F5F5F0] items-center justify-center">
        <Text className="text-lg text-[#8B9D77]">Goal not found</Text>
        <TouchableOpacity 
          className="mt-4 bg-[#2D5A3D] px-6 py-3 rounded-xl"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Go Back</Text>
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
    } catch (error) {
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
            } catch (error) {
              Alert.alert('Error', 'Failed to complete goal');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F0]">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4">
        <TouchableOpacity onPress={() => router.back()} className="p-1 mr-3">
          <BackIcon />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-[#1A1A1A]" numberOfLines={1}>
            {goal.name}
          </Text>
          <Text className="text-sm text-[#8B9D77]">{typeLabel}</Text>
        </View>
        <View className="w-12 h-12 rounded-xl bg-white items-center justify-center shadow-sm">
          <Text className="text-2xl">{goal.icon}</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 16, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Ring */}
        <View className="bg-white rounded-3xl p-8 items-center mb-4 w-full">
          <ProgressRing progress={progress} />
          
          <View className="mt-6 items-center">
            <Text className="text-lg text-[#8B9D77]">
              {isTimeGoal ? 'Time used today' : 'Opens today'}
            </Text>
            <Text className="text-2xl font-bold text-[#1A1A1A] mt-1">
              {isTimeGoal 
                ? `${formatTime(goal.currentProgress)} / ${formatTime(goal.limit)}`
                : `${goal.currentProgress} / ${goal.limit}`
              }
            </Text>
          </View>

          {goal.isCompleted ? (
            <View className="mt-6 bg-[#E8EDE5] px-6 py-3 rounded-xl flex-row items-center">
              <Text className="text-[#2D5A3D] font-bold text-lg">✓ Completed!</Text>
              <Text className="text-[#F4A261] font-bold ml-2">+{goal.xpReward} XP</Text>
            </View>
          ) : (
            <TouchableOpacity
              className="mt-6 bg-[#2D5A3D] px-8 py-4 rounded-xl"
              onPress={handleCompleteGoal}
            >
              <Text className="text-white font-bold text-base">
                Mark as Complete (+{goal.xpReward} XP)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* App Breakdown (for app-specific goals) */}
        {goal.targetApps.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-4 w-full">
            <Text className="text-sm font-medium text-[#8B9D77] mb-3">
              Tracked Apps
            </Text>
            {goal.targetApps.map((appName) => (
              <View 
                key={appName}
                className="flex-row items-center justify-between py-3 border-b border-[#F5F5F0] last:border-b-0"
              >
                <Text className="text-base text-[#1A1A1A]">{appName}</Text>
                <TouchableOpacity
                  className="bg-[#F5F5F0] px-3 py-1.5 rounded-lg"
                  onPress={() => {
                    setSelectedApp(appName);
                    setShowLogModal(true);
                  }}
                >
                  <Text className="text-sm text-[#2D5A3D] font-medium">
                    Log {isTimeGoal ? 'Time' : 'Open'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Quick Log Button (for overall goals) */}
        {goal.targetApps.length === 0 && !goal.isCompleted && (
          <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-4 w-full flex-row items-center justify-center"
            onPress={() => setShowLogModal(true)}
          >
            <Text className="text-[#2D5A3D] font-bold text-base">
              + Log {isTimeGoal ? 'Screen Time' : 'App Open'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Goal Info */}
        <View className="bg-white rounded-2xl p-4 w-full">
          <Text className="text-sm font-medium text-[#8B9D77] mb-3">Goal Info</Text>
          
          <View className="flex-row justify-between py-2">
            <Text className="text-sm text-[#8B9D77]">Daily Limit</Text>
            <Text className="text-sm text-[#1A1A1A] font-medium">
              {isTimeGoal ? formatTime(goal.limit) : `${goal.limit} opens`}
            </Text>
          </View>
          
          <View className="flex-row justify-between py-2">
            <Text className="text-sm text-[#8B9D77]">XP Reward</Text>
            <Text className="text-sm text-[#F4A261] font-bold">+{goal.xpReward} XP</Text>
          </View>
          
          <View className="flex-row justify-between py-2">
            <Text className="text-sm text-[#8B9D77]">Consecutive Misses</Text>
            <Text className={`text-sm font-medium ${
              goal.consecutiveMisses > 0 ? 'text-[#9B2335]' : 'text-[#2D5A3D]'
            }`}>
              {goal.consecutiveMisses}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Log Progress Modal */}
      <Modal
        visible={showLogModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-[#1A1A1A] mb-4">
              Log {isTimeGoal ? 'Screen Time' : 'App Open'}
            </Text>
            
            {selectedApp && (
              <Text className="text-sm text-[#8B9D77] mb-2">
                App: {selectedApp}
              </Text>
            )}
            
            <TextInput
              className="bg-[#F5F5F0] rounded-xl px-4 py-3 text-base text-[#1A1A1A] mb-4"
              placeholder={isTimeGoal ? 'Minutes (e.g., 15)' : 'Number of opens'}
              placeholderTextColor="#8B9D77"
              keyboardType="number-pad"
              value={logAmount}
              onChangeText={setLogAmount}
              autoFocus
            />
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-[#F5F5F0] py-3 rounded-xl"
                onPress={() => {
                  setShowLogModal(false);
                  setLogAmount('');
                  setSelectedApp(null);
                }}
              >
                <Text className="text-center text-[#8B9D77] font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-[#2D5A3D] py-3 rounded-xl"
                onPress={handleLogProgress}
              >
                <Text className="text-center text-white font-bold">Log</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
