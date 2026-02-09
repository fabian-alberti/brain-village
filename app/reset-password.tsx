import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';

// Back Arrow Icon
function ArrowLeftIcon({ color }: { color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill={color}>
      <Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </Svg>
  );
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Import Firebase auth functions
      const { getAuth, updatePassword } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        await updatePassword(user, newPassword);
        Alert.alert('Success', 'Password updated successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'No user is currently signed in');
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Re-authentication Required', 
          'For security reasons, please sign out and sign back in before changing your password.'
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to update password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}>
            <TouchableOpacity 
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ padding: 4 }}
            >
              <ArrowLeftIcon color={colors.icon} />
            </TouchableOpacity>
            <Text style={{
              flex: 1,
              fontSize: 20,
              fontWeight: '600',
              color: colors.text,
              textAlign: 'center',
              marginRight: 36, // To center the title accounting for back button
            }}>
              Reset Password
            </Text>
          </View>

          {/* Form */}
          <View style={{ paddingHorizontal: 24, paddingTop: 40 }}>
            {/* New Password */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '400',
                color: colors.text,
                marginBottom: 8,
              }}>
                New Password
              </Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder=""
                secureTextEntry
                autoCapitalize="none"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 4,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: colors.text,
                }}
              />
            </View>

            {/* Confirm Password */}
            <View style={{ marginBottom: 40 }}>
              <Text style={{
                fontSize: 14,
                fontWeight: '400',
                color: colors.text,
                marginBottom: 8,
              }}>
                Confirm Password
              </Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder=""
                secureTextEntry
                autoCapitalize="none"
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 4,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: colors.text,
                }}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={isLoading || !newPassword || !confirmPassword}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 6,
                paddingVertical: 16,
                opacity: (isLoading || !newPassword || !confirmPassword) ? 0.5 : 1,
              }}
            >
              <Text style={{
                textAlign: 'center',
                fontSize: 16,
                fontWeight: '600',
                color: '#FFFFFF',
              }}>
                {isLoading ? 'Updating...' : 'Update Password'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
