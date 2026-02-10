import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useApp, useGoals, useUser } from '@/context/AppContext';
import { useDeviceApps } from '@/hooks/useDeviceApps';
import AppBrandIcon, { CategoryIcon } from '@/components/ui/AppBrandIcon';
import { GoalType, APP_CATEGORIES, AppCategory, Goal } from '@/lib/types';
import { getBaseXpForGoal, calculateXpReward, calculateFinalXp, getStreakMultiplier, getAppCountMultiplier, getTotalTrackedApps } from '@/lib/xp';

// ============ ICONS ============

function ScreenTimeTypeIcon({ selected }: { selected: boolean }) {
  const stroke = selected ? '#2D5A3D' : '#888';
  const fill = selected ? '#E8F5E9' : '#F5F5F5';
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="3" width="20" height="14" rx="2" stroke={stroke} strokeWidth={1.5} fill={fill} />
      <Path d="M8 21H16" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M12 17V21" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function AppTimeTypeIcon({ selected }: { selected: boolean }) {
  const stroke = selected ? '#2D5A3D' : '#888';
  const fill = selected ? '#E8F5E9' : '#F5F5F5';
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth={1.5} fill={fill} />
      <Path d="M12 7V12L15 14" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AppOpensTypeIcon({ selected }: { selected: boolean }) {
  const stroke = selected ? '#2D5A3D' : '#888';
  const fill = selected ? '#E8F5E9' : '#F5F5F5';
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={stroke} strokeWidth={1.5} fill={fill} />
      <Path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRight() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18L15 12L9 6" stroke="#999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDown() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9L12 15L18 9" stroke="#999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GridIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="8" height="8" rx="2" fill="#2D5A3D" />
      <Rect x="13" y="3" width="8" height="8" rx="2" fill="#2D5A3D" />
      <Rect x="3" y="13" width="8" height="8" rx="2" fill="#2D5A3D" />
      <Rect x="13" y="13" width="8" height="8" rx="2" fill="#2D5A3D" />
    </Svg>
  );
}

function AppIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="4" fill="#2D5A3D" />
      <Rect x="7" y="7" width="10" height="10" rx="2" fill="#E8F5E9" />
    </Svg>
  );
}

// ============ GOAL TYPE DATA ============

const GOAL_TYPES: { type: GoalType; label: string; description: string }[] = [
  {
    type: 'overall_screen_time',
    label: 'Overall Screen Time',
    description: 'Total time across all apps',
  },
  {
    type: 'app_time_limit',
    label: 'App Time',
    description: 'Time on specific apps',
  },
  {
    type: 'app_opens_limit',
    label: 'App Opens',
    description: 'How often you open apps',
  },
];

// ============ APP PICKER MODAL ============

interface AppPickerProps {
  visible: boolean;
  availableCategories: AppCategory[];
  isDeviceFiltered: boolean;
  initialCategories: string[];
  initialApps: string[];
  onSave: (categories: string[], apps: string[]) => void;
  onCancel: () => void;
}

