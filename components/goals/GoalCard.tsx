import { View, Text, TouchableOpacity, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { Goal } from '@/lib/types';
import { getGoalProgress, getGoalTypeLabel, formatTime } from '@/lib/xp';

// Helper to blur active element on web before navigation (fixes aria-hidden warning)
const blurActiveElement = () => {
  if (Platform.OS === 'web' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

// Edit icon
function EditIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13"
        stroke="#8B9D77"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
        stroke="#8B9D77"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Trash icon
function TrashIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6H5H21"
        stroke="#9B2335"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z"
        stroke="#9B2335"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface GoalCardProps {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
}

export default function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const router = useRouter();
  const progress = getGoalProgress(goal);
  const typeLabel = getGoalTypeLabel(goal.type);
  
  // Format limit display
  const limitDisplay = goal.type === 'app_opens_limit' 
    ? `${goal.limit} opens`
    : formatTime(goal.limit);
  
  // Format current progress display
  const progressDisplay = goal.type === 'app_opens_limit'
    ? `${goal.currentProgress} / ${goal.limit}`
    : `${formatTime(goal.currentProgress)} / ${formatTime(goal.limit)}`;

  return (
    <Pressable
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm active:opacity-90"
      onPress={() => {
        blurActiveElement();
        router.push(`/goal/${goal.id}`);
      }}
    >
      <View className="flex-row items-start justify-between">
        {/* Left side - Icon and info */}
        <View className="flex-row items-start flex-1">
          <View className="w-12 h-12 rounded-xl bg-[#F5F5F0] items-center justify-center mr-3">
            <Text className="text-2xl">{goal.icon}</Text>
          </View>
          
          <View className="flex-1">
            <Text className="text-base font-bold text-[#1A1A1A]" numberOfLines={1}>
              {goal.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <View className="bg-[#E8EDE5] px-2 py-0.5 rounded-md">
                <Text className="text-xs text-[#2D5A3D] font-medium">
                  {typeLabel}
                </Text>
              </View>
              <Text className="text-xs text-[#8B9D77] ml-2">
                {limitDisplay}
              </Text>
            </View>
            
            {/* Apps list */}
            {goal.targetApps.length > 0 && (
              <Text className="text-xs text-[#8B9D77] mt-1" numberOfLines={1}>
                {goal.targetApps.join(', ')}
              </Text>
            )}
          </View>
        </View>
        
        {/* Right side - Actions */}
        <View className="flex-row items-center">
          <TouchableOpacity
            className="p-2"
            onPress={(e) => {
              e.stopPropagation();
              blurActiveElement();
              onEdit();
            }}
          >
            <EditIcon />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2"
            onPress={(e) => {
              e.stopPropagation();
              blurActiveElement();
              onDelete();
            }}
          >
            <TrashIcon />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Progress section */}
      <View className="mt-3">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xs text-[#8B9D77]">
            {progressDisplay}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-sm font-bold text-[#2D5A3D]">
              {Math.round(progress)}%
            </Text>
            {goal.isCompleted && (
              <View className="ml-2 bg-[#2D5A3D] px-2 py-0.5 rounded-md">
                <Text className="text-xs text-white font-medium">Done!</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Progress bar */}
        <View className="h-2 bg-[#E8EDE5] rounded-full overflow-hidden">
          <View 
            className={`h-full rounded-full ${
              goal.isCompleted 
                ? 'bg-[#2D5A3D]' 
                : progress > 30 
                  ? 'bg-[#F4A261]' 
                  : 'bg-[#9B2335]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </View>
        
        {/* XP reward */}
        <View className="flex-row items-center justify-end mt-2">
          <Text className="text-xs text-[#F4A261] font-bold">
            +{goal.xpReward} XP
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
