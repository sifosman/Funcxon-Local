import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../theme';
import { supabase } from '../lib/supabaseClient';
import { SUPPORT_WHATSAPP } from '../utils/env';
import ThemedAlert from '../components/ThemedAlert';

type ProfileStackParamList = {
  SubscriberSuite: undefined;
  PortfolioAssistance: undefined;
};

type AssistanceOption = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  bgColor: string;
  action: () => void;
};

type CallbackFormData = {
  phoneNumber: string;
  preferredTime: string;
  assistanceType: string;
};

const ASSISTANCE_CATEGORIES = [
  'Help completing application forms',
  'Uploading and optimizing photos',
  'Professional bio writing',
  'Choosing correct tags/categories',
  'Setting pricing and packages',
  'Understanding analytics',
  'Marketing strategy',
  'Other'
];

const TIME_SLOTS = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM'
];

const FAQS = [
  {
    question: 'How do I create a portfolio?',
    answer: 'Go to the Subscriber Suite and tap "Update Portfolio." Fill in your business details, upload photos, and set your categories.',
  },
  {
    question: 'What photos should I upload?',
    answer: 'Upload high-quality images of your best work. Venues should show the space from multiple angles; vendors should showcase their services.',
  },
  {
    question: 'How do I upgrade my plan?',
    answer: 'Navigate to Subscription Plans from your account screen to view and select a plan that suits your needs.',
  },
  {
    question: 'Can I edit my portfolio after publishing?',
    answer: 'Yes, you can update your portfolio anytime from the Subscriber Suite.',
  },
  {
    question: 'How do I receive quote requests?',
    answer: 'Once your portfolio is live and approved, clients can send quote requests directly through your profile.',
  },
];

