import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../theme';
import { supabase } from '../lib/supabaseClient';

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

export default function PortfolioAssistanceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [formData, setFormData] = useState<CallbackFormData>({
    phoneNumber: '',
    preferredTime: '',
    assistanceType: ''
  });

  const handleLiveChat = () => {
    const whatsappUrl = 'https://wa.me/27812345678?text=Hi, I need help with my portfolio application.';
    // In a real app, you would use Linking.openURL(whatsappUrl)
    Alert.alert(
      'Live Chat Support',
      'You\'ll be connected to our portfolio specialist via WhatsApp for real-time assistance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open WhatsApp', 
          onPress: () => {
            // TODO: Implement actual WhatsApp linking
            Alert.alert('Coming Soon', 'WhatsApp integration will be available soon.');
          }
        }
      ]
    );
  };

  const handleScheduleCall = () => {
    setShowCallbackForm(true);
  };

  const handleVideoTutorials = () => {
    Alert.alert(
      'Video Tutorials',
      'Access our library of step-by-step video guides to help you build the perfect portfolio.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'View Tutorials', 
          onPress: () => {
            // TODO: Navigate to video tutorials screen
            Alert.alert('Coming Soon', 'Video tutorials library will be available soon.');
          }
        }
      ]
    );
  };

  const handleFAQs = () => {
    Alert.alert(
      'Frequently Asked Questions',
      'Find quick answers to common questions about portfolio creation and management.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'View FAQs', 
          onPress: () => {
            // TODO: Navigate to FAQs screen
            Alert.alert('Coming Soon', 'FAQ section will be available soon.');
          }
        }
      ]
    );
  };

  const handleCallbackSubmit = async () => {
    if (!formData.phoneNumber || !formData.preferredTime || !formData.assistanceType) {
      Alert.alert('Missing Information', 'Please fill in all fields to request a callback.');
      return;
    }

    // Send admin notification about callback request
    await sendAdminNotification();

    Alert.alert(
      'Callback Requested',
      `Thank you! We'll call you at ${formData.preferredTime} to help with ${formData.assistanceType.toLowerCase()}. You'll receive a confirmation message shortly.`,
      [{ text: 'OK', onPress: () => {
        setShowCallbackForm(false);
        setFormData({ phoneNumber: '', preferredTime: '', assistanceType: '' });
      }}]
    );
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
      iconColor: colors.primaryTeal,
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
              backgroundColor: colors.primaryTeal,
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
            <MaterialIcons name="schedule" size={20} color={colors.primaryTeal} />
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
      </ScrollView>
    </View>
  );
}
