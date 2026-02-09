import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

// Custom icon components
function GoalsIcon({ focused }: { focused: boolean }) {
  const color = focused ? '#2D5A3D' : '#8B9D77';
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={2} />
      <Circle cx="12" cy="12" r="2" fill={color} />
    </Svg>
  );
}

function VillageIcon({ focused }: { focused: boolean }) {
  const color = focused ? '#2D5A3D' : '#8B9D77';
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {/* House */}
      <Path 
        d="M3 10L12 3L21 10V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10Z" 
        stroke={color} 
        strokeWidth={2} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <Path 
        d="M9 21V12H15V21" 
        stroke={color} 
        strokeWidth={2} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ focused }: { focused: boolean }) {
  const color = focused ? '#2D5A3D' : '#8B9D77';
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={2} />
      <Path 
        d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" 
        stroke={color} 
        strokeWidth={2} 
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5E5',
          borderTopWidth: 1,
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: '#2D5A3D',
        tabBarInactiveTintColor: '#8B9D77',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Goals',
          tabBarIcon: ({ focused }) => <GoalsIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="village"
        options={{
          title: 'Village',
          tabBarIcon: ({ focused }) => <VillageIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }}
      />
    </Tabs>
  );
}
