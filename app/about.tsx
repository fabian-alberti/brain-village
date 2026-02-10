import { View, Text, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const APP_VERSION = '1.0.0';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: '#8B9D77',
          marginBottom: 10,
          paddingLeft: 4,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF2' }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <MaterialCommunityIcons name="chevron-left" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '800',
            color: '#1A1A1A',
            letterSpacing: -0.5,
            marginLeft: 12,
          }}
        >
          About
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        {/* App Identity */}
        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 28 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              overflow: 'hidden',
              marginBottom: 14,
              shadowColor: '#2D5A3D',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Image
              source={require('@/assets/App Icon.png')}
              style={{ width: 88, height: 88 }}
              resizeMode="cover"
            />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.3 }}>
            Brain Village
          </Text>
          <Text style={{ fontSize: 13, color: '#8B9D77', marginTop: 4 }}>
            Version {APP_VERSION}
          </Text>
        </View>

        {/* Our Mission */}
        <Section title="Our Mission">
          <Text style={{ fontSize: 14, color: '#5A6B4D', lineHeight: 22 }}>
            Brain Village was created to make personal growth feel rewarding and tangible. We believe
            that building good habits shouldn't feel like a chore — it should feel like building
            something meaningful.
          </Text>
          <Text style={{ fontSize: 14, color: '#5A6B4D', lineHeight: 22, marginTop: 12 }}>
            As you set goals and follow through on them, your virtual village grows and thrives,
            giving you a visual reminder of just how far you've come.
          </Text>
        </Section>

        {/* How It Works */}
        <Section title="How It Works">
          <View style={{ gap: 14 }}>
            {[
              {
                icon: 'target',
                color: '#2D5A3D',
                title: 'Set Goals',
                description: 'Create personal goals with custom schedules that fit your life.',
              },
              {
                icon: 'check-circle-outline',
                color: '#F4A261',
                title: 'Track Progress',
                description: 'Check in daily and build streaks to keep your momentum going.',
              },
              {
                icon: 'home-city',
                color: '#9146FF',
                title: 'Grow Your Village',
                description:
                  'Watch your village evolve as you hit milestones and stay consistent.',
              },
            ].map((step, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: `${step.color}15`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    marginTop: 2,
                  }}
                >
                  <MaterialCommunityIcons name={step.icon as any} size={20} color={step.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 2 }}>
                    {step.title}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#5A6B4D', lineHeight: 19 }}>
                    {step.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Section>

        {/* The Story */}
        <Section title="The Story">
          <Text style={{ fontSize: 14, color: '#5A6B4D', lineHeight: 22 }}>
            Brain Village started as a personal project. Regular screen time limit apps just weren't
            working — so I had to find a different way to actually motivate myself to put the phone
            down. The idea was simple: turn screen time goals into something rewarding by building a
            virtual village that grows with your progress.
          </Text>
        </Section>

        {/* Contact */}
        <Section title="Get In Touch">
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                `mailto:contact.brainvillage@gmail.com?subject=${encodeURIComponent('Brain Village Feedback')}`
              )
            }
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#F5F5F0',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <MaterialCommunityIcons name="email-outline" size={20} color="#2D5A3D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#1A1A1A' }}>Email Us</Text>
              <Text style={{ fontSize: 12, color: '#8B9D77', marginTop: 1 }}>
                contact.brainvillage@gmail.com
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#B0BCA4" />
          </TouchableOpacity>
        </Section>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Text style={{ fontSize: 12, color: '#B0BCA4', textAlign: 'center', lineHeight: 18 }}>
            Made with care as a personal project
          </Text>
          <Text style={{ fontSize: 12, color: '#B0BCA4', marginTop: 4 }}>
            © {new Date().getFullYear()} Brain Village
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
