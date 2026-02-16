import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '@/context/AppContext';

export default function VerifyEmailScreen() {
  const { resendVerificationEmail, refreshEmailVerified, signOut } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      const verified = await refreshEmailVerified();
      if (!verified) {
        Alert.alert(
          'Not Verified Yet',
          'Your email hasn\'t been verified yet. Please check your inbox and spam folder, then tap the verification link.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Could not check verification status. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown) return;
    setIsResending(true);
    try {
      await resendVerificationEmail();
      setResendCooldown(true);
      Alert.alert('Email Sent', 'A new verification email has been sent. Please check your inbox.');
      setTimeout(() => setResendCooldown(false), 60000);
    } catch (error: any) {
      if (error?.code === 'auth/too-many-requests') {
        Alert.alert('Too Many Requests', 'Please wait a moment before requesting another email.');
      } else {
        Alert.alert('Error', 'Could not send verification email. Please try again later.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF2' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        {/* Icon */}
        <View style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: '#E8F5E9',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
        }}>
          <MaterialCommunityIcons name="email-check-outline" size={48} color="#2D5A3D" />
        </View>

        {/* Title */}
        <Text style={{
          fontSize: 24,
          fontWeight: '800',
          color: '#1A1A1A',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          Verify Your Email
        </Text>

        {/* Description */}
        <Text style={{
          fontSize: 15,
          color: '#8B9D77',
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 40,
        }}>
          We've sent a verification link to your email address. Please check your inbox and tap the link to verify your account.
        </Text>

        {/* Check Verification Button */}
        <TouchableOpacity
          onPress={handleCheckVerification}
          disabled={isChecking}
          style={{
            width: '100%',
            backgroundColor: '#2D5A3D',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 12,
            opacity: isChecking ? 0.7 : 1,
          }}
        >
          {isChecking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
              I've Verified My Email
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend Email Button */}
        <TouchableOpacity
          onPress={handleResendEmail}
          disabled={isResending || resendCooldown}
          style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 12,
            borderWidth: 1,
            borderColor: '#E0E0E0',
            opacity: (isResending || resendCooldown) ? 0.5 : 1,
          }}
        >
          {isResending ? (
            <ActivityIndicator color="#2D5A3D" />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#2D5A3D' }}>
              {resendCooldown ? 'Email Sent — Check Inbox' : 'Resend Verification Email'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign Out Link */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{ marginTop: 16, paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 14, color: '#8B9D77', textDecorationLine: 'underline' }}>
            Use a different account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