export default function PortfolioAssistanceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [formData, setFormData] = useState<CallbackFormData>({
    phoneNumber: '',
    preferredTime: '',
    assistanceType: ''
  });
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showFaqSection, setShowFaqSection] = useState(false);

  const handleLiveChat = () => {
    const clean = SUPPORT_WHATSAPP.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${clean}?text=Hi, I need help with my portfolio application.`;
    setAlertState({
      visible: true,
      title: 'Live Chat Support',
      message: "You'll be connected to our portfolio specialist via WhatsApp for real-time assistance.",
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertState(null) },
        { text: 'Open WhatsApp', style: 'default', onPress: () => { setAlertState(null); Linking.openURL(whatsappUrl).catch(() => null); } }
      ]
    });
  };

  const handleScheduleCall = () => {
    setShowCallbackForm(true);
  };

  const handleVideoTutorials = () => {
    setAlertState({
      visible: true,
      title: 'Video Tutorials',
      message: 'Video tutorials library will be available soon. In the meantime, contact us via Live Chat for guidance.',
      buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]
    });
  };

  const handleFAQs = () => {
    setShowFaqSection(true);
  };

  const handleCallbackSubmit = async () => {
    if (!formData.phoneNumber || !formData.preferredTime || !formData.assistanceType) {
      setAlertState({ visible: true, title: 'Missing Information', message: 'Please fill in all fields to request a callback.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
      return;
    }

    await sendAdminNotification();

    setAlertState({
      visible: true,
      title: 'Callback Requested',
      message: `Thank you! We'll call you at ${formData.preferredTime} to help with ${formData.assistanceType.toLowerCase()}. You'll receive a confirmation message shortly.`,
      buttons: [{ text: 'OK', style: 'default', onPress: () => { setAlertState(null); setShowCallbackForm(false); setFormData({ phoneNumber: '', preferredTime: '', assistanceType: '' }); } }]
    });
  };

  const sendAdminNotification = async () => {
    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('send-admin-notification', {
        body: {
          type: 'portfolio-callback-requested',
          vendorName: user?.user_metadata?.full_name || 'Unknown',
          vendorEmail: user?.email,
          phoneNumber: formData.phoneNumber,
          preferredTime: formData.preferredTime,
          assistanceType: formData.assistanceType,
        },
      });

      if (error) {
        console.error('Error sending admin notification:', error);
        return;
      }

      console.log('Admin notification sent successfully:', data);
    } catch (err) {
      console.error('Failed to send admin notification:', err);
    }
  };

  const assistanceOptions: AssistanceOption[] = [
    {
      id: 'live-chat',
      title: 'Live Chat',
      description: 'Get real-time help via WhatsApp with our portfolio specialists',
      icon: 'chat',
      iconColor: '#22C55E',
      bgColor: '#F0FDF4',
      action: handleLiveChat
    },
    {
      id: 'schedule-call',
      title: 'Schedule Call',
      description: 'Book a 15-30 minute consultation with our expert team',
      icon: 'phone',
      iconColor: colors.textPrimary,
      bgColor: '#E0F2FE',
      action: handleScheduleCall
    },
    {
      id: 'video-tutorials',
      title: 'Video Tutorials',
      description: 'Watch step-by-step guides for portfolio creation and management',
      icon: 'play-circle-filled',
      iconColor: '#8B5CF6',
      bgColor: '#F3E8FF',
      action: handleVideoTutorials
    },
    {
      id: 'faqs',
      title: 'FAQs',
      description: 'Find quick answers to common portfolio questions',
      icon: 'help-outline',
      iconColor: '#F59E0B',
      bgColor: '#FFFBEB',
      action: handleFAQs
    }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
              Back to Subscriber Suite
            </Text>
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.textPrimary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.md
            }}>
              <MaterialIcons name="support-agent" size={40} color="#FFFFFF" />
            </View>
            <Text style={{ ...typography.displayMedium, color: colors.textPrimary, textAlign: 'center' }}>
              Portfolio Assistance
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm }}>
              Get expert help to create and optimize your business portfolio
            </Text>
          </View>
        </View>

        {/* Office Hours */}
        <View style={{
          marginHorizontal: spacing.lg,
          marginBottom: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <MaterialIcons name="schedule" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginLeft: spacing.sm }}>
              Office Hours & Response Times
            </Text>
          </View>
          <View style={{ gap: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="access-time" size={16} color={colors.textMuted} />
              <Text style={{ ...typography.caption, color: colors.textMuted, marginLeft: spacing.sm }}>
                Monday - Friday: 9:00 AM - 5:00 PM
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="access-time" size={16} color={colors.textMuted} />
              <Text style={{ ...typography.caption, color: colors.textMuted, marginLeft: spacing.sm }}>
                Saturday: 9:00 AM - 1:00 PM
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="access-time" size={16} color={colors.textMuted} />
              <Text style={{ ...typography.caption, color: colors.textMuted, marginLeft: spacing.sm }}>
                Response Time: Within 2 hours during business hours
              </Text>
            </View>
          </View>
        </View>

        {/* Assistance Options */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
            How can we help you?
          </Text>
          <View style={{ gap: spacing.md }}>
            {assistanceOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                onPress={option.action}
                style={{
                  padding: spacing.lg,
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: option.bgColor,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: spacing.md
                  }}>
                    <MaterialIcons name={option.icon} size={24} color={option.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                      {option.title}
                    </Text>
                    <Text style={{ ...typography.body, color: colors.textMuted }}>
                      {option.description}
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Callback Form Modal */}
        {showCallbackForm && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg
          }}>
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              width: '100%',
              maxWidth: 400
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                  Request Callback
                </Text>
                <TouchableOpacity onPress={() => setShowCallbackForm(false)}>
                  <MaterialIcons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: spacing.md }}>
                <View>
                  <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>
                    Phone Number *
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      borderRadius: radii.md,
                      padding: spacing.md,
                      ...typography.body,
                      color: colors.textPrimary
                    }}
                    placeholder="Enter your phone number"
                    value={formData.phoneNumber}
                    onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                    keyboardType="phone-pad"
                  />
                </View>

                <View>
                  <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>
                    Preferred Time *
                  </Text>
                  <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false}>
                    {TIME_SLOTS.map((time) => (
                      <TouchableOpacity
                        key={time}
                        onPress={() => setFormData({ ...formData, preferredTime: time })}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: spacing.sm,
                          backgroundColor: formData.preferredTime === time ? colors.primary : colors.background,
                          borderRadius: radii.md,
                          borderWidth: 1,
                          borderColor: formData.preferredTime === time ? colors.primary : colors.borderSubtle,
                          marginBottom: spacing.xs
                        }}
                      >
                        <MaterialIcons 
                          name={formData.preferredTime === time ? 'radio-button-checked' : 'radio-button-unchecked'} 
                          size={16} 
                          color={formData.preferredTime === time ? colors.primary : colors.textMuted} 
                        />
                        <Text style={{
                          ...typography.caption,
                          color: formData.preferredTime === time ? colors.primary : colors.textPrimary,
                          marginLeft: spacing.sm
                        }}>
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View>
                  <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>
                    Assistance Needed *
                  </Text>
                  <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false}>
                    {ASSISTANCE_CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category}
                        onPress={() => setFormData({ ...formData, assistanceType: category })}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: spacing.sm,
                          backgroundColor: formData.assistanceType === category ? colors.primary : colors.background,
                          borderRadius: radii.md,
                          borderWidth: 1,
                          borderColor: formData.assistanceType === category ? colors.primary : colors.borderSubtle,
                          marginBottom: spacing.xs
                        }}
                      >
                        <MaterialIcons 
                          name={formData.assistanceType === category ? 'radio-button-checked' : 'radio-button-unchecked'} 
                          size={16} 
                          color={formData.assistanceType === category ? colors.primary : colors.textMuted} 
                        />
                        <Text style={{
                          ...typography.caption,
                          color: formData.assistanceType === category ? colors.primary : colors.textPrimary,
                          marginLeft: spacing.sm
                        }}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
                <TouchableOpacity
                  onPress={() => setShowCallbackForm(false)}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.md,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.textMuted }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCallbackSubmit}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.md,
                    borderRadius: radii.md,
                    backgroundColor: colors.primary,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.primaryForeground, fontWeight: '600' }}>
                    Request Callback
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* FAQ Accordion */}
        {showFaqSection && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Frequently Asked Questions</Text>
              <TouchableOpacity onPress={() => setShowFaqSection(false)}>
                <MaterialIcons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: spacing.sm }}>
              {FAQS.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <View key={index} style={{ backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderSubtle }}>
                    <TouchableOpacity
                      onPress={() => setOpenFaqIndex(isOpen ? null : index)}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md }}
                    >
                      <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600', flex: 1 }}>{faq.question}</Text>
                      <MaterialIcons name={isOpen ? 'expand-less' : 'expand-more'} size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
                        <Text style={{ ...typography.body, color: colors.textMuted }}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {alertState && (
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons ?? [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </View>
  );
}
