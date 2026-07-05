import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../theme';
import { supabase } from '../lib/supabaseClient';
import { SUPPORT_WHATSAPP } from '../utils/env';
import ThemedAlert from '../components/ThemedAlert';
import { useIsDesktop } from '../hooks/useIsDesktop';

type ProfileStackParamList = {
  SubscriberSuite: undefined;
  PortfolioAssistance: undefined;
};

type AssistanceRouteParams = { openFaqs?: boolean };
type AssistanceRouteProp = RouteProp<{ PortfolioAssistance: AssistanceRouteParams }, 'PortfolioAssistance'>;

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
    question: 'What is Funxon and who is it for?',
    answer: 'Funxon is a South African event marketplace connecting people planning events (attendees) with venues and professional vendors (listers). Whether you are organising a wedding, party, corporate event, or celebration, you can discover, compare, and book suppliers in one place.',
  },
  {
    question: 'How do I create an account or log in?',
    answer: 'Tap Account from the bottom navigation, then select Sign Up or Log In. You can register with your email address or use supported social sign-in options. A registered account lets you save favourites, request quotes, and manage your portfolio.',
  },
  {
    question: 'How do I search for a venue or vendor?',
    answer: 'Use the Home or Discover tabs to browse listings. Enter a city or province, select the listing type (venue or vendor), and tap Search. You can also filter by category, capacity, price, and distance.',
  },
  {
    question: 'How do the location and capacity filters work?',
    answer: 'On the Discover screen, tap the Location filter to choose a city or province, or use the radius map to find nearby venues. The Capacity filter lets you pick a guest band so you only see spaces that fit your event size.',
  },
  {
    question: 'How do I save a venue or vendor to review later?',
    answer: 'Open the listing profile and tap the heart icon. Saved items appear in your Favourites section on your Account screen, so you can compare them later.',
  },
  {
    question: 'How do I request a quote from a vendor or venue?',
    answer: 'From a listing profile, tap Request a Quote or Get a Quote. Fill in the event details such as date, guest count, and requirements, then submit. The lister will receive your request and respond through the app.',
  },
  {
    question: 'How do I book a tour of a venue?',
    answer: 'On a venue profile, tap Book a Tour. Choose a preferred date and time, add any special requests, and submit. The venue will confirm or propose an alternative time.',
  },
  {
    question: 'How can I contact a venue or vendor directly?',
    answer: 'Listing profiles show contact buttons for WhatsApp, phone, or email where the lister has provided them. For in-app communication, send a quote request or tour booking first.',
  },
  {
    question: 'What is the Planner and how do I use it?',
    answer: 'The Planner helps you budget and track spending. Add categories such as venue, catering, decor, and music, set an allocated amount for each, and mark expenses as you pay them. The dashboard shows your total budget versus amount spent.',
  },
  {
    question: 'How do I create a portfolio as a lister?',
    answer: 'Go to the Subscriber Suite and select Portfolio Profile or Update Portfolio. Choose whether you are a venue or vendor, fill in your business details, add a description, and upload your best photos. Once submitted, your portfolio will be reviewed and approved.',
  },
  {
    question: 'What photos should I upload to my portfolio?',
    answer: 'Venues should show the space from multiple angles and include exterior, seating, and stage areas. Vendors should showcase recent work, products, or service setups. High-quality, well-lit images attract more enquiries.',
  },
  {
    question: 'How do I set pricing and packages?',
    answer: 'In your portfolio or catalogue management area, add packages or items with names, descriptions, and prices. Venue listers can also set seasonal pricing and capacity options. Attendees will see these when requesting quotes.',
  },
  {
    question: 'How do I choose the right categories and tags?',
    answer: 'Pick the category that best matches your main service (e.g., Photography, Catering, Venue). Add relevant tags such as Outdoor, Wheelchair Friendly, or Live Music so your portfolio appears in the right searches.',
  },
  {
    question: 'How do I receive and respond to quote requests?',
    answer: 'Quote requests appear in your Listers Portal or in the dedicated Quote Requests section. Open a request to review the details, send a revised quote or accept the original, and message the client if needed.',
  },
  {
    question: 'How do I manage bookings and tours?',
    answer: 'Use the Bookings and Tours sections in your Listers Portal to view upcoming tours, confirm or reschedule bookings, and communicate with attendees. You will also receive notifications for new requests.',
  },
  {
    question: 'How do I upgrade or change my subscription plan?',
    answer: 'From the Account or Subscriber Suite screen, tap Subscription Plans. Review the available tiers, select the one that suits your business, and complete the checkout. Your new features will be activated once payment is confirmed.',
  },
  {
    question: 'How do I update my account details or password?',
    answer: 'Tap Account, then Account Settings or Change Password. You can edit your name, email, phone number, and marketing preferences. To change your password, use the Change Password option and follow the prompts.',
  },
  {
    question: 'What payment options are supported?',
    answer: 'Subscription plans can be paid securely through the app using supported payment methods. For client transactions, quote and booking payments are handled between you and the attendee unless the listing offers direct checkout.',
  },
  {
    question: 'How do I report a problem or get more help?',
    answer: 'Use the Report a Problem link in the footer, or tap Help Desk in the app footer to chat with our team via WhatsApp. You can also request a callback or browse these FAQs for quick answers.',
  },
  {
    question: 'Is my personal information secure?',
    answer: 'Yes. We follow privacy best practices and comply with POPIA. Your data is stored securely and only shared with listers when you send a quote request or booking. Read our Terms & Policies for full details.',
  },
];

