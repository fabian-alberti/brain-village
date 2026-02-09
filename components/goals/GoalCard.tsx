import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useRef } from 'react';
import { Goal, APP_CATEGORIES } from '@/lib/types';
import AppBrandIcon, { CategoryIcon } from '@/components/ui/AppBrandIcon';
import { formatTime } from '@/lib/xp';

// Helper to blur active element on web before navigation
const blurActiveElement = () => {
  if (Platform.OS === 'web' && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

// ── Type Icons ─────────────────────────────────────────────────

function ScreenTimeIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="3" width="20" height="14" rx="2" stroke="#2D5A3D" strokeWidth={1.5} fill="#E8F5E9" />
      <Path d="M8 21H16" stroke="#2D5A3D" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M12 17V21" stroke="#2D5A3D" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function AppTimeIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#2D5A3D" strokeWidth={1.5} fill="#E8F5E9" />
      <Path d="M12 7V12L15 14" stroke="#2D5A3D" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AppOpensIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke="#2D5A3D" strokeWidth={1.5} fill="#E8F5E9" />
      <Path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke="#2D5A3D" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function TrashIconWhite() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6H5H21" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ── Helpers ─────────────────────────────────────────────────────

function getTypeIcon(type: Goal['type']) {
  switch (type) {
    case 'overall_screen_time': return <ScreenTimeIcon />;
    case 'app_time_limit': return <AppTimeIcon />;
    case 'app_opens_limit': return <AppOpensIcon />;
  }
}

function getTypeLabel(type: Goal['type']) {
  switch (type) {
    case 'overall_screen_time': return 'Screen Time';
    case 'app_time_limit': return 'App Time';
    case 'app_opens_limit': return 'App Opens';
  }
}

// ── Component ──────────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal;
  onDelete: () => void;
}

export default function GoalCard({ goal, onDelete }: GoalCardProps) {
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);

  const categories = goal.targetCategories || [];
  const apps = goal.targetApps || [];

  const getAppItems = (): { name: string; isCategory: boolean; catId?: string }[] => {
    const items: { name: string; isCategory: boolean; catId?: string }[] = [];
    categories.forEach(catId => {
      const cat = APP_CATEGORIES.find(c => c.id === catId);
      if (cat) items.push({ name: cat.name, isCategory: true, catId });
    });
    apps.forEach(appName => {
      items.push({ name: appName, isCategory: false });
    });
    return items;
  };

  const appItems = getAppItems();
  const hasApps = appItems.length > 0;

  // Progress
  const usagePercent = goal.limit > 0
    ? Math.min(100, Math.round((goal.currentProgress / goal.limit) * 100))
    : 0;

  const progressText = goal.type === 'app_opens_limit'
    ? `${goal.currentProgress} / ${goal.limit}`
    : `${formatTime(goal.currentProgress)} / ${formatTime(goal.limit)}`;

  // Progress bar color based on usage
  const progressColor = usagePercent > 80 ? '#EF4444' : usagePercent > 50 ? '#F4A261' : '#2D5A3D';

  const renderRightActions = () => (
    <TouchableOpacity
      onPress={() => {
        swipeableRef.current?.close();
        onDelete();
      }}
      activeOpacity={0.8}
      style={{
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        marginBottom: 12,
      }}
    >
      <TrashIconWhite />
      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '600', marginTop: 4 }}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          blurActiveElement();
          router.push(`/goal/${goal.id}`);
        }}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          // Subtle shadow for depth
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Top row: Icon + Info */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: '#F0F7F0',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 14,
          }}>
            {getTypeIcon(goal.type)}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.2 }} numberOfLines={1}>
              {goal.name}
            </Text>
            <Text style={{ fontSize: 13, color: '#8B9D77', marginTop: 1 }}>
              {getTypeLabel(goal.type)}
            </Text>
          </View>

          {/* Percentage badge */}
          <View style={{
            backgroundColor: usagePercent > 80 ? '#FEF2F2' : usagePercent > 50 ? '#FFF8F0' : '#F0F7F0',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 10,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: progressColor }}>
              {usagePercent}%
            </Text>
          </View>
        </View>

        {/* App icons row */}
        {hasApps && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingLeft: 58 }}>
            {appItems.slice(0, 5).map((item, i) => (
              <View key={i} style={{ marginRight: 6, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
                {item.isCategory ? (
                  <CategoryIcon categoryId={item.catId!} size={17} />
                ) : (
                  <AppBrandIcon appName={item.name} size={17} />
                )}
              </View>
            ))}
            {appItems.length > 5 && (
              <Text style={{ fontSize: 11, color: '#8B9D77', fontWeight: '600' }}>
                +{appItems.length - 5}
              </Text>
            )}
            <Text style={{ fontSize: 12, color: '#B0BCA4', marginLeft: 6 }} numberOfLines={1}>
              {appItems.slice(0, 2).map(i => i.name).join(', ')}
              {appItems.length > 2 ? ` +${appItems.length - 2}` : ''}
            </Text>
          </View>
        )}

        {/* Progress bar */}
        <View style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#8B9D77' }}>
              {progressText}
            </Text>
          </View>
          <View style={{ height: 5, backgroundColor: '#F0EDE5', borderRadius: 3, overflow: 'hidden' }}>
            <View
              style={{
                height: '100%',
                borderRadius: 3,
                backgroundColor: progressColor,
                width: `${usagePercent}%`,
              }}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}
