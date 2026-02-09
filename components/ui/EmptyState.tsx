import { View, Text } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: 'goals' | 'village' | 'stats';
}

const ICON_CONFIG = {
  goals:   { name: 'target' as const,         color: '#2D5A3D' },
  village: { name: 'home-city-outline' as const, color: '#2D5A3D' },
  stats:   { name: 'chart-line' as const,     color: '#2D5A3D' },
};

export default function EmptyState({ title, message, icon = 'goals' }: EmptyStateProps) {
  const cfg = ICON_CONFIG[icon];

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 48 }}>
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
      }}>
        <MaterialCommunityIcons name={cfg.name} size={40} color={cfg.color} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 8 }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, color: '#8B9D77', textAlign: 'center', lineHeight: 20 }}>
        {message}
      </Text>
    </View>
  );
}
