import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AppContext';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

// Simple village icon SVG
function VillageIcon() {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      {/* Ground */}
      <Path d="M0 90 Q60 80 120 90 L120 120 L0 120 Z" fill="#8B9D77" />
      
      {/* House */}
      <Rect x="35" y="55" width="50" height="35" fill="#F4A261" />
      <Path d="M30 55 L60 25 L90 55 Z" fill="#9B2335" />
      
      {/* Door */}
      <Rect x="52" y="70" width="16" height="20" fill="#2D5A3D" />
      
      {/* Windows */}
      <Rect x="40" y="62" width="10" height="10" fill="#F5F5F0" />
      <Rect x="70" y="62" width="10" height="10" fill="#F5F5F0" />
      
      {/* Tree */}
      <Rect x="100" y="65" width="8" height="25" fill="#8B4513" />
      <Circle cx="104" cy="55" r="15" fill="#2D5A3D" />
      
      {/* Sun */}
      <Circle cx="20" cy="25" r="12" fill="#F4A261" />
    </Svg>
  );
}

export default function LoginScreen() {
  const { signIn, signUp, isLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp && !displayName) {
      setError('Please enter your name');
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      const message = err.code === 'auth/invalid-credential' 
        ? 'Invalid email or password'
        : err.code === 'auth/email-already-in-use'
        ? 'Email already in use'
        : err.code === 'auth/weak-password'
        ? 'Password should be at least 6 characters'
        : err.message || 'An error occurred';
      setError(message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F5F0]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 justify-center">
            {/* Logo/Illustration */}
            <View className="items-center mb-8">
              <VillageIcon />
              <Text className="text-3xl font-bold text-[#2D5A3D] mt-4">
                Brain Village
              </Text>
              <Text className="text-base text-[#8B9D77] mt-2 text-center">
                Build healthier digital habits,{'\n'}grow your village
              </Text>
            </View>

            {/* Form */}
            <View className="bg-white rounded-2xl p-6 shadow-sm">
              <Text className="text-xl font-bold text-[#1A1A1A] mb-6 text-center">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>

              {isSignUp && (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-[#1A1A1A] mb-2">
                    Name
                  </Text>
                  <TextInput
                    className="bg-[#F5F5F0] rounded-xl px-4 py-3 text-base text-[#1A1A1A]"
                    placeholder="Your name"
                    placeholderTextColor="#8B9D77"
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View className="mb-4">
                <Text className="text-sm font-medium text-[#1A1A1A] mb-2">
                  Email
                </Text>
                <TextInput
                  className="bg-[#F5F5F0] rounded-xl px-4 py-3 text-base text-[#1A1A1A]"
                  placeholder="your@email.com"
                  placeholderTextColor="#8B9D77"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-[#1A1A1A] mb-2">
                  Password
                </Text>
                <TextInput
                  className="bg-[#F5F5F0] rounded-xl px-4 py-3 text-base text-[#1A1A1A]"
                  placeholder="••••••••"
                  placeholderTextColor="#8B9D77"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>

              {error ? (
                <View className="bg-red-50 rounded-lg p-3 mb-4">
                  <Text className="text-red-600 text-sm text-center">{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                className="bg-[#2D5A3D] rounded-xl py-4 items-center"
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-4 py-2"
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
              >
                <Text className="text-[#8B9D77] text-center">
                  {isSignUp
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
