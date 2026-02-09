import { useState } from 'react';
import {
  View,
  Text,
  ScrollView, 
  Dimensions, 
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
import Svg, { Path, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useApp, useUser } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = Math.min(SCREEN_WIDTH - 40, 340);
const CARD_GAP = 10;
const STAT_CARD_WIDTH = (CONTENT_WIDTH - CARD_GAP * 2) / 3;

// Account Circle Icon (large avatar)
function AccountCircleIcon() {
  return (
    <Svg width={120} height={120} viewBox="0 0 24 24" fill="#1052A0">
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
    </Svg>
  );
}

// Edit/Create Icon (pencil)
function CreateIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill={color}>
      <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </Svg>
  );
}

// Chevron Down Icon (for modal close)
function ChevronDownIcon({ color }: { color: string }) {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill={color}>
      <Path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
    </Svg>
  );
}

// Goal Icon (target/bullseye)
function GoalIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="9" fill="none" stroke="#008030" strokeWidth="2" />
      <Circle cx="12" cy="12" r="5" fill="none" stroke="#008030" strokeWidth="2" />
      <Circle cx="12" cy="12" r="1.5" fill="#008030" />
    </Svg>
  );
}

// Zap Icon (lightning bolt)
function ZapIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="#D39C2F">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </Svg>
  );
}

// Award Icon (medal/trophy)
function AwardIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24">
      <Circle cx="12" cy="8" r="5" fill="none" stroke="#C238EB" strokeWidth="2" />
      <Path d="M8.5 12.5L7 22l5-3 5 3-1.5-9.5" fill="none" stroke="#C238EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Bell Icon (notifications)
function BellIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </Svg>
  );
}

// Key Icon (reset password)
function KeyIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </Svg>
  );
}

// Power Icon (log out)
function PowerIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z" />
    </Svg>
  );
}

// Chevron Right Icon
function ChevronRightIcon({ color }: { color: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill={color}>
      <Path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
    </Svg>
  );
}

// Headset Icon (contact us)
function HeadsetIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
    </Svg>
  );
}

// Help Circle Icon (FAQs)
function HelpCircleIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
    </Svg>
  );
}

// Info Icon (about)
function InfoIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </Svg>
  );
}

