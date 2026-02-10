import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import { useGoals, useApp } from '@/context/AppContext';
import GoalCard from '@/components/goals/GoalCard';
import EmptyState from '@/components/ui/EmptyState';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Helper to blur active element on web before navigation
const blurActiveElement = () => {
  if (Platform.OS === 'web' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

export default function GoalsScreen() {
  const router = useRouter();
  const goals = useGoals();
  const { removeGoal, toggleGoalActive } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleDeleteGoal = (goalId: string, goalName: string) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goalName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeGoal(goalId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF2' }} edges={['top']}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
      }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 }}>
          Goals
        </Text>
        <TouchableOpacity
          onPress={() => {
            blurActiveElement();
            router.push('/goal/create');
          }}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#2D5A3D',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Goals List */}
      {goals.length === 0 ? (
        <EmptyState
          icon="goals"
          title="No goals yet"
          message="Create your first screen time goal and start building healthier digital habits!"
        />
      ) : (
        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GoalCard
              goal={item}
              onDelete={() => handleDeleteGoal(item.id, item.name)}
              onToggleActive={() => toggleGoalActive(item.id)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2D5A3D"
              colors={['#2D5A3D']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
