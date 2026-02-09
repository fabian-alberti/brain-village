import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useApp, useUser } from '@/context/AppContext';

export default function ProfileScreen() {
  const { updateSettings, signOut } = useApp();
  const user = useUser();
  const router = useRouter();

  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const displayName = user?.displayName ?? 'User';
  const notificationsEnabled = user?.settings?.notificationsEnabled ?? true;

  const handleEditName = () => {
    setEditedName(displayName);
    setShowEditNameModal(true);
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const { updateUserData } = await import('@/lib/firebase');
      if (user?.id) {
        await updateUserData(user.id, { displayName: editedName.trim() });
      }
      setShowEditNameModal(false);
    } catch (error) {
      console.error('Failed to update name:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    await updateSettings({ notificationsEnabled: value });
  };

  const handleResetPassword = () => {
    router.push('/reset-password');
  };

  const handleContactUs = async () => {
    const email = 'contact.brainvillage@gmail.com';
    const subject = 'Brain Village Support';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert('Error', 'Unable to open email app. Please email us at contact.brainvillage@gmail.com');
      }
    } catch {
      Alert.alert('Error', 'Unable to open email app. Please email us at contact.brainvillage@gmail.com');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Do you really want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  // ── Reusable sub-components ─────────────────────────────────

  const StatCard = ({ icon, iconColor, value, label }: {
    icon: string;
    iconColor: string;
    value: string | number;
    label: string;
  }) => (
    <View style={{
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 10,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: `${iconColor}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
      }}>
        <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
      </View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: '#1A1A1A' }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: '#8B9D77', textAlign: 'center', marginTop: 2, lineHeight: 15 }}>
        {label}
      </Text>
    </View>
  );

  const SettingsRow = ({ icon, iconColor, label, value, showDivider = true, onPress, isDestructive }: {
    icon: string;
    iconColor?: string;
    label: string;
    value?: string;
    showDivider?: boolean;
    onPress?: () => void;
    isDestructive?: boolean;
  }) => {
    const content = (
      <>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 4,
        }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: isDestructive ? '#FEF2F2' : '#F5F5F0',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MaterialCommunityIcons
              name={icon as any}
              size={18}
              color={isDestructive ? '#EF4444' : (iconColor || '#1A1A1A')}
            />
          </View>
          <Text style={{
            marginLeft: 12,
            flex: 1,
            color: isDestructive ? '#EF4444' : '#1A1A1A',
            fontSize: 16,
            fontWeight: '500',
          }}>
            {label}
          </Text>
          {value && (
            <Text style={{ color: '#8B9D77', fontSize: 14, marginRight: 4 }}>
              {value}
            </Text>
          )}
          <MaterialCommunityIcons name="chevron-right" size={20} color="#B0BCA4" />
        </View>
        {showDivider && (
          <View style={{ height: 1, backgroundColor: '#F0EDE5', marginLeft: 48 }} />
        )}
      </>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {content}
        </TouchableOpacity>
      );
    }
    return <View>{content}</View>;
  };

  // ── Render ──────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF2' }} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 }}>
            Profile
          </Text>
        </View>

        {/* Avatar & Name */}
        <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 28 }}>
          <View style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: '#E8F5E9',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <MaterialCommunityIcons name="account" size={48} color="#2D5A3D" />
          </View>
          <TouchableOpacity
            onPress={handleEditName}
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1A1A' }}>
              {displayName}
            </Text>
            <MaterialCommunityIcons name="pencil" size={16} color="#8B9D77" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* Statistics */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B9D77', marginBottom: 12, paddingLeft: 4 }}>
            Statistics
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard
              icon="target"
              iconColor="#2D5A3D"
              value={user?.goalsCompleted ?? 0}
              label={'Goals\nCompleted'}
            />
            <StatCard
              icon="lightning-bolt"
              iconColor="#F4A261"
              value={user?.currentStreak ?? 0}
              label={'Current\nStreak'}
            />
            <StatCard
              icon="trophy"
              iconColor="#9146FF"
              value={23}
              label={'Best\nStreak'}
            />
          </View>
        </View>

        {/* Settings */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B9D77', marginBottom: 12, paddingLeft: 4 }}>
            Settings
          </Text>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            paddingHorizontal: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}>
            <SettingsRow
              icon="bell-outline"
              label="Notifications"
              value={notificationsEnabled ? 'On' : 'Off'}
              onPress={() => setShowNotificationsModal(true)}
            />
            <SettingsRow
              icon="lock-reset"
              label="Reset Password"
              onPress={handleResetPassword}
            />
            <SettingsRow
              icon="logout"
              label="Log Out"
              showDivider={false}
              onPress={handleLogout}
              isDestructive
            />
          </View>
        </View>

        {/* Brain Village */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B9D77', marginBottom: 12, paddingLeft: 4 }}>
            Brain Village
          </Text>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            paddingHorizontal: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}>
            <SettingsRow
              icon="headset"
              label="Contact Us"
              onPress={handleContactUs}
            />
            <SettingsRow
              icon="help-circle-outline"
              label="FAQs"
            />
            <SettingsRow
              icon="information-outline"
              label="About Brain Village"
              showDivider={false}
            />
          </View>
        </View>
      </ScrollView>

      {/* ── Edit Name Modal ─────────────────────────────── */}
      <Modal
        visible={showEditNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditNameModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20,
            }}
            activeOpacity={1}
            onPress={() => setShowEditNameModal(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 340,
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 10,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 20, textAlign: 'center' }}>
                Edit Username
              </Text>

              <TextInput
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your name"
                placeholderTextColor="#B0BCA4"
                autoFocus
                style={{
                  backgroundColor: '#F5F5F0',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  color: '#1A1A1A',
                  marginBottom: 20,
                }}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowEditNameModal(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: '#F5F5F0',
                  }}
                >
                  <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#8B9D77' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveName}
                  disabled={isSaving || !editedName.trim()}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: '#2D5A3D',
                    opacity: (isSaving || !editedName.trim()) ? 0.5 : 1,
                  }}
                >
                  <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Notifications Modal ────────────────────────── */}
      <Modal
        visible={showNotificationsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <TouchableWithoutFeedback onPress={() => setShowNotificationsModal(false)}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>

          <View style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 10,
          }}>
            {/* Handle bar */}
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E8E8E8' }} />
            </View>

            <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 }}>
                Notifications
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#F5F5F0',
                borderRadius: 12,
                padding: 16,
              }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: '#1A1A1A' }}>
                  All Notifications
                </Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: '#D1D1D1', true: '#2D5A3D' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#D1D1D1"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