export default function ProfileScreen() {
  const { updateSettings, signOut } = useApp();
  const user = useUser();
  const router = useRouter();
  const { colors } = useTheme();
  
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
    } catch (error) {
      Alert.alert('Error', 'Unable to open email app. Please email us at contact.brainvillage@gmail.com');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Do you really want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  // Settings Row Component
  const SettingsRow = ({ 
    icon, 
    label, 
    value, 
    showDivider = true,
    onPress,
  }: { 
    icon: React.ReactNode; 
    label: string; 
    value?: string;
    showDivider?: boolean;
    onPress?: () => void;
  }) => {
    const content = (
      <View>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingVertical: 14,
          paddingHorizontal: 4,
        }}>
          <View style={{ width: 28, alignItems: 'center' }}>
            {icon}
          </View>
          <Text style={{
            marginLeft: 14,
            flex: 1,
            color: colors.text,
            fontSize: 17,
            fontWeight: '400',
          }}>
            {label}
          </Text>
          {value && (
            <Text style={{
              color: colors.textSecondary,
              fontSize: 17,
              fontWeight: '400',
              marginRight: 2,
            }}>
              {value}
            </Text>
          )}
          <ChevronRightIcon color={colors.textSecondary} />
        </View>
        {showDivider && (
          <View style={{
            height: 1,
            backgroundColor: colors.divider,
            marginHorizontal: 4,
          }} />
        )}
            </View>
    );

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {content}
        </TouchableOpacity>
      );
    }

    return content;
  };

  // Stat Card Component
  const StatCard = ({ 
    icon, 
    value, 
    label 
  }: { 
    icon: React.ReactNode; 
    value: string | number; 
    label: string;
  }) => {
    return (
      <View style={{
        width: STAT_CARD_WIDTH,
        paddingVertical: 20,
        paddingHorizontal: 8,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
        alignItems: 'center',
      }}>
        {icon}
        <Text style={{
          color: colors.text,
          fontWeight: '700',
          fontSize: 32,
          marginTop: 14,
          marginBottom: 6,
        }}>
          {value}
              </Text>
        <Text style={{
          color: colors.textSecondary,
          fontWeight: '400',
          fontSize: 13,
          lineHeight: 17,
          textAlign: 'center',
        }}>
          {label}
              </Text>
            </View>
    );
  };

  // Section Header Component
  const SectionHeader = ({ title }: { title: string }) => {
    return (
      <Text style={{
        color: colors.text,
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 10,
      }}>
        {title}
      </Text>
    );
  };

  // Card Container Component
  const CardContainer = ({ children }: { children: React.ReactNode }) => {
    return (
      <View style={{
        width: CONTENT_WIDTH,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 6,
      }}>
        {children}
              </View>
    );
  };

  // Toggle Row for Notifications Modal
  const ToggleRow = ({ 
    label, 
    value, 
    onValueChange 
  }: { 
    label: string; 
    value: boolean; 
    onValueChange: (value: boolean) => void;
  }) => {
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
      }}>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#D1D1D1', true: colors.primary }}
          thumbColor={'#FFFFFF'}
          ios_backgroundColor={'#D1D1D1'}
          style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
        />
        <Text style={{
          marginLeft: 16,
          fontSize: 18,
          fontWeight: '500',
          color: colors.text,
        }}>
          {label}
        </Text>
            </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          alignItems: 'center', 
          paddingBottom: 50,
          paddingTop: 10,
        }}
      >
        {/* Profile Header */}
        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 32 }}>
          <AccountCircleIcon />
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginTop: 14,
          }}>
            <Text style={{
              color: colors.text,
              fontWeight: '400',
              fontSize: 20,
            }}>
              {displayName}
            </Text>
            <TouchableOpacity 
              onPress={handleEditName}
              style={{ marginLeft: 10, padding: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CreateIcon color={colors.icon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={{ width: CONTENT_WIDTH, marginBottom: 28 }}>
          <SectionHeader title="Statistics" />
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between',
          }}>
            <StatCard 
              icon={<GoalIcon />}
              value={user?.goalsCompleted ?? 0}
              label={"Goals\nCompleted"}
            />
            <StatCard 
              icon={<ZapIcon />}
              value={user?.currentStreak ?? 0}
              label={"Current\nStreak"}
            />
            <StatCard 
              icon={<AwardIcon />}
              value={23}
              label={"Best\nStreak"}
            />
          </View>
        </View>

        {/* Settings Section */}
        <View style={{ width: CONTENT_WIDTH, marginBottom: 28 }}>
          <SectionHeader title="Settings" />
          <CardContainer>
            <SettingsRow 
              icon={<BellIcon color={colors.icon} />}
              label="Notifications"
              value={notificationsEnabled ? "On" : "Off"}
              onPress={() => setShowNotificationsModal(true)}
            />
            <SettingsRow 
              icon={<KeyIcon color={colors.icon} />}
              label="Reset Password"
              onPress={handleResetPassword}
            />
            <SettingsRow 
              icon={<PowerIcon color={colors.icon} />}
              label="Log Out"
              showDivider={false}
              onPress={handleLogout}
            />
          </CardContainer>
            </View>

        {/* Brain Village Section */}
        <View style={{ width: CONTENT_WIDTH }}>
          <SectionHeader title="Brain Village v1" />
          <CardContainer>
            <SettingsRow 
              icon={<HeadsetIcon color={colors.icon} />}
              label="Contact Us"
              onPress={handleContactUs}
            />
            <SettingsRow 
              icon={<HelpCircleIcon color={colors.icon} />}
              label="FAQs"
            />
            <SettingsRow 
              icon={<InfoIcon color={colors.icon} />}
              label="About Brain Village"
              showDivider={false}
            />
          </CardContainer>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
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
              backgroundColor: 'rgba(0,0,0,0.5)', 
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
                width: CONTENT_WIDTH,
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 20,
              }}
            >
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 16,
                textAlign: 'center',
              }}>
                Edit Username
              </Text>
              
              <TextInput
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 6,
                  padding: 14,
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 20,
                }}
              />
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowEditNameModal(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  }}
                >
                  <Text style={{
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: '500',
                    color: colors.text,
                  }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
              <TouchableOpacity
                  onPress={handleSaveName}
                  disabled={isSaving || !editedName.trim()}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 6,
                    backgroundColor: colors.primary,
                    opacity: (isSaving || !editedName.trim()) ? 0.5 : 1,
                  }}
                >
                  <Text style={{
                    textAlign: 'center',
                    fontSize: 16,
                    fontWeight: '500',
                    color: '#FFFFFF',
                  }}>
                    {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
          </View>
        </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={showNotificationsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}>
          {/* Tap backdrop to close */}
          <TouchableWithoutFeedback onPress={() => setShowNotificationsModal(false)}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
          
          {/* Bottom sheet content */}
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: 40,
          }}>
        <TouchableOpacity 
              onPress={() => setShowNotificationsModal(false)}
              activeOpacity={0.7}
              style={{
                alignItems: 'center',
                paddingVertical: 8,
              }}
            >
              <ChevronDownIcon color={colors.icon} />
            </TouchableOpacity>
            
            <View style={{
              marginHorizontal: 20,
              backgroundColor: colors.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}>
              <ToggleRow
                label="All Notifications"
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
              />
                  </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
