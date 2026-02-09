import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle, Rect, G, Text as SvgText } from 'react-native-svg';
import { useApp, useGoals } from '@/context/AppContext';
import { createGoal, updateGoal } from '@/lib/firebase';
import { calculateXpReward } from '@/lib/xp';
import { GoalType, COMMON_APPS, Goal } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ ICONS ============

function CloseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke="#64748B"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ArrowLeftIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke="#64748B"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ArrowRightIcon({ color = "#FFFFFF" }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19M19 12L12 5M19 12L12 19"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon({ color = "#FFFFFF", size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SparkleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
        fill="#F59E0B"
        stroke="#F59E0B"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Goal Type Illustrations
function ScreenTimeIcon({ selected }: { selected: boolean }) {
  const color = selected ? '#059669' : '#94A3B8';
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
      <Rect x="8" y="6" width="32" height="28" rx="4" stroke={color} strokeWidth={2.5} fill={selected ? '#ECFDF5' : '#F8FAFC'} />
      <Rect x="18" y="34" width="12" height="8" stroke={color} strokeWidth={2.5} fill={selected ? '#ECFDF5' : '#F8FAFC'} />
      <Rect x="14" y="42" width="20" height="2" rx="1" fill={color} />
      <Circle cx="24" cy="20" r="8" stroke={color} strokeWidth={2.5} fill="none" />
      <Path d="M24 14V20L28 22" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function AppTimeIcon({ selected }: { selected: boolean }) {
  const color = selected ? '#059669' : '#94A3B8';
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
      <Rect x="12" y="4" width="24" height="40" rx="4" stroke={color} strokeWidth={2.5} fill={selected ? '#ECFDF5' : '#F8FAFC'} />
      <Rect x="20" y="38" width="8" height="2" rx="1" fill={color} />
      <Circle cx="24" cy="22" r="8" stroke={color} strokeWidth={2.5} fill="none" />
      <Path d="M24 16V22L27 24" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx="32" cy="12" r="6" fill="#F59E0B" />
      <Path d="M30 12H34M32 10V14" stroke="#FFFFFF" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function AppOpensIcon({ selected }: { selected: boolean }) {
  const color = selected ? '#059669' : '#94A3B8';
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
      <Rect x="12" y="4" width="24" height="40" rx="4" stroke={color} strokeWidth={2.5} fill={selected ? '#ECFDF5' : '#F8FAFC'} />
      <Rect x="20" y="38" width="8" height="2" rx="1" fill={color} />
      <Path d="M18 18L24 12L30 18" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M24 12V28" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx="32" cy="12" r="6" fill="#EF4444" />
      <SvgText x="32" y="16" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">5</SvgText>
    </Svg>
  );
}

// ============ TYPES ============

const GOAL_TYPES: { type: GoalType; label: string; description: string; icon: (selected: boolean) => JSX.Element }[] = [
  {
    type: 'overall_screen_time',
    label: 'Total Screen Time',
    description: 'Set a daily limit for all device usage',
    icon: (selected) => <ScreenTimeIcon selected={selected} />,
  },
  {
    type: 'app_time_limit',
    label: 'App Time Limit',
    description: 'Limit time spent on specific apps',
    icon: (selected) => <AppTimeIcon selected={selected} />,
  },
  {
    type: 'app_opens_limit',
    label: 'App Opens Limit',
    description: 'Control how many times you open apps',
    icon: (selected) => <AppOpensIcon selected={selected} />,
  },
];

const EMOJI_OPTIONS = ['🎯', '📱', '⏰', '🔒', '🧘', '💪', '🌟', '🏆', '🔥', '💡', '🎮', '📺', '🌙', '☀️', '🍃', '🎨'];

const TIME_OPTIONS = [
  { label: '15m', value: 15, subtext: 'Strict' },
  { label: '30m', value: 30, subtext: 'Focused' },
  { label: '1h', value: 60, subtext: 'Balanced' },
  { label: '1.5h', value: 90, subtext: '' },
  { label: '2h', value: 120, subtext: 'Relaxed' },
  { label: '3h', value: 180, subtext: '' },
];

const OPENS_OPTIONS = [
  { label: '3', value: 3, subtext: 'Strict' },
  { label: '5', value: 5, subtext: 'Focused' },
  { label: '10', value: 10, subtext: 'Balanced' },
  { label: '20', value: 20, subtext: '' },
  { label: '30', value: 30, subtext: 'Relaxed' },
];

// ============ STEP INDICATOR ============

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View className="flex-row items-center justify-center py-3 gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          // NOTE: Avoid NativeWind `transition-*` utilities on web here.
          // They can rely on Reanimated internals (e.g. `makeMutable`) and crash depending on versions.
          className={`h-1.5 rounded-full ${
            index < currentStep
              ? 'w-8 bg-emerald-500'
              : index === currentStep
              ? 'w-8 bg-emerald-400'
              : 'w-3 bg-slate-200'
          }`}
        />
      ))}
    </View>
  );
}

