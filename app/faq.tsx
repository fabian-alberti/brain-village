import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'What is Brain Village?',
    answer:
      'Brain Village is a goal-tracking app that helps you build positive habits and achieve your personal goals. As you make progress, your virtual village grows and evolves to reflect your accomplishments.',
  },
  {
    question: 'How does the village work?',
    answer:
      'Your village visually represents your overall progress. When you consistently complete your goals, your village improves and levels up. If you fall behind, the village reflects that too — motivating you to stay on track.',
  },
  {
    question: 'How do I create a new goal?',
    answer:
      'Go to the Goals tab and tap the "+" button. Choose a title, set your target frequency, and optionally add details. Your new goal will appear in your goals list right away.',
  },
  {
    question: 'What are streaks?',
    answer:
      'A streak counts how many consecutive days you have completed at least one goal. Keeping your streak alive is a great way to build momentum and see your village thrive!',
  },
  {
    question: 'Can I edit or delete a goal?',
    answer:
      'Yes! Tap on any goal to view its details. From there you can edit the goal information or delete it if you no longer need it.',
  },
  {
    question: 'How do notifications work?',
    answer:
      'You can enable or disable notifications from the Profile tab under Settings. When enabled, Brain Village will send you reminders to help you stay on track with your goals.',
  },
  {
    question: 'How do I change my profile picture?',
    answer:
      'Go to the Profile tab and tap on your avatar image. You can choose from different brain characters and background colors to personalise your profile.',
  },
  {
    question: 'Is my data private?',
    answer:
      'Yes. Your data is stored securely and is only accessible to you through your account. We do not share your personal information with third parties.',
  },
  {
    question: 'How can I contact support?',
    answer:
      'You can reach us by tapping "Contact Us" on the Profile page, which will open your email app with our support address pre-filled. You can also email us directly at contact.brainvillage@gmail.com.',
  },
];

function FAQAccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <View>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 4,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: '600',
            color: '#1A1A1A',
            lineHeight: 21,
            paddingRight: 12,
          }}
        >
          {item.question}
        </Text>
        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={22}
          color="#8B9D77"
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={{ paddingBottom: 16, paddingHorizontal: 4 }}>
          <Text
            style={{
              fontSize: 14,
              color: '#5A6B4D',
              lineHeight: 22,
            }}
          >
            {item.answer}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function FAQScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === index ? null : index);
  };

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
          FAQs
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        {/* Intro */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, color: '#8B9D77', lineHeight: 20 }}>
            Find answers to common questions about Brain Village below.
          </Text>
        </View>

        {/* FAQ List */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            paddingHorizontal: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          {FAQ_DATA.map((item, index) => (
            <View key={index}>
              <FAQAccordionItem
                item={item}
                isOpen={openIndex === index}
                onToggle={() => handleToggle(index)}
              />
              {index < FAQ_DATA.length - 1 && (
                <View style={{ height: 1, backgroundColor: '#F0EDE5' }} />
              )}
            </View>
          ))}
        </View>

        {/* Footer CTA */}
        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <Text style={{ fontSize: 13, color: '#8B9D77', marginBottom: 4 }}>
            Still have questions?
          </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#2D5A3D' }}>
              Contact Us
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