export default function PortfolioAssistanceScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const isDesktop = useIsDesktop();
  const [showCallbackForm, setShowCallbackForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [formData, setFormData] = useState<CallbackFormData>({
    phoneNumber: '',
    preferredTime: '',
    assistanceType: ''
  });
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const route = useRoute<AssistanceRouteProp>();
  const isHelpCenter = route.params?.openFaqs ?? false;
  const [showFaqSection, setShowFaqSection] = useState(isHelpCenter);

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

  const cardSurface = isDesktop ? colors.surfaceContainerLowest : colors.surface;
  const cardBorder = isDesktop ? colors.outlineVariant : colors.borderSubtle;

  const renderHeader = () => (
    <View style={{ alignItems: isDesktop ? 'flex-start' : 'center', marginBottom: isDesktop ? spacing.lg : spacing.lg, paddingHorizontal: isDesktop ? 0 : spacing.lg, paddingTop: isDesktop ? 0 : spacing.sm }}>
      {isDesktop ? null : (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, alignSelf: 'flex-start' }}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
            {isHelpCenter ? 'Back' : 'Back to Subscriber Suite'}
          </Text>
        </TouchableOpacity>
      )}
      <View style={{
        width: isDesktop ? 64 : 80,
        height: isDesktop ? 64 : 80,
        borderRadius: isDesktop ? 32 : 40,
        backgroundColor: colors.textPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md
      }}>
        <MaterialIcons name="support-agent" size={isDesktop ? 32 : 40} color="#FFFFFF" />
      </View>
      <Text style={{ ...typography.displayMedium, color: colors.textPrimary, textAlign: isDesktop ? 'left' : 'center', fontSize: isDesktop ? 32 : undefined }}>
        {isHelpCenter ? 'Help Centre' : 'Portfolio Assistance'}
      </Text>
      <Text style={{ ...typography.body, color: isDesktop ? colors.onSurfaceVariant : colors.textMuted, textAlign: isDesktop ? 'left' : 'center', marginTop: spacing.sm, fontSize: isDesktop ? 16 : undefined, lineHeight: isDesktop ? 24 : undefined, maxWidth: isDesktop ? 600 : undefined }}>
        {isHelpCenter ? 'Browse common questions or contact our support team' : 'Get expert help to create and optimize your business portfolio'}
      </Text>
    </View>
  );

  const renderOfficeHours = () => (
    <View style={{
      marginHorizontal: isDesktop ? 0 : spacing.lg,
      marginBottom: spacing.lg,
      padding: spacing.md,
      backgroundColor: cardSurface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: cardBorder
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
        <MaterialIcons name="schedule" size={20} color={colors.textPrimary} />
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginLeft: spacing.sm, fontSize: isDesktop ? 20 : undefined }}>
          Office Hours & Response Times
        </Text>
      </View>
      <View style={{ gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="access-time" size={16} color={colors.textMuted} />
          <Text style={{ ...typography.caption, color: colors.textMuted, marginLeft: spacing.sm, fontSize: isDesktop ? 14 : undefined }}>
            Monday - Friday: 9:00 AM - 5:00 PM
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="access-time" size={16} color={colors.textMuted} />
          <Text style={{ ...typography.caption, color: colors.textMuted, marginLeft: spacing.sm, fontSize: isDesktop ? 14 : undefined }}>
            Saturday: 9:00 AM - 1:00 PM
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="access-time" size={16} color={colors.textMuted} />
          <Text style={{ ...typography.caption, color: colors.textMuted, marginLeft: spacing.sm, fontSize: isDesktop ? 14 : undefined }}>
            Response Time: Within 2 hours during business hours
          </Text>
        </View>
      </View>
    </View>
  );

  const renderAssistanceOptions = () => (
    <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, marginBottom: spacing.lg }}>
      <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md, fontSize: isDesktop ? 24 : undefined }}>
        How can we help you?
      </Text>
      <View style={{ gap: spacing.md, flexDirection: isDesktop ? 'row' as const : 'column' as const, flexWrap: isDesktop ? 'wrap' as const : 'nowrap' as const }}>
        {assistanceOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={option.action}
            style={{
              padding: spacing.lg,
              backgroundColor: cardSurface,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: cardBorder,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
              flex: isDesktop ? 1 : undefined,
              minWidth: isDesktop ? 220 : undefined,
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
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs, fontSize: isDesktop ? 18 : undefined }}>
                  {option.title}
                </Text>
                <Text style={{ ...typography.body, color: colors.textMuted, fontSize: isDesktop ? 14 : undefined }}>
                  {option.description}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFaqSection = () => (
    <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, marginBottom: spacing.lg, flex: isDesktop ? 1 : undefined }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, fontSize: isDesktop ? 24 : undefined }}>Frequently Asked Questions</Text>
        <TouchableOpacity onPress={() => setShowFaqSection(false)}>
          <MaterialIcons name="close" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <View style={{ gap: spacing.sm }}>
        {FAQS.map((faq, index) => {
          const isOpen = openFaqIndex === index;
          return (
            <View key={index} style={{ backgroundColor: cardSurface, borderRadius: radii.md, borderWidth: 1, borderColor: cardBorder }}>
              <TouchableOpacity
                onPress={() => setOpenFaqIndex(isOpen ? null : index)}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md }}
              >
                <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, flex: 1, fontSize: isDesktop ? 16 : undefined }}>{faq.question}</Text>
                <MaterialIcons name={isOpen ? 'expand-less' : 'expand-more'} size={20} color={colors.textMuted} />
              </TouchableOpacity>
              {isOpen && (
                <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}>
                  <Text style={{ ...typography.body, color: colors.textMuted, fontSize: isDesktop ? 14 : undefined, lineHeight: isDesktop ? 24 : undefined }}>{faq.answer}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView contentContainerStyle={isDesktop ? { paddingHorizontal: 48, paddingTop: spacing.sm, paddingBottom: spacing.xl, maxWidth: 1200, width: '100%', alignSelf: 'center' } : { paddingBottom: spacing.xl }}>
        {isDesktop ? (
          <>
            {renderHeader()}
            <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
              <View style={{ flex: 1, gap: spacing.gutter } as any}>
                {renderOfficeHours()}
                {renderAssistanceOptions()}
              </View>
              <View style={{ flex: 1, gap: spacing.gutter } as any}>
                {showFaqSection ? renderFaqSection() : (
                  <View style={{ backgroundColor: cardSurface, borderRadius: radii.lg, borderWidth: 1, borderColor: cardBorder, padding: spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="help-outline" size={40} color={colors.textMuted} />
                    <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }}>
                      Tap "FAQs" from the options to view common questions.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        ) : (
          <>
            {renderHeader()}
            {renderOfficeHours()}
            {renderAssistanceOptions()}
            {showFaqSection && renderFaqSection()}
          </>
        )}

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
                  <Text style={{ ...typography.bodySemiBold, color: colors.primaryForeground }}>
                    Request Callback
                  </Text>
                </TouchableOpacity>
              </View>
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
