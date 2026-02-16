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
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useApp, useUser } from '@/context/AppContext';
import { PROFILE_BG_COLORS } from '@/lib/types';
import { requestNotificationPermission } from '@/lib/notifications';

// Map profile image index (1-5) to require() assets
const PROFILE_IMAGES: Record<number, ImageSourcePropType> = {
  1: require('@/assets/profile images/Brain_Profile_1.png'),
  2: require('@/assets/profile images/Brain_Profile_2.png'),
  3: require('@/assets/profile images/Brain_Profile_3.png'),
  4: require('@/assets/profile images/Brain_Profile_4.png'),
  5: require('@/assets/profile images/Brain_Profile_5.png'),
};

export default function ProfileScreen() {
  const { updateSettings, updateProfile, signOut, deleteAccount } = useApp();
  const user = useUser();
  const router = useRouter();

  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileImageModal, setShowProfileImageModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(1);
  const [selectedBgColor, setSelectedBgColor] = useState('#E8F5E9');

  const displayName = user?.displayName ?? 'User';
  const notificationsEnabled = user?.settings?.notificationsEnabled ?? true;
  const profileImage = user?.profileImage ?? 1;
  const profileBgColor = user?.profileBgColor ?? '#E8F5E9';

  const handleEditProfileImage = () => {
    setSelectedImage(profileImage);
    setSelectedBgColor(profileBgColor);
    setShowProfileImageModal(true);
  };

  const handleSaveProfileImage = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await updateProfile({
        profileImage: selectedImage,
        profileBgColor: selectedBgColor,
      });
      setShowProfileImageModal(false);
    } catch (error) {
      console.error('Failed to update profile image:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditName = () => {
    setEditedName(displayName);
    setShowEditNameModal(true);
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await updateProfile({ displayName: editedName.trim() });
      setShowEditNameModal(false);
    } catch (error) {
      console.error('Failed to update name:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive goal reminders.',
        );
        return;
      }
    }
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

  const handleDeleteAccountPress = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data (goals, progress, statistics). This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            setDeletePassword('');
            setDeleteError('');
            setShowDeleteAccountModal(true);
          },
        },
      ]
    );
  };

  const handleConfirmDeleteAccount = async () => {
    if (!deletePassword.trim() || isDeleting) return;
    setDeleteError('');
    setIsDeleting(true);
    try {
      await deleteAccount(deletePassword);
      setShowDeleteAccountModal(false);
    } catch (error: any) {
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        setDeleteError('Incorrect password. Please try again.');
      } else if (error?.code === 'auth/too-many-requests') {
        setDeleteError('Too many attempts. Please try again later.');
      } else {
        setDeleteError(error?.message || 'Failed to delete account. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
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
          <TouchableOpacity onPress={handleEditProfileImage} activeOpacity={0.8}>
            <View style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: profileBgColor,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <Image
                source={PROFILE_IMAGES[profileImage] || PROFILE_IMAGES[1]}
                style={{ width: 72, height: 72 }}
                resizeMode="contain"
              />
            </View>
            {/* Edit badge */}
            <View style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: '#2D5A3D',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#FFFBF2',
            }}>
              <MaterialCommunityIcons name="pencil" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
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
              onPress={handleLogout}
              isDestructive
            />
            <SettingsRow
              icon="delete-outline"
              label="Delete Account"
              showDivider={false}
              onPress={handleDeleteAccountPress}
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
              onPress={() => router.push('/faq')}
            />
            <SettingsRow
              icon="information-outline"
              label="About Brain Village"
              showDivider={false}
              onPress={() => router.push('/about')}
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

      {/* ── Delete Account Modal ────────────────────────── */}
      <Modal
        visible={showDeleteAccountModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteAccountModal(false)}
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
            onPress={() => setShowDeleteAccountModal(false)}
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
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#FEF2F2',
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'center',
                marginBottom: 16,
              }}>
                <MaterialCommunityIcons name="alert-outline" size={24} color="#EF4444" />
              </View>

              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 8, textAlign: 'center' }}>
                Confirm Deletion
              </Text>
              <Text style={{ fontSize: 14, color: '#8B9D77', textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>
                Enter your password to permanently delete your account and all data.
              </Text>

              <TextInput
                value={deletePassword}
                onChangeText={(text) => {
                  setDeletePassword(text);
                  setDeleteError('');
                }}
                placeholder="Enter your password"
                placeholderTextColor="#B0BCA4"
                secureTextEntry
                autoFocus
                style={{
                  backgroundColor: '#F5F5F0',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                  color: '#1A1A1A',
                  marginBottom: deleteError ? 8 : 20,
                }}
              />

              {deleteError ? (
                <View style={{
                  backgroundColor: '#FEF2F2',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 16,
                }}>
                  <Text style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>
                    {deleteError}
                  </Text>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowDeleteAccountModal(false)}
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
                  onPress={handleConfirmDeleteAccount}
                  disabled={isDeleting || !deletePassword.trim()}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: '#EF4444',
                    opacity: (isDeleting || !deletePassword.trim()) ? 0.5 : 1,
                  }}
                >
                  <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Profile Image Modal ─────────────────────────── */}
      <Modal
        visible={showProfileImageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileImageModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <TouchableWithoutFeedback onPress={() => setShowProfileImageModal(false)}>
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
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 8, textAlign: 'center' }}>
                Choose Your Avatar
              </Text>

              {/* Preview */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: selectedBgColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <Image
                    source={PROFILE_IMAGES[selectedImage] || PROFILE_IMAGES[1]}
                    style={{ width: 76, height: 76 }}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Brain Icon Selection */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B9D77', marginBottom: 10 }}>
                Brain Character
              </Text>
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedImage(idx)}
                    activeOpacity={0.7}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 16,
                      backgroundColor: '#F5F5F0',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: selectedImage === idx ? 2.5 : 0,
                      borderColor: selectedImage === idx ? '#2D5A3D' : 'transparent',
                      overflow: 'hidden',
                    }}
                  >
                    <Image
                      source={PROFILE_IMAGES[idx]}
                      style={{ width: 44, height: 44 }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Background Color Selection */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#8B9D77', marginBottom: 10 }}>
                Background Color
              </Text>
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 24,
              }}>
                {PROFILE_BG_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSelectedBgColor(color)}
                    activeOpacity={0.7}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: color,
                      borderWidth: selectedBgColor === color ? 2.5 : 1,
                      borderColor: selectedBgColor === color ? '#2D5A3D' : '#E0E0E0',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selectedBgColor === color && (
                      <MaterialCommunityIcons name="check" size={18} color="#2D5A3D" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowProfileImageModal(false)}
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
                  onPress={handleSaveProfileImage}
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: '#2D5A3D',
                    opacity: isSaving ? 0.5 : 1,
                  }}
                >
                  <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
