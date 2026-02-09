import { View, Text, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/context/AppContext';
import { getLevelProgress, getXpForNextLevel, LEVEL_THRESHOLDS } from '@/lib/xp';
import VillageIllustration from '@/components/village/VillageIllustration';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VILLAGE_WIDTH = Math.min(SCREEN_WIDTH - 32, 350);
const VILLAGE_HEIGHT = VILLAGE_WIDTH * 0.67;

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF2' }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 }}>
          Your Village
        </Text>
        <Text style={{ fontSize: 14, color: '#8B9D77', marginTop: 2 }}>
          {villageState === 'flourishing'
            ? 'Keep up the great work!'
            : 'Complete your goals to restore your village'}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Level Progress Card */}
        <View style={{
          marginHorizontal: 16,
          marginTop: 12,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: '#F4A261',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 18 }}>{level}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>{levelName}</Text>
                <Text style={{ fontSize: 12, color: '#8B9D77', marginTop: 1 }}>Level {level} of 5</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#F4A261' }}>{totalXp} XP</Text>
              {!isMaxLevel && (
                <Text style={{ fontSize: 11, color: '#8B9D77', marginTop: 1 }}>
                  {xpNeededForLevel - xpInCurrentLevel} XP to next
                </Text>
              )}
            </View>
          </View>

          {/* Progress bar */}
          <View style={{ height: 8, backgroundColor: '#F0EDE5', borderRadius: 4, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                backgroundColor: '#F4A261',
                borderRadius: 4,
                width: isMaxLevel ? '100%' : `${levelProgress}%`,
              }}
            />
          </View>

          {!isMaxLevel && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text style={{ fontSize: 11, color: '#B0BCA4' }}>{currentLevelXp} XP</Text>
              <Text style={{ fontSize: 11, color: '#B0BCA4' }}>{xpForNext} XP</Text>
            </View>
          )}
        </View>

        {/* Village Illustration */}
        <View style={{ alignItems: 'center', marginTop: 20, paddingHorizontal: 16 }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }}>
            <VillageIllustration
              level={level}
              state={villageState}
              width={VILLAGE_WIDTH}
              height={VILLAGE_HEIGHT}
            />
          </View>

          {/* State badge */}
          <View style={{
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: villageState === 'flourishing' ? '#E8F5E9' : '#FEF2F2',
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <MaterialCommunityIcons
              name={villageState === 'flourishing' ? 'star-four-points' : 'alert-circle-outline'}
              size={16}
              color={villageState === 'flourishing' ? '#2D5A3D' : '#EF4444'}
            />
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: villageState === 'flourishing' ? '#2D5A3D' : '#EF4444',
              marginLeft: 6,
            }}>
              {villageState === 'flourishing'
                ? 'Village is Flourishing!'
                : 'Village Needs Attention'}
            </Text>
          </View>

          {/* Warning */}
          {consecutiveMisses > 0 && (
            <View style={{
              marginTop: 12,
              backgroundColor: '#FFF8F0',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <MaterialCommunityIcons name="lightning-bolt" size={18} color="#F4A261" />
              <Text style={{ fontSize: 13, color: '#F4A261', marginLeft: 8, flex: 1 }}>
                {consecutiveMisses === 1
                  ? '1 goal missed. Complete tomorrow to keep your village flourishing!'
                  : `${consecutiveMisses} consecutive misses. Your village is suffering!`}
              </Text>
            </View>
          )}
        </View>

        {/* Level Progression */}
        <View style={{
          marginHorizontal: 16,
          marginTop: 20,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B9D77', marginBottom: 14 }}>
            Level Progression
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {[1, 2, 3, 4, 5].map((lvl) => (
              <View key={lvl} style={{ alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: lvl <= level ? '#2D5A3D' : '#F0EDE5',
                }}>
                  <Text style={{
                    fontWeight: '700',
                    fontSize: 15,
                    color: lvl <= level ? '#FFF' : '#B0BCA4',
                  }}>
                    {lvl}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: '#B0BCA4', marginTop: 4 }}>
                  {LEVEL_THRESHOLDS[lvl - 1]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