function AppPickerModal({ visible, availableCategories, isDeviceFiltered, initialCategories, initialApps, onSave, onCancel }: AppPickerProps) {
  const [tempCategories, setTempCategories] = useState<string[]>(initialCategories);
  const [tempApps, setTempApps] = useState<string[]>(initialApps);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset temp state when modal opens
  useEffect(() => {
    if (visible) {
      setTempCategories([...initialCategories]);
      setTempApps([...initialApps]);
      setExpandedCategory(null);
      setSearchQuery('');
    }
  }, [visible]);

  const allSelected = tempCategories.length === availableCategories.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setTempCategories([]);
      setTempApps([]);
    } else {
      setTempCategories(availableCategories.map(c => c.id));
      setTempApps([]);
    }
  };

  const toggleCategory = (categoryId: string) => {
    if (tempCategories.includes(categoryId)) {
      setTempCategories(prev => prev.filter(id => id !== categoryId));
    } else {
      setTempCategories(prev => [...prev, categoryId]);
      // Remove individual apps from this category since the whole category is now selected
      const category = availableCategories.find(c => c.id === categoryId);
      if (category) {
        const appNames = category.apps.map(a => a.name);
        setTempApps(prev => prev.filter(name => !appNames.includes(name)));
      }
    }
  };

  const toggleApp = (appName: string, categoryId: string) => {
    if (tempCategories.includes(categoryId)) {
      // Category is fully selected - deselect it and select all OTHER apps from this category
      const category = availableCategories.find(c => c.id === categoryId);
      if (category) {
        setTempCategories(prev => prev.filter(id => id !== categoryId));
        const otherApps = category.apps.filter(a => a.name !== appName).map(a => a.name);
        setTempApps(prev => {
          const cleaned = prev.filter(name => !category.apps.some(a => a.name === name));
          return [...cleaned, ...otherApps];
        });
      }
    } else if (tempApps.includes(appName)) {
      setTempApps(prev => prev.filter(name => name !== appName));
    } else {
      if (tempApps.length >= 50) {
        Alert.alert('Limit Reached', 'You can select a maximum of 50 individual apps.');
        return;
      }
      setTempApps(prev => [...prev, appName]);

      // Check if all apps in the category are now selected - auto-promote to category
      const category = availableCategories.find(c => c.id === categoryId);
      if (category) {
        const updatedApps = [...tempApps, appName];
        const allCatAppsSelected = category.apps.every(a => updatedApps.includes(a.name));
        if (allCatAppsSelected) {
          setTempCategories(prev => [...prev, categoryId]);
          const catAppNames = category.apps.map(a => a.name);
          setTempApps(prev => prev.filter(name => !catAppNames.includes(name)));
        }
      }
    }
  };

  const isAppSelected = (appName: string, categoryId: string) => {
    return tempCategories.includes(categoryId) || tempApps.includes(appName);
  };

  // Count individual apps selected per category (only when category is not fully selected)
  const getIndividualCountForCategory = (category: AppCategory) => {
    if (tempCategories.includes(category.id)) return 0;
    return category.apps.filter(a => tempApps.includes(a.name)).length;
  };

  // Count actual apps: expand each selected category to its app count
  const totalSelections = tempApps.length + tempCategories.reduce((sum, catId) => {
    const cat = availableCategories.find(c => c.id === catId);
    return sum + (cat ? cat.apps.length : 0);
  }, 0);

  // Filter categories by search
  const filteredCategories = searchQuery.trim()
    ? availableCategories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.apps.some(app => app.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : availableCategories;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF2' }}>
        {/* Header instruction */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 14, color: '#2D5A3D', textAlign: 'center' }}>
            {isDeviceFiltered
              ? 'Apps on your device - tap ">" to show more'
              : 'Select Apps, tap on ">" to show more'}
          </Text>
        </View>

        {/* Category List */}
        <View style={{ flexShrink: 1, marginHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E8E8E8', overflow: 'hidden', backgroundColor: 'white' }}>
          <ScrollView>
            {/* All Apps & Categories */}
            <TouchableOpacity
              onPress={toggleSelectAll}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#F0EDE5',
              }}
            >
              <View style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                borderWidth: 2,
                borderColor: allSelected ? '#2D5A3D' : '#CCC',
                backgroundColor: allSelected ? '#2D5A3D' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                {allSelected && (
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17L4 12" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </View>
              <View style={{ marginRight: 10, width: 22, alignItems: 'center' }}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="3" width="8" height="8" rx="2" fill="#2D5A3D" />
                  <Rect x="13" y="3" width="8" height="8" rx="2" fill="#2D5A3D" />
                  <Rect x="3" y="13" width="8" height="8" rx="2" fill="#2D5A3D" />
                  <Rect x="13" y="13" width="8" height="8" rx="2" fill="#2D5A3D" />
                </Svg>
              </View>
              <Text style={{ flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500' }}>All Apps & Categories</Text>
            </TouchableOpacity>

            {/* Category rows */}
            {filteredCategories.map(category => {
              const isCategorySelected = tempCategories.includes(category.id);
              const isExpanded = expandedCategory === category.id;
              const individualCount = getIndividualCountForCategory(category);

              return (
                <View key={category.id}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F0EDE5',
                  }}>
                    {/* Checkbox */}
                    <TouchableOpacity
                      onPress={() => toggleCategory(category.id)}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: isCategorySelected ? '#2D5A3D' : '#CCC',
                        backgroundColor: isCategorySelected ? '#2D5A3D' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      {isCategorySelected && (
                        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                          <Path d="M20 6L9 17L4 12" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      )}
                    </TouchableOpacity>

                    {/* Icon + Name */}
                    <View style={{ marginRight: 10, width: 22, alignItems: 'center' }}>
                      <CategoryIcon categoryId={category.id} size={20} />
                    </View>
                    <Text style={{ flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500' }}>
                      {category.name}
                    </Text>

                    {/* Individual selection count */}
                    {individualCount > 0 && !isCategorySelected && (
                      <Text style={{ fontSize: 13, color: '#2D5A3D', fontWeight: '600', marginRight: 8 }}>{individualCount}</Text>
                    )}

                    {/* Expand button */}
                    <TouchableOpacity
                      onPress={() => setExpandedCategory(isExpanded ? null : category.id)}
                      style={{ padding: 4 }}
                    >
                      {isExpanded ? <ChevronDown /> : <ChevronRight />}
                    </TouchableOpacity>
                  </View>

                  {/* Expanded apps list */}
                  {isExpanded && (
                    <View style={{ backgroundColor: '#FFFFFF', paddingLeft: 36 }}>
                      {category.apps
                        .filter(app => !searchQuery.trim() || app.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(app => {
                          const appSelected = isAppSelected(app.name, category.id);
                          return (
                            <TouchableOpacity
                              key={app.name}
                              onPress={() => toggleApp(app.name, category.id)}
                              activeOpacity={0.7}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                paddingLeft: 16,
                                paddingRight: 16,
                                borderBottomWidth: 1,
                                borderBottomColor: '#F0EDE5',
                              }}
                            >
                              <View style={{
                                width: 20,
                                height: 20,
                                borderRadius: 10,
                                borderWidth: 2,
                                borderColor: appSelected ? '#2D5A3D' : '#CCC',
                                backgroundColor: appSelected ? '#2D5A3D' : 'transparent',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 10,
                              }}>
                                {appSelected && (
                                  <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                                    <Path d="M20 6L9 17L4 12" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                                  </Svg>
                                )}
                              </View>
                              <View style={{ marginRight: 8, width: 22, alignItems: 'center' }}>
                                <AppBrandIcon appName={app.name} size={20} />
                              </View>
                              <Text style={{ fontSize: 14, color: '#1A1A1A' }}>{app.name}</Text>
                            </TouchableOpacity>
                          );
                        })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Bottom section */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          {/* Search bar */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F0EDE5',
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 12,
          }}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
              <Circle cx="11" cy="11" r="7" stroke="#999" strokeWidth={2} />
              <Path d="M16 16L20 20" stroke="#999" strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <TextInput
              placeholder="Search"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, fontSize: 15, color: '#1A1A1A', padding: 0 }}
            />
          </View>

          {/* Selection counter */}
          <Text style={{ textAlign: 'center', fontSize: 14, color: '#2D5A3D', fontWeight: '600', marginBottom: 16 }}>
            {totalSelections} {totalSelections === 1 ? 'App' : 'Apps'} Selected
          </Text>

          {/* Save button */}
          <TouchableOpacity
            onPress={() => onSave(tempCategories, tempApps)}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#2D5A3D',
              borderRadius: 25,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>Save</Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
            <Text style={{ textAlign: 'center', fontSize: 15, color: '#666' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ============ MAIN CREATE SCREEN ============

export default function CreateGoalScreen() {
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { addGoal, updateGoalData } = useApp();
  const goals = useGoals();
  const user = useUser();
  const { categories: deviceCategories, isDeviceFiltered } = useDeviceApps();

  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<GoalType>('overall_screen_time');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [limit, setLimit] = useState(90); // minutes or opens count

  // App picker modal
  const [showAppPicker, setShowAppPicker] = useState(false);

  const isEditing = !!edit;
  const needsAppSelection = type !== 'overall_screen_time';
  const isOpensType = type === 'app_opens_limit';

  // Time display
  const hours = Math.floor(limit / 60);
  const mins = limit % 60;

  // XP preview (use device-filtered categories for accurate app counts)
  const pureBaseXp = getBaseXpForGoal(type, limit);
  const appMult = getAppCountMultiplier(selectedApps, selectedCategories, deviceCategories);
  const totalTrackedApps = getTotalTrackedApps(selectedApps, selectedCategories, deviceCategories);
  const goalXp = calculateXpReward(type, limit, selectedApps, selectedCategories, deviceCategories);
  const currentStreak = user?.currentStreak ?? 0;
  const nextStreak = currentStreak + 1;
  const streakMult = getStreakMultiplier(nextStreak);
  const finalXp = calculateFinalXp(goalXp, nextStreak);

  const dismissOrGoBack = () => {
    if (Platform.OS === 'web') {
      router.replace('/(tabs)');
      return;
    }
    const anyRouter = router as any;
    if (typeof anyRouter.dismiss === 'function') {
      anyRouter.dismiss();
      return;
    }
    router.back();
  };

  // Load goal data if editing
  useEffect(() => {
    if (edit && goals.length > 0) {
      const goalToEdit = goals.find(g => g.id === edit);
      if (goalToEdit) {
        setName(goalToEdit.name);
        setType(goalToEdit.type);
        setSelectedApps(goalToEdit.targetApps || []);
        setSelectedCategories(goalToEdit.targetCategories || []);
        setLimit(goalToEdit.limit);
      }
    }
  }, [edit, goals]);

  // Set default limit when type changes
  useEffect(() => {
    if (!isEditing) {
      if (type === 'app_opens_limit') {
        setLimit(10);
      } else {
        setLimit(90);
      }
    }
  }, [type]);

  const adjustTime = (delta: number) => {
    const newLimit = limit + delta;
    if (newLimit >= 30 && newLimit <= 720) {
      setLimit(newLimit);
    }
  };

  const adjustOpens = (delta: number) => {
    const newLimit = limit + delta;
    if (newLimit >= 1 && newLimit <= 200) {
      setLimit(newLimit);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please give your goal a name');
      return;
    }

    if (needsAppSelection && selectedApps.length === 0 && selectedCategories.length === 0) {
      Alert.alert('Select Apps', 'Please select at least one app or category to track');
      return;
    }

    setIsLoading(true);
    try {
      const newTargetApps = type === 'overall_screen_time' ? [] : selectedApps;
      const newTargetCategories = type === 'overall_screen_time' ? [] : selectedCategories;

      // Compute XP here using device-filtered categories for accurate app counts
      const xpReward = calculateXpReward(type, limit, newTargetApps, newTargetCategories, deviceCategories);

      const goalData: Record<string, any> = {
        name: name.trim(),
        icon: '',
        type,
        targetApps: newTargetApps,
        targetCategories: newTargetCategories,
        limit,
        xpReward,
      };

      // When editing, clean up appProgress & currentProgress for removed apps/categories
      if (isEditing && edit) {
        const existingGoal = goals.find(g => g.id === edit);
        if (existingGoal?.appProgress) {
          // Build a set of all app names that are still tracked
          const stillTrackedApps = new Set<string>(newTargetApps);
          for (const catId of newTargetCategories) {
            const cat = APP_CATEGORIES.find(c => c.id === catId);
            if (cat) {
              cat.apps.forEach(app => stillTrackedApps.add(app.name));
            }
          }

          // Calculate progress to subtract for removed apps
          let removedProgress = 0;
          const cleanedAppProgress: Record<string, number> = {};

          for (const [appName, value] of Object.entries(existingGoal.appProgress)) {
            if (stillTrackedApps.has(appName)) {
              cleanedAppProgress[appName] = value;
            } else {
              removedProgress += value;
            }
          }

          goalData.appProgress = cleanedAppProgress;
          goalData.currentProgress = Math.max(0, (existingGoal.currentProgress || 0) - removedProgress);
        }

        await updateGoalData(edit, goalData);
      } else {
        await addGoal(goalData);
      }

      dismissOrGoBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const hasAppSelection = selectedApps.length > 0 || selectedCategories.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF2' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
        <TouchableOpacity onPress={dismissOrGoBack} activeOpacity={0.7}>
          <Text style={{ fontSize: 16, color: '#2D5A3D' }}>Cancel</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>
          {isEditing ? 'Edit Goal' : 'New Goal'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading} activeOpacity={0.7}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#2D5A3D" />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#2D5A3D' }}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Goal Name */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 }}>Goal Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Social Media Detox"
              placeholderTextColor="#B0B0B0"
              autoCapitalize="words"
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E0E0E0',
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: '#1A1A1A',
              }}
            />
          </View>

          {/* Goal Type */}
          <View style={{ marginTop: 28 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 }}>Goal Type</Text>

            {GOAL_TYPES.map(goalType => {
              const isSelected = type === goalType.type;
              return (
                <TouchableOpacity
                  key={goalType.type}
                  onPress={() => {
                    setType(goalType.type);
                    if (goalType.type === 'overall_screen_time') {
                      setSelectedApps([]);
                      setSelectedCategories([]);
                    }
                  }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    borderRadius: 12,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? '#2D5A3D' : '#E0E0E0',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ marginRight: 14 }}>
                    {goalType.type === 'overall_screen_time' && <ScreenTimeTypeIcon selected={isSelected} />}
                    {goalType.type === 'app_time_limit' && <AppTimeTypeIcon selected={isSelected} />}
                    {goalType.type === 'app_opens_limit' && <AppOpensTypeIcon selected={isSelected} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: isSelected ? '#2D5A3D' : '#1A1A1A' }}>
                      {goalType.label}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                      {goalType.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Apps Section */}
          {needsAppSelection && (
            <View style={{ marginTop: 28 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 }}>Selected Apps</Text>

              {!hasAppSelection ? (
                /* Select Apps Button */
                <TouchableOpacity
                  onPress={() => setShowAppPicker(true)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'white',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                  }}
                >
                  <Text style={{ fontSize: 15, color: '#888' }}>Select Apps</Text>
                  <ChevronRight />
                </TouchableOpacity>
              ) : (
                <View>
                  {/* Categories section */}
                  {selectedCategories.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <GridIcon />
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginLeft: 8 }}>Category</Text>
                          <Text style={{ fontSize: 13, color: '#888', marginLeft: 6 }}>{selectedCategories.length}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowAppPicker(true)} activeOpacity={0.7}>
                          <Text style={{ fontSize: 13, color: '#2D5A3D', fontWeight: '500' }}>Add / Remove</Text>
                        </TouchableOpacity>
                      </View>
                      {selectedCategories.map(catId => {
                        const cat = APP_CATEGORIES.find(c => c.id === catId);
                        if (!cat) return null;
                        return (
                          <View
                            key={catId}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: 'white',
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: '#E8E8E8',
                              paddingHorizontal: 14,
                              paddingVertical: 12,
                              marginBottom: 6,
                            }}
                          >
                            <View style={{ marginRight: 10, width: 22, alignItems: 'center' }}>
                              <CategoryIcon categoryId={cat.id} size={20} />
                            </View>
                            <Text style={{ fontSize: 14, color: '#1A1A1A', fontWeight: '500' }}>{cat.name}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Individual Apps section */}
                  {selectedApps.length > 0 && (
                    <View style={{ marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <AppIcon />
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginLeft: 8 }}>App</Text>
                          <Text style={{ fontSize: 13, color: '#2D5A3D', fontWeight: '500', marginLeft: 6 }}>{selectedApps.length}/50 Apps</Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowAppPicker(true)} activeOpacity={0.7}>
                          <Text style={{ fontSize: 13, color: '#2D5A3D', fontWeight: '500' }}>Add / Remove</Text>
                        </TouchableOpacity>
                      </View>
                      {selectedApps.map(appName => {
                        const allApps = APP_CATEGORIES.flatMap(c => c.apps);
                        const appInfo = allApps.find(a => a.name === appName);
                        return (
                          <View
                            key={appName}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: 'white',
                              borderRadius: 10,
                              borderWidth: 1,
                              borderColor: '#E8E8E8',
                              paddingHorizontal: 14,
                              paddingVertical: 12,
                              marginBottom: 6,
                            }}
                          >
                            <View style={{ marginRight: 10, width: 22, alignItems: 'center' }}>
                              <AppBrandIcon appName={appName} size={20} />
                            </View>
                            <Text style={{ fontSize: 14, color: '#1A1A1A', fontWeight: '500' }}>{appName}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Add more link when both sections empty but hasAppSelection is somehow true */}
                  {selectedCategories.length === 0 && selectedApps.length === 0 && (
                    <TouchableOpacity
                      onPress={() => setShowAppPicker(true)}
                      activeOpacity={0.7}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'white',
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#E0E0E0',
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                      }}
                    >
                      <Text style={{ fontSize: 15, color: '#888' }}>Select Apps</Text>
                      <ChevronRight />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Time Goal / Opens Goal */}
          <View style={{ marginTop: 28 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 }}>
              {isOpensType ? 'Opens Goal' : 'Time Goal'}
            </Text>

            {isOpensType ? (
              /* Opens Goal Picker */
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  {/* Minus button */}
                  <TouchableOpacity
                    onPress={() => adjustOpens(-1)}
                    activeOpacity={0.7}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: '#1A1A1A',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 22, fontWeight: '600', color: '#1A1A1A', lineHeight: 24 }}>-</Text>
                  </TouchableOpacity>

                  {/* Opens display */}
                  <View style={{
                    marginHorizontal: 20,
                    borderWidth: 1.5,
                    borderColor: '#2D5A3D',
                    borderRadius: 10,
                    paddingHorizontal: 28,
                    paddingVertical: 10,
                    alignItems: 'center',
                    minWidth: 80,
                  }}>
                    <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A1A' }}>{limit}</Text>
                    <Text style={{ fontSize: 11, color: '#888', marginTop: 2 }}>opens</Text>
                  </View>

                  {/* Plus button */}
                  <TouchableOpacity
                    onPress={() => adjustOpens(1)}
                    activeOpacity={0.7}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: '#1A1A1A',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 22, fontWeight: '600', color: '#1A1A1A', lineHeight: 24 }}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Presets */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                  {[3, 5, 10, 20].map(preset => (
                    <TouchableOpacity
                      key={preset}
                      onPress={() => setLimit(preset)}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 18,
                        paddingVertical: 10,
                        borderRadius: 20,
                        borderWidth: 1.5,
                        borderColor: limit === preset ? '#2D5A3D' : '#1A1A1A',
                        backgroundColor: limit === preset ? '#E8F5E9' : 'transparent',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: limit === preset ? '#2D5A3D' : '#1A1A1A' }}>
                        {preset}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              /* Time Goal Picker */
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 20 }}>
                  {/* Minus button */}
                  <TouchableOpacity
                    onPress={() => adjustTime(-30)}
                    activeOpacity={0.7}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: '#1A1A1A',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    <Text style={{ fontSize: 22, fontWeight: '600', color: '#1A1A1A', lineHeight: 24 }}>-</Text>
                  </TouchableOpacity>

                  {/* Hours column */}
                  <View style={{ alignItems: 'center', marginLeft: 16 }}>
                    <View style={{
                      borderWidth: 1.5,
                      borderColor: '#2D5A3D',
                      borderRadius: 10,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      alignItems: 'center',
                      minWidth: 56,
                    }}>
                      <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A1A' }}>{hours}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#8B9D77', marginTop: 4 }}>hours</Text>
                  </View>

                  {/* Colon separator */}
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginHorizontal: 8, marginTop: 10 }}>:</Text>

                  {/* Minutes column */}
                  <View style={{ alignItems: 'center' }}>
                    <View style={{
                      borderWidth: 1.5,
                      borderColor: '#2D5A3D',
                      borderRadius: 10,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      alignItems: 'center',
                      minWidth: 56,
                    }}>
                      <Text style={{ fontSize: 24, fontWeight: '700', color: '#1A1A1A' }}>{mins.toString().padStart(2, '0')}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#8B9D77', marginTop: 4 }}>mins</Text>
                  </View>

                  {/* Plus button */}
                  <TouchableOpacity
                    onPress={() => adjustTime(30)}
                    activeOpacity={0.7}
                    style={{
                      marginLeft: 16,
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: '#1A1A1A',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 2,
                    }}
                  >
                    <Text style={{ fontSize: 22, fontWeight: '600', color: '#1A1A1A', lineHeight: 24 }}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Presets */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                  {[
                    { label: '30m', value: 30 },
                    { label: '1h', value: 60 },
                    { label: '2h', value: 120 },
                    { label: '3h', value: 180 },
                  ].map(preset => (
                    <TouchableOpacity
                      key={preset.value}
                      onPress={() => setLimit(preset.value)}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 18,
                        paddingVertical: 10,
                        borderRadius: 20,
                        borderWidth: 1.5,
                        borderColor: limit === preset.value ? '#2D5A3D' : '#1A1A1A',
                        backgroundColor: limit === preset.value ? '#E8F5E9' : 'transparent',
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: limit === preset.value ? '#2D5A3D' : '#1A1A1A' }}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* XP Reward Preview */}
          <View style={{
            marginTop: 28,
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: '#E8F5E9',
          }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 16 }}>
              XP Reward
            </Text>

            {/* Base XP */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#8B9D77' }}>Base XP</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A' }}>{pureBaseXp} XP</Text>
            </View>

            {/* App count multiplier */}
            {appMult > 1 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View>
                  <Text style={{ fontSize: 14, color: '#8B9D77' }}>App Bonus</Text>
                  <Text style={{ fontSize: 12, color: '#B0BCA4', marginTop: 2 }}>
                    {totalTrackedApps} {totalTrackedApps === 1 ? 'app' : 'apps'} tracked
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D5A3D' }}>
                  x{appMult.toFixed(2)}
                </Text>
              </View>
            )}

            {/* Completion bonus */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, color: '#8B9D77' }}>Completion Bonus</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A' }}>+5 XP</Text>
            </View>

            {/* Streak multiplier */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 14, color: '#8B9D77' }}>Streak Multiplier</Text>
                <Text style={{ fontSize: 12, color: '#B0BCA4', marginTop: 2 }}>
                  {currentStreak > 0 ? `${currentStreak} day streak` : 'No streak yet'}
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: streakMult > 1 ? '#2D5A3D' : '#1A1A1A' }}>
                x{streakMult}
              </Text>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: '#F0EDE5', marginBottom: 12 }} />

            {/* Total */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>Total</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#F4A261' }}>+{finalXp} XP</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* App Picker Modal */}
      <AppPickerModal
        visible={showAppPicker}
        availableCategories={deviceCategories}
        isDeviceFiltered={isDeviceFiltered}
        initialCategories={selectedCategories}
        initialApps={selectedApps}
        onSave={(categories, apps) => {
          setSelectedCategories(categories);
          setSelectedApps(apps);
          setShowAppPicker(false);
        }}
        onCancel={() => setShowAppPicker(false)}
      />
    </SafeAreaView>
  );
}
