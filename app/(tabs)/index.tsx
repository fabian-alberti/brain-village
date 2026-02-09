import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import Svg, { Path, Line } from 'react-native-svg';
import { useGoals, useApp } from '@/context/AppContext';
import { deleteGoal } from '@/lib/firebase';
import GoalCard from '@/components/goals/GoalCard';
import EmptyState from '@/components/ui/EmptyState';

// Helper to blur active element on web before navigation (fixes aria-hidden warning)
const blurActiveElement = () => {
  if (Platform.OS === 'web' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

// Plus icon
function PlusIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V19M5 12H19"
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function GoalsScreen() {
  const router = useRouter();
  const goals = useGoals();
  const { firebaseUser } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Goals are already synced via Firestore listener
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleEditGoal = (goalId: string) => {
    blurActiveElement();
    router.push(`/goal/create?edit=${goalId}`);
  };

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
            if (firebaseUser) {
              try {
                await deleteGoal(firebaseUser.uid, goalId);
              } catch (error) {
                Alert.alert('Error', 'Failed to delete goal');
              }
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F0]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <View>
          <Text className="text-2xl font-bold text-[#1A1A1A]">Goals</Text>
          <Text className="text-sm text-[#8B9D77] mt-0.5">
            {goals.length} {goals.length === 1 ? 'goal' : 'goals'} active
          </Text>
        </View>
        
        <TouchableOpacity
          className="bg-[#2D5A3D] w-12 h-12 rounded-full items-center justify-center shadow-md"
          onPress={() => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.tsx:plusButton',message:'Plus button pressed',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            try {
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.tsx:beforeBlur',message:'Before blurActiveElement',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              blurActiveElement();
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.tsx:afterBlur',message:'After blurActiveElement',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.tsx:beforePush',message:'Before router.push',data:{route:'/goal/create'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
              router.push('/goal/create');
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.tsx:afterPush',message:'After router.push',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
              // #endregion
            } catch (err) {
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.tsx:error',message:'Error in handler',data:{error:String(err)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B-C'})}).catch(()=>{});
              // #endregion
            }
          }}
          activeOpacity={0.8}
        >
          <PlusIcon />
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
              onEdit={() => handleEditGoal(item.id)}
              onDelete={() => handleDeleteGoal(item.id, item.name)}
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