// ============ MAIN COMPONENT ============

export default function CreateGoalScreen() {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:mount',message:'CreateGoalScreen component mounting',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  const router = useRouter();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { firebaseUser } = useApp();
  const goals = useGoals();
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form state
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [type, setType] = useState<GoalType>('overall_screen_time');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [limit, setLimit] = useState(60);

  // Animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isEditing = !!edit;
  const needsAppSelection = type !== 'overall_screen_time';
  const totalSteps = needsAppSelection ? 4 : 3;
  
  // Determine steps based on goal type
  const getStepContent = () => {
    if (needsAppSelection) {
      return ['type', 'apps', 'limit', 'details'];
    }
    return ['type', 'limit', 'details'];
  };
  const steps = getStepContent();

  const dismissOrGoBack = () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:dismissOrGoBack',message:'Attempting to close modal/screen',data:{hasDismiss:typeof (router as any).dismiss === 'function',hasBack:typeof (router as any).back === 'function',historyLength:typeof window !== 'undefined' ? window.history.length : null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'BACK'})}).catch(()=>{});
    // #endregion

    // On web we frequently have no stack history for modals, which triggers:
    // "The action 'POP' ... was not handled by any navigator."
    // So we avoid POP entirely and just navigate back to the tabs root.
    if (Platform.OS === 'web') {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:dismissOrGoBack:webReplace',message:'Web close: router.replace(/(tabs))',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'BACK'})}).catch(()=>{});
      // #endregion
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

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:useEffectMount',message:'CreateGoalScreen useEffect - component fully mounted',data:{firebaseUser:!!firebaseUser,goalsCount:goals.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D-E'})}).catch(()=>{});
  }, []);
  // #endregion

  // Load goal data if editing
  useEffect(() => {
    if (edit && goals.length > 0) {
      const goalToEdit = goals.find(g => g.id === edit);
      if (goalToEdit) {
        setName(goalToEdit.name);
        setIcon(goalToEdit.icon);
        setType(goalToEdit.type);
        setSelectedApps(goalToEdit.targetApps);
        setLimit(goalToEdit.limit);
      }
    }
  }, [edit, goals]);

  const xpReward = calculateXpReward(type, limit);

  const animateTransition = (direction: 'next' | 'back') => {
    const toValue = direction === 'next' ? -1 : 1;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: toValue * 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(direction === 'next' ? 50 : -50);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const goToNextStep = () => {
    // Validate current step
    if (steps[currentStep] === 'apps' && selectedApps.length === 0) {
      Alert.alert('Select Apps', 'Please select at least one app to track');
      return;
    }
    
    if (currentStep < totalSteps - 1) {
      animateTransition('next');
      setTimeout(() => setCurrentStep(currentStep + 1), 150);
    }
  };

  const goToPrevStep = () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:goToPrevStep',message:'goToPrevStep called',data:{currentStep},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'BACK'})}).catch(()=>{});
    // #endregion
    if (currentStep > 0) {
      animateTransition('back');
      setTimeout(() => setCurrentStep(currentStep - 1), 150);
    }
  };

  const toggleApp = (appName: string) => {
    setSelectedApps(prev =>
      prev.includes(appName)
        ? prev.filter(a => a !== appName)
        : [...prev, appName]
    );
  };

  const handleSave = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:handleSave',message:'handleSave called',data:{name,firebaseUserExists:!!firebaseUser,isEditing},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'SAVE'})}).catch(()=>{});
    // #endregion
    
    if (!name.trim()) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:handleSave:noName',message:'No name provided',data:{name},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'SAVE'})}).catch(()=>{});
      // #endregion
      Alert.alert('Missing Name', 'Please give your goal a name');
      return;
    }

    if (!firebaseUser) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:handleSave:noUser',message:'No firebase user',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'SAVE'})}).catch(()=>{});
      // #endregion
      return;
    }

    setIsLoading(true);
    try {
      const goalData = {
        name: name.trim(),
        icon,
        type,
        targetApps: type === 'overall_screen_time' ? [] : selectedApps,
        limit,
      };

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:handleSave:beforeCreate',message:'About to create goal',data:{goalData,userId:firebaseUser.uid},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'SAVE'})}).catch(()=>{});
      // #endregion

      if (isEditing && edit) {
        await updateGoal(firebaseUser.uid, edit, goalData);
      } else {
        await createGoal(firebaseUser.uid, goalData);
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:handleSave:success',message:'Goal saved successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'SAVE'})}).catch(()=>{});
      // #endregion
      
      dismissOrGoBack();
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:handleSave:error',message:'Error saving goal',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'SAVE'})}).catch(()=>{});
      // #endregion
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate name suggestion based on selection
  const getNameSuggestion = () => {
    if (type === 'overall_screen_time') {
      return 'Daily Screen Time';
    }
    if (selectedApps.length === 1) {
      return `Limit ${selectedApps[0]}`;
    }
    if (selectedApps.length > 1) {
      return type === 'app_time_limit' ? 'App Time Limit' : 'App Opens Limit';
    }
    return '';
  };

  useEffect(() => {
    if (!isEditing && !name) {
      const suggestion = getNameSuggestion();
      if (suggestion) setName(suggestion);
    }
  }, [type, selectedApps]);

  // ============ RENDER STEPS ============

  const renderTypeSelection = () => (
    <View className="flex-1 px-5">
      <Text className="text-2xl font-bold text-slate-800 mb-2">
        What would you like to limit?
      </Text>
      <Text className="text-base text-slate-500 mb-6">
        Choose the type of goal that fits your needs
      </Text>
      
      <View className="gap-3">
        {GOAL_TYPES.map((goalType) => (
          <TouchableOpacity
            key={goalType.type}
            onPress={() => {
              setType(goalType.type);
              // Reset limit to appropriate default
              if (goalType.type === 'app_opens_limit') {
                setLimit(10);
              } else {
                setLimit(60);
              }
              // Clear app selection when changing type
              if (goalType.type === 'overall_screen_time') {
                setSelectedApps([]);
              }
            }}
            activeOpacity={0.7}
            className={`flex-row items-center p-4 rounded-2xl border-2 ${
              type === goalType.type
                ? 'bg-emerald-50 border-emerald-500'
                : 'bg-white border-slate-200'
            }`}
          >
            <View className="mr-4">
              {goalType.icon(type === goalType.type)}
            </View>
            <View className="flex-1">
              <Text className={`text-lg font-semibold ${
                type === goalType.type ? 'text-emerald-700' : 'text-slate-700'
              }`}>
                {goalType.label}
              </Text>
              <Text className={`text-sm mt-0.5 ${
                type === goalType.type ? 'text-emerald-600' : 'text-slate-500'
              }`}>
                {goalType.description}
              </Text>
            </View>
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              type === goalType.type
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-slate-300'
            }`}>
              {type === goalType.type && <CheckIcon size={14} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderAppSelection = () => (
    <View className="flex-1 px-5">
      <Text className="text-2xl font-bold text-slate-800 mb-2">
        Which apps to track?
      </Text>
      <Text className="text-base text-slate-500 mb-1">
        Select the apps you want to limit
      </Text>
      {selectedApps.length > 0 && (
        <Text className="text-sm text-emerald-600 font-medium mb-4">
          {selectedApps.length} app{selectedApps.length !== 1 ? 's' : ''} selected
        </Text>
      )}
      {selectedApps.length === 0 && (
        <Text className="text-sm text-slate-400 mb-4">
          Tap to select apps
        </Text>
      )}
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="flex-row flex-wrap gap-2">
          {COMMON_APPS.map((app) => {
            const isSelected = selectedApps.includes(app.name);
            return (
              <TouchableOpacity
                key={app.name}
                onPress={() => toggleApp(app.name)}
                activeOpacity={0.7}
                className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-400'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text className="text-lg mr-2">{app.icon}</Text>
                <Text className={`text-sm font-medium ${
                  isSelected ? 'text-emerald-700' : 'text-slate-700'
                }`}>
                  {app.name}
                </Text>
                {isSelected && (
                  <View className="ml-2 w-5 h-5 rounded-full bg-emerald-500 items-center justify-center">
                    <CheckIcon size={12} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  const renderLimitSelection = () => {
    const isOpensLimit = type === 'app_opens_limit';
    const options = isOpensLimit ? OPENS_OPTIONS : TIME_OPTIONS;
    
    return (
      <View className="flex-1 px-5">
        <Text className="text-2xl font-bold text-slate-800 mb-2">
          Set your daily limit
        </Text>
        <Text className="text-base text-slate-500 mb-6">
          {isOpensLimit 
            ? 'How many times can you open the app(s)?'
            : 'How much time do you want to allow?'
          }
        </Text>
        
        {/* Main limit display */}
        <View className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 mb-6 items-center border border-emerald-100">
          <Text className="text-6xl font-bold text-emerald-600">
            {isOpensLimit ? limit : (limit >= 60 ? `${Math.floor(limit / 60)}h${limit % 60 > 0 ? ` ${limit % 60}m` : ''}` : `${limit}m`)}
          </Text>
          <Text className="text-base text-slate-500 mt-2">
            {isOpensLimit ? 'opens per day' : 'per day'}
          </Text>
        </View>
        
        {/* Options grid */}
        <View className="flex-row flex-wrap justify-center gap-3">
          {options.map((option) => {
            const isSelected = limit === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setLimit(option.value)}
                activeOpacity={0.7}
                className={`w-20 h-20 rounded-2xl items-center justify-center border-2 ${
                  isSelected
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'bg-white border-slate-200'
                }`}
              >
                <Text className={`text-xl font-bold ${
                  isSelected ? 'text-white' : 'text-slate-700'
                }`}>
                  {option.label}
                </Text>
                {option.subtext && (
                  <Text className={`text-xs mt-0.5 ${
                    isSelected ? 'text-emerald-100' : 'text-slate-400'
                  }`}>
                    {option.subtext}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* XP Preview */}
        <View className="mt-6 bg-amber-50 rounded-2xl p-4 flex-row items-center justify-between border border-amber-200">
          <View className="flex-row items-center">
            <SparkleIcon />
            <Text className="text-amber-700 font-medium ml-2">Reward for completing</Text>
          </View>
          <Text className="text-xl font-bold text-amber-600">+{xpReward} XP</Text>
        </View>
      </View>
    );
  };

  const renderDetails = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView 
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-2xl font-bold text-slate-800 mb-2">
          Personalize your goal
        </Text>
        <Text className="text-base text-slate-500 mb-6">
          Give it a name and choose an icon
        </Text>
        
        {/* Icon Selection */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">
            Choose an Icon
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => setIcon(emoji)}
                  activeOpacity={0.7}
                  className={`w-14 h-14 rounded-2xl items-center justify-center border-2 ${
                    icon === emoji
                      ? 'bg-emerald-50 border-emerald-400'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Text className="text-2xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Goal Name */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">
            Goal Name
          </Text>
          <View className="flex-row items-center bg-white rounded-2xl border-2 border-slate-200 px-4 py-1">
            <Text className="text-2xl mr-3">{icon}</Text>
            <TextInput
              className="flex-1 text-lg text-slate-800 py-3"
              placeholder="e.g., Limit Social Media"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Goal Preview Card */}
        <View className="bg-white rounded-2xl p-5 border-2 border-slate-200 mb-6">
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Preview
          </Text>
          
          <View className="flex-row items-center mb-4">
            <View className="w-14 h-14 rounded-2xl bg-slate-100 items-center justify-center mr-4">
              <Text className="text-3xl">{icon}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-slate-800" numberOfLines={1}>
                {name || 'Goal Name'}
              </Text>
              <Text className="text-sm text-slate-500">
                {GOAL_TYPES.find(t => t.type === type)?.label}
              </Text>
            </View>
          </View>
          
          <View className="h-px bg-slate-100 mb-4" />
          
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-slate-400 uppercase">Daily Limit</Text>
              <Text className="text-base font-semibold text-slate-700">
                {type === 'app_opens_limit' 
                  ? `${limit} opens`
                  : limit >= 60 
                    ? `${Math.floor(limit / 60)}h ${limit % 60}m`
                    : `${limit} min`
                }
              </Text>
            </View>
            {needsAppSelection && selectedApps.length > 0 && (
              <View>
                <Text className="text-xs text-slate-400 uppercase text-right">Apps</Text>
                <Text className="text-base font-semibold text-slate-700">
                  {selectedApps.length} selected
                </Text>
              </View>
            )}
            <View className="bg-amber-100 px-3 py-1.5 rounded-lg flex-row items-center">
              <SparkleIcon />
              <Text className="text-amber-700 font-bold ml-1">+{xpReward} XP</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderCurrentStep = () => {
    const step = steps[currentStep];
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:renderCurrentStep',message:'Rendering step',data:{currentStep,step,stepsArray:steps},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    switch (step) {
      case 'type':
        return renderTypeSelection();
      case 'apps':
        return renderAppSelection();
      case 'limit':
        return renderLimitSelection();
      case 'details':
        return renderDetails();
      default:
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:renderCurrentStep:default',message:'Hit default case - returning null!',data:{step},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        return null;
    }
  };

  const canProceed = () => {
    const step = steps[currentStep];
    switch (step) {
      case 'type':
        return true;
      case 'apps':
        return selectedApps.length > 0;
      case 'limit':
        return limit > 0;
      case 'details':
        return name.trim().length > 0;
      default:
        return true;
    }
  };

  const isLastStep = currentStep === totalSteps - 1;

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:beforeReturn',message:'About to render main JSX',data:{currentStep,totalSteps,isLastStep,canProceedValue:name.trim().length > 0 || currentStep < totalSteps - 1},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'G'})}).catch(()=>{});
  // #endregion

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity 
          onPress={() => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:backButton',message:'Back/Close button pressed',data:{currentStep},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'BACK'})}).catch(()=>{});
            // #endregion
            if (currentStep === 0) {
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/4753647c-c0b8-48ea-b089-08364daf0516',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'create.tsx:backButton:close',message:'Attempting to close (dismiss/back)',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'BACK'})}).catch(()=>{});
              // #endregion
              dismissOrGoBack();
            } else {
              goToPrevStep();
            }
          }} 
          className="w-10 h-10 items-center justify-center rounded-full bg-white border border-slate-200"
        >
          {currentStep === 0 ? <CloseIcon /> : <ArrowLeftIcon />}
        </TouchableOpacity>
        
        <View className="flex-1 mx-4">
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
        </View>
        
        <View className="w-10" />
      </View>

      {/* Content */}
      <Animated.View 
        className="flex-1"
        style={{
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }}
      >
        {renderCurrentStep()}
      </Animated.View>

      {/* Bottom Button */}
      <View className="px-5 pb-4 pt-2">
        <TouchableOpacity
          onPress={isLastStep ? handleSave : goToNextStep}
          disabled={isLoading || !canProceed()}
          activeOpacity={0.8}
          className={`flex-row items-center justify-center py-4 rounded-2xl ${
            canProceed()
              ? 'bg-emerald-500'
              : 'bg-slate-300'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white text-lg font-bold mr-2">
                {isLastStep ? (isEditing ? 'Save Changes' : 'Create Goal') : 'Continue'}
              </Text>
              {!isLastStep && <ArrowRightIcon />}
              {isLastStep && <CheckIcon />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
