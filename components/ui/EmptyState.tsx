import { View, Text } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: 'goals' | 'village' | 'stats';
}

function GoalsEmptyIcon() {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
      <Circle cx="40" cy="40" r="35" stroke="#E8EDE5" strokeWidth={4} strokeDasharray="8 8" />
      <Circle cx="40" cy="40" r="20" stroke="#8B9D77" strokeWidth={3} />
      <Circle cx="40" cy="40" r="6" fill="#2D5A3D" />
      <Path
        d="M40 15V5M40 75V65M65 40H75M5 40H15"
        stroke="#8B9D77"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function VillageEmptyIcon() {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80" fill="none">
      {/* Ground */}
      <Path d="M0 60 Q40 55 80 60 L80 80 L0 80 Z" fill="#E8EDE5" />
      
      {/* House outline */}
      <Path
        d="M25 60V40L40 25L55 40V60"
        stroke="#8B9D77"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="6 4"
      />
      
      {/* Plus sign */}
      <Circle cx="40" cy="45" r="12" fill="#F5F5F0" stroke="#2D5A3D" strokeWidth={2} />
      <Path d="M40 39V51M34 45H46" stroke="#2D5A3D" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default function EmptyState({ title, message, icon = 'goals' }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      <View className="mb-6">
        {icon === 'goals' && <GoalsEmptyIcon />}
        {icon === 'village' && <VillageEmptyIcon />}
      </View>
      <Text className="text-lg font-bold text-[#1A1A1A] text-center mb-2">
        {title}
      </Text>
      <Text className="text-sm text-[#8B9D77] text-center">
        {message}
      </Text>
    </View>
  );
}
