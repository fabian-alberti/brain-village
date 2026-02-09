import { View, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/context/AppContext';
import { getLevelProgress, getXpForNextLevel, LEVEL_THRESHOLDS } from '@/lib/xp';
import VillageIllustration from '@/components/village/VillageIllustration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VILLAGE_WIDTH = Math.min(SCREEN_WIDTH - 32, 350);
const VILLAGE_HEIGHT = VILLAGE_WIDTH * 0.67;

// Level names
const LEVEL_NAMES = [
  'Humble Beginnings',
  'Cozy Cottage',
  'Growing Town',
  'Bustling Village',
  'Thriving Kingdom',
];

export default function VillageScreen() {
  const user = useUser();
  
  const level = user?.currentLevel ?? 1;
  const totalXp = user?.totalXp ?? 0;
  const villageState = user?.villageState ?? 'flourishing';
  const consecutiveMisses = user?.consecutiveMisses ?? 0;
  
  const levelProgress = getLevelProgress(totalXp);
  const xpForNext = getXpForNextLevel(level);
  const currentLevelXp = LEVEL_THRESHOLDS[level - 1];
  const xpInCurrentLevel = totalXp - currentLevelXp;
  const xpNeededForLevel = xpForNext - currentLevelXp;
  
  const isMaxLevel = level >= 5;
  const levelName = LEVEL_NAMES[level - 1] || 'Unknown';

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F0]" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4">
        <Text className="text-2xl font-bold text-[#1A1A1A]">Your Village</Text>
        <Text className="text-sm text-[#8B9D77] mt-0.5">
          {villageState === 'flourishing' 
            ? 'Keep up the great work!' 
            : 'Complete your goals to restore your village'}
        </Text>
      </View>

      {/* Level Progress */}
      <View className="mx-4 bg-white rounded-2xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-[#F4A261] items-center justify-center mr-3">
              <Text className="text-white font-bold text-lg">{level}</Text>
            </View>
            <View>
              <Text className="text-base font-bold text-[#1A1A1A]">{levelName}</Text>
              <Text className="text-xs text-[#8B9D77]">Level {level} of 5</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-lg font-bold text-[#F4A261]">{totalXp} XP</Text>
            {!isMaxLevel && (
              <Text className="text-xs text-[#8B9D77]">
                {xpNeededForLevel - xpInCurrentLevel} XP to next level
              </Text>
            )}
          </View>
        </View>
        
        {/* XP Progress bar */}
        <View className="h-3 bg-[#E8EDE5] rounded-full overflow-hidden">
          <View 
            className="h-full bg-[#F4A261] rounded-full"
            style={{ width: isMaxLevel ? '100%' : `${levelProgress}%` }}
          />
        </View>
        
        {!isMaxLevel && (
          <View className="flex-row justify-between mt-1">
            <Text className="text-xs text-[#8B9D77]">{currentLevelXp} XP</Text>
            <Text className="text-xs text-[#8B9D77]">{xpForNext} XP</Text>
          </View>
        )}
      </View>

      {/* Village Illustration */}
      <View className="flex-1 items-center justify-center px-4">
        <View className="bg-white rounded-3xl p-4 shadow-md" style={{ 
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
        }}>
          <VillageIllustration 
            level={level} 
            state={villageState}
            width={VILLAGE_WIDTH}
            height={VILLAGE_HEIGHT}
          />
        </View>
        
        {/* Village State Indicator */}
        <View className={`mt-4 px-4 py-2 rounded-full ${
          villageState === 'flourishing' ? 'bg-[#E8EDE5]' : 'bg-[#FDEAEA]'
        }`}>
          <Text className={`text-sm font-medium ${
            villageState === 'flourishing' ? 'text-[#2D5A3D]' : 'text-[#9B2335]'
          }`}>
            {villageState === 'flourishing' 
              ? '✨ Village is Flourishing!' 
              : '⚠️ Village Needs Attention'}
          </Text>
        </View>
        
        {/* Consecutive Misses Warning */}
        {consecutiveMisses > 0 && (
          <View className="mt-3 bg-[#FFF8F0] rounded-xl px-4 py-3 mx-4">
            <Text className="text-sm text-[#F4A261] text-center">
              {consecutiveMisses === 1 
                ? '⚡ 1 goal missed. Complete tomorrow to keep your village flourishing!'
                : `⚡ ${consecutiveMisses} consecutive misses. Your village is suffering!`}
            </Text>
          </View>
        )}
      </View>

      {/* Level Info */}
      <View className="mx-4 mb-4 bg-white rounded-2xl p-4">
        <Text className="text-sm font-medium text-[#8B9D77] mb-3">Level Progression</Text>
        <View className="flex-row justify-between">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <View key={lvl} className="items-center">
              <View className={`w-10 h-10 rounded-full items-center justify-center ${
                lvl <= level 
                  ? 'bg-[#2D5A3D]' 
                  : 'bg-[#E8EDE5]'
              }`}>
                <Text className={`font-bold ${
                  lvl <= level ? 'text-white' : 'text-[#8B9D77]'
                }`}>
                  {lvl}
                </Text>
              </View>
              <Text className="text-xs text-[#8B9D77] mt-1">
                {LEVEL_THRESHOLDS[lvl - 1]}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
