# New Features Implementation Plan - 26/01/2026

## Client Requirements Summary

Based on client feedback, the following features need to be implemented to improve the app and customer relationships:

### 1. **Helpdesk Manager & Portfolio Manager System**
- Add hovering button (chat-like) to access help content
- Implement dedicated Portfolio Manager for personalized support
- Portfolio Build Assistance - human tele-helpdesk for subscribers creating portfolios

### 2. **Photo Upload Limits by Subscription Tier**
- Free plan: 8 photos maximum
- Paid plans: 30 photos maximum
- Infrastructure capacity consideration

### 3. **Venue Tour Bookings**
- Click link named "Venue Tour Bookings"
- Opens WhatsApp chat directly with venue
- Auto-update to "Quote Requests" to track which venues user requested viewings with

### 4. **Customer Relationship Strategy**
- Functional role differences:
  - **Help Desk**: Non-human to human interaction, FAQs, self-help service with email/WhatsApp option to chat online
  - **Portfolio Assistant**: Helps subscribers build portfolios (forms, media uploads, professional wording, tagging prompts, etc.)
  - **Portfolio Manager**: Customer relationship manager - helps edit profiles, debug, attend to complaints/suggestions, upsell, propose targeted ad placement on app, troubleshoot privately and directly

---

## Implementation Plan by Screen/Feature

### **FEATURE 1: Floating Help Button System**

#### 1.1 Create Floating Help Button Component
**Location**: `src/components/FloatingHelpButton.tsx` (NEW FILE)

**Steps**:
1. Create a new component that renders a floating action button (FAB)
2. Position it at the bottom-right corner of the screen (above bottom navigation)
3. Use Material Icons `help` or `chat` icon
4. Add bounce/pulse animation to draw attention
5. Style with primary teal color to match brand
6. Z-index should be above most content but below modals

**Technical Details**:
```tsx
- Position: absolute, bottom: 100px, right: 20px
- Size: 56x56 circle
- Shadow elevation for prominence
- AnimatedValue for pulse effect
- TouchableOpacity for interaction
```

#### 1.2 Create Help Modal Component
**Location**: `src/components/HelpModal.tsx` (NEW FILE)

**Steps**:
1. Create modal with tabs:
   - **Help Center** - FAQ categories
   - **Contact Support** - Email/WhatsApp options
   - **Portfolio Manager** (only for subscribers)
2. Include search functionality for FAQs
3. Add quick action buttons for common tasks
4. WhatsApp deep link: `whatsapp://send?phone=PHONE_NUMBER&text=Hello, I need help with...`
5. Email link: `mailto:support@funcxon.com`

**Screens to Display FAB**:
- `AttendeeHomeScreen.tsx`
- `VendorProfileScreen.tsx`
- `QuotesScreen.tsx`
- `DiscoverScreen.tsx`
- `FavouritesScreen.tsx`
- `SubscriberSuiteScreen.tsx`
- All subscriber portfolio screens

#### 1.3 Create Portfolio Manager Contact Screen
**Location**: `src/screens/PortfolioManagerScreen.tsx` (NEW FILE)

**Steps**:
1. Only accessible to subscribers with active portfolios
2. Display assigned manager's details:
   - Name
   - Photo
   - Available hours
   - Response time
3. Contact options:
   - Call directly (tel: link)
   - WhatsApp direct message
   - Schedule callback
   - Email
4. Display recent interaction history
5. Quick actions:
   - Request profile edit assistance
   - Report bug
   - Suggest feature
   - Request ad placement consultation

**Database Requirements**:
- `portfolio_managers` table
- `manager_assignments` table (links subscribers to managers)
- `support_tickets` table

---

### **FEATURE 2: Photo Upload Limits by Subscription**

#### 2.1 Update Vendor/Portfolio Schema
**Location**: Database migration needed

**Steps**:
1. Verify `subscription_tier` field exists in `vendors` table
2. Add enum values if needed: `free`, `basic`, `premium`, `enterprise`
3. Add `photo_limit` field or use conditional logic based on tier
4. Add `photo_count` field to track current uploads

**Database Changes**:
```sql
-- Add to vendors table if not exists
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS photo_count INTEGER DEFAULT 0;

-- Create subscription tiers reference
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id SERIAL PRIMARY KEY,
  tier_name VARCHAR(20) UNIQUE NOT NULL,
  photo_limit INTEGER NOT NULL,
  price_monthly DECIMAL(10,2),
  features JSONB
);

INSERT INTO subscription_tiers (tier_name, photo_limit, price_monthly, features) VALUES
('free', 8, 0, '{"basic_listing": true, "priority_support": false}'),
('basic', 30, 99.00, '{"priority_listing": true, "analytics": true}'),
('premium', 30, 199.00, '{"featured_listing": true, "advanced_analytics": true, "dedicated_manager": true}'),
('enterprise', 50, 499.00, '{"custom_features": true, "api_access": true, "dedicated_manager": true}');
```

#### 2.2 Update Image Upload Components
**Locations**:
- `src/screens/subscriber/ApplicationStep2Screen.tsx`
- `src/screens/subscriber/ApplicationStep3Screen.tsx`
- Any portfolio editing screens

**Steps**:
1. Fetch user's subscription tier when screen loads
2. Calculate remaining photo slots: `limit - current_count`
3. Display photo counter: "X of Y photos used"
4. Disable upload button when limit reached
5. Show upgrade prompt when limit reached
6. Validate on backend before saving

**UI Changes**:
```tsx
// Add photo counter display
<View style={styles.photoCounter}>
  <MaterialIcons name="photo-library" size={16} color={colors.textMuted} />
  <Text>{photoCount} of {photoLimit} photos used</Text>
</View>

// Show upgrade prompt
{photoCount >= photoLimit && (
  <TouchableOpacity style={styles.upgradePrompt} onPress={handleUpgradePress}>
    <Text>Upgrade to add up to 30 photos</Text>
    <MaterialIcons name="arrow-forward" size={16} />
  </TouchableOpacity>
)}
```

#### 2.3 Create Subscription Management Screen
**Location**: `src/screens/SubscriptionPlansScreen.tsx` (NEW FILE)

**Steps**:
1. Display subscription tier comparison table
2. Show features for each tier:
   - Photo limits
   - Priority support
   - Dedicated manager
   - Analytics access
   - Featured placement
3. "Current Plan" indicator
4. "Upgrade" / "Downgrade" buttons
5. Link to payment processing
6. Show next billing date for paid plans

**Navigation**:
- Add to `SubscriberSuiteScreen.tsx` menu
- Add to `AccountScreen.tsx` under "Listings Subscription Offers"

---

### **FEATURE 3: Venue Tour Bookings with WhatsApp Integration**

#### 3.1 Add "Book Venue Tour" Button to Vendor Profile
**Location**: `src/screens/VendorProfileScreen.tsx`

**Steps**:
1. Add new button in Contact section (around line 613-662)
2. Place button prominently above or next to WhatsApp contact
3. Button text: "Book Venue Tour"
4. Icon: MaterialIcons `event-available` or `tour`
5. On click: 
   - Check if venue has WhatsApp number
   - Pre-fill message: "Hi, I'd like to book a tour of [VENUE_NAME]. Are you available?"
   - Open WhatsApp with deep link
   - Create entry in quote_requests with status: "tour_requested"

**Code Location** (after line 642):
```tsx
{whatsappUrl && vendor.venue_capacity && (
  <TouchableOpacity
    onPress={handleBookTour}
    style={{
      backgroundColor: '#0891B2', // Cyan color for distinction
      paddingVertical: spacing.md,
      borderRadius: radii.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
    }}
  >
    <MaterialIcons name="event-available" size={18} color="#FFFFFF" />
    <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: spacing.sm }}>
      Book Venue Tour
    </Text>
  </TouchableOpacity>
)}
```

#### 3.2 Create Tour Request Handler
**Location**: `src/screens/VendorProfileScreen.tsx` (add function)

**Steps**:
1. Create `handleBookTour` function
2. Check user authentication
3. Create quote_request with type: "tour_request"
4. Open WhatsApp with pre-filled message
5. Show confirmation alert

**Function Implementation**:
```tsx
const handleBookTour = async () => {
  if (!user?.id) {
    Alert.alert('Sign in required', 'Please sign in to book a venue tour.');
    return;
  }

  try {
    // Get or create internal user
    const { data: userRows } = await supabase
      .from('users')
      .select('id, email')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    let internalUser = userRows;
    
    if (!internalUser) {
      const email = user.email ?? 'user@funcxon.com';
      const { data: createdUser } = await supabase
        .from('users')
        .insert({
          auth_user_id: user.id,
          username: email.split('@')[0],
          password: 'demo',
          email,
          full_name: email.split('@')[0],
        })
        .select('id, email')
        .single();
      internalUser = createdUser;
    }

    if (!internalUser) return;

    // Create tour request entry
    await supabase
      .from('quote_requests')
      .insert({
        user_id: internalUser.id,
        vendor_id: vendor.id,
        name: vendor.name,
        email: internalUser.email,
        status: 'tour_requested',
        event_type: 'Venue Tour',
        details: `Venue tour request for ${vendor.name}`,
      });

    // Open WhatsApp
    const message = encodeURIComponent(
      `Hi, I'd like to book a tour of ${vendor.name}. Are you available?`
    );
    const whatsappLink = `${whatsappUrl}?text=${message}`;
    
    await Linking.openURL(whatsappLink);
    
    Alert.alert(
      'Tour Request Sent',
      'Your tour request has been logged. The venue will respond via WhatsApp.',
      [{ text: 'View My Requests', onPress: () => navigation.navigate('Quotes') }]
    );
  } catch (error) {
    Alert.alert('Error', 'Unable to create tour request. Please try again.');
  }
};
```

#### 3.3 Update Quote Requests to Show Tour Bookings
**Location**: `src/screens/QuotesScreen.tsx`

**Steps**:
1. Add filter tab for "Tour Requests"
2. Update `activeTab` state to include 'tour_requested'
3. Display tour requests with special icon/badge
4. Add status indicator showing:
   - Pending response
   - Tour scheduled
   - Tour completed
5. Link to vendor profile from tour request

**Updates**:
```tsx
// Line 42 - Update state type
const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'finalised' | 'tours'>('all');

// Line 164 - Update filter logic
const filtered = useMemo(() => {
  if (!data) return [];
  if (activeTab === 'all') return data;
  if (activeTab === 'tours') return data.filter(item => item.status === 'tour_requested');
  return data.filter((item) => item.status === activeTab);
}, [data, activeTab]);

// Add to tab list (around line 414)
{ key: 'tours' as const, label: `Tours (${data?.filter(i => i.status === 'tour_requested').length ?? 0})` }
```

#### 3.4 Update Quote Request Detail Screen
**Location**: `src/screens/QuoteDetailScreen.tsx`

**Steps**:
1. Check if quote is a tour request
2. Show specialized UI for tour requests:
   - Venue details
   - Tour status timeline
   - Contact venue button (WhatsApp)
   - Cancel tour button
   - Mark as completed button
3. Add notes field for tour feedback

---

### **FEATURE 4: Portfolio Build Assistance System**

#### 4.1 Create Portfolio Assistant Screen
**Location**: `src/screens/PortfolioAssistantScreen.tsx` (NEW FILE)

**Steps**:
1. Display introduction to portfolio assistance service
2. Show available assistance options:
   - **Live Chat** - Real-time help via WhatsApp
   - **Schedule Call** - Book 15-30 min consultation
   - **Video Tutorial** - Walkthrough guides
   - **FAQs** - Common portfolio questions
3. Request callback form:
   - Phone number
   - Preferred time
   - Assistance needed (dropdown)
4. Show office hours and expected response time
5. Link from `SubscriberSuiteScreen.tsx`

**Assistance Categories**:
- Help completing application forms
- Uploading and optimizing photos
- Professional bio writing
- Choosing correct tags/categories
- Setting pricing and packages
- Understanding analytics
- Marketing strategy

#### 4.2 Integrate Help Throughout Portfolio Creation
**Locations**:
- `src/screens/subscriber/ApplicationStep1Screen.tsx`
- `src/screens/subscriber/ApplicationStep2Screen.tsx`
- `src/screens/subscriber/ApplicationStep3Screen.tsx`
- `src/screens/subscriber/ApplicationStep4Screen.tsx`

**Steps for Each Screen**:
1. Add "Need Help?" button at top-right of header
2. On click, show contextual help for current step
3. Provide tooltips for complex fields
4. Add example content/templates
5. "Request Assistance" button that opens Portfolio Assistant

**UI Component**:
```tsx
// Add to each application step screen
<View style={styles.helpSection}>
  <TouchableOpacity 
    style={styles.helpButton}
    onPress={() => navigation.navigate('PortfolioAssistant', { 
      context: 'step1_business_info' 
    })}
  >
    <MaterialIcons name="help-outline" size={20} color={colors.primaryTeal} />
    <Text style={styles.helpText}>Need Help?</Text>
  </TouchableOpacity>
</View>
```

#### 4.3 Add In-App Messaging for Support
**Location**: `src/screens/SupportChatScreen.tsx` (NEW FILE)

**Steps**:
1. Create chat interface for subscriber support
2. Connect to backend messaging system or WhatsApp Business API
3. Show chat history
4. File attachment support (for screenshots)
5. Real-time notifications for new messages
6. Auto-save drafts
7. Show support agent availability status

**Navigation Setup**:
- Add to navigation stack in `ProfileNavigator.tsx`
- Add quick access from FloatingHelpButton
- Add to PortfolioAssistantScreen

---

## Database Schema Changes Required

### New Tables

#### 1. `subscription_tiers` table
```sql
CREATE TABLE subscription_tiers (
  id SERIAL PRIMARY KEY,
  tier_name VARCHAR(20) UNIQUE NOT NULL,
  photo_limit INTEGER NOT NULL,
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `portfolio_managers` table
```sql
CREATE TABLE portfolio_managers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  whatsapp_number VARCHAR(20),
  photo_url TEXT,
  specialization VARCHAR(100),
  available_hours VARCHAR(100),
  avg_response_time INTEGER, -- in minutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. `manager_assignments` table
```sql
CREATE TABLE manager_assignments (
  id SERIAL PRIMARY KEY,
  subscriber_id INTEGER REFERENCES users(id),
  manager_id INTEGER REFERENCES portfolio_managers(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, transferred
  UNIQUE(subscriber_id, manager_id)
);
```

#### 4. `support_tickets` table
```sql
CREATE TABLE support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  manager_id INTEGER REFERENCES portfolio_managers(id),
  ticket_type VARCHAR(50) NOT NULL, -- helpdesk, portfolio_assistance, portfolio_manager
  subject VARCHAR(255),
  description TEXT,
  status VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved, closed
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

#### 5. `support_messages` table
```sql
CREATE TABLE support_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES support_tickets(id),
  sender_id INTEGER REFERENCES users(id),
  message_text TEXT NOT NULL,
  attachment_url TEXT,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. `tour_requests` table (or extend quote_requests)
```sql
-- Add new status values to quote_requests
ALTER TABLE quote_requests 
  ADD COLUMN tour_date TIMESTAMP,
  ADD COLUMN tour_status VARCHAR(20), -- requested, scheduled, completed, cancelled
  ADD COLUMN tour_notes TEXT;

-- Or create separate table
CREATE TABLE tour_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  vendor_id INTEGER REFERENCES vendors(id),
  requested_date TIMESTAMP DEFAULT NOW(),
  preferred_date TIMESTAMP,
  tour_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'requested',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Modify Existing Tables

#### Update `vendors` table
```sql
-- Add if not exists
ALTER TABLE vendors 
  ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS photo_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Update existing records
UPDATE vendors SET subscription_tier = 'free' WHERE subscription_tier IS NULL;
```

#### Update `quote_requests` table
```sql
-- Add tour-related fields
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS request_type VARCHAR(20) DEFAULT 'quote', -- quote, tour, general
  ADD COLUMN IF NOT EXISTS tour_scheduled_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS tour_notes TEXT;
```

---

## UI/UX Considerations

### Design Guidelines

#### 1. Floating Help Button
- **Color**: Primary Teal (#0D9488)
- **Size**: 56x56px circle
- **Position**: Fixed bottom-right, 20px from edge, 100px from bottom
- **Shadow**: elevation 8
- **Animation**: Subtle pulse every 3 seconds
- **Icon**: MaterialIcons "support-agent" or "chat-bubble-outline"

#### 2. Help Modal
- **Style**: Bottom sheet on mobile, centered modal on tablet
- **Max Height**: 70% of screen
- **Tabs**: Material Design top tabs
- **Colors**: Match existing theme
- **Search**: Debounced search with clear icon
- **Links**: Primary teal for all actionable items

#### 3. Tour Booking Button
- **Color**: Cyan (#0891B2) to differentiate from WhatsApp green
- **Icon**: event-available
- **Position**: In contact section, between email and website buttons
- **Feedback**: Toast message on success + navigation prompt

#### 4. Subscription Upgrade Prompts
- **Style**: Subtle gradient card
- **Colors**: Premium gold/purple gradient
- **CTA**: Clear "Upgrade Now" button
- **Placement**: Non-intrusive, dismissible
- **Frequency**: Max once per session

#### 5. Photo Counter
- **Position**: Above image upload area
- **Format**: "X of Y photos used" with icon
- **Warning**: Yellow color when 80% full, red when at limit
- **Progress**: Optional progress bar

---

## Implementation Priority & Timeline

### Phase 1: Core Infrastructure (Week 1-2)
1. ✅ Database schema updates
2. ✅ Subscription tier logic
3. ✅ Photo upload limits
4. ✅ Backend API endpoints

### Phase 2: User-Facing Features (Week 2-3)
1. ✅ Floating help button component
2. ✅ Help modal with FAQs
3. ✅ Venue tour booking integration
4. ✅ Quote requests tour tracking
5. ✅ Subscription plans screen

### Phase 3: Support System (Week 3-4)
1. ✅ Portfolio manager system
2. ✅ Support ticket system
3. ✅ In-app messaging
4. ✅ Portfolio assistance screens

### Phase 4: Polish & Testing (Week 4-5)
1. ✅ UI/UX refinements
2. ✅ Integration testing
3. ✅ Load testing for photo limits
4. ✅ WhatsApp deep link testing
5. ✅ User acceptance testing

---

## Testing Checklist

### Feature 1: Floating Help Button
- [ ] Button appears on all designated screens
- [ ] Button doesn't overlap with navigation
- [ ] Animation is smooth and not distracting
- [ ] Modal opens correctly on all devices
- [ ] FAQ search works correctly
- [ ] WhatsApp links open properly
- [ ] Email links work on all platforms

### Feature 2: Photo Upload Limits
- [ ] Correct limits enforced for each tier
- [ ] Counter updates in real-time
- [ ] Upload disabled at limit
- [ ] Upgrade prompt appears correctly
- [ ] Backend validation works
- [ ] Error messages are clear
- [ ] Photo deletion decrements counter

### Feature 3: Venue Tour Bookings
- [ ] Button only shows for venues with WhatsApp
- [ ] WhatsApp opens with correct pre-filled message
- [ ] Quote request created successfully
- [ ] Tour status tracked correctly
- [ ] Shows in quotes screen properly
- [ ] User can view tour history
- [ ] Notifications work for tour updates

### Feature 4: Portfolio Assistance
- [ ] Assistance screens accessible to subscribers only
- [ ] Contact methods work correctly
- [ ] Contextual help displays properly
- [ ] Support tickets created successfully
- [ ] Manager assignments work
- [ ] Chat interface functional
- [ ] File uploads work in chat

---

## API Endpoints Needed

### Subscription Management
```
GET    /api/subscription-tiers
GET    /api/user/subscription
POST   /api/subscription/upgrade
POST   /api/subscription/downgrade
GET    /api/subscription/invoice-history
```

### Support System
```
GET    /api/support/faqs
POST   /api/support/ticket
GET    /api/support/tickets/:userId
PATCH  /api/support/ticket/:ticketId
GET    /api/support/managers
GET    /api/support/manager/:userId
POST   /api/support/message
GET    /api/support/messages/:ticketId
```

### Tour Bookings
```
POST   /api/tour-request
GET    /api/tour-requests/:userId
PATCH  /api/tour-request/:id
DELETE /api/tour-request/:id
```

### Photo Management
```
GET    /api/vendor/:id/photo-limit
GET    /api/vendor/:id/photo-count
POST   /api/vendor/:id/upload-photo
DELETE /api/vendor/:id/photo/:photoId
```

---

## Configuration & Environment Variables

Add to `.env`:
```
# Support Settings
SUPPORT_EMAIL=support@funcxon.com
SUPPORT_WHATSAPP=+27XXXXXXXXX
SUPPORT_HOURS=Mon-Fri 9AM-5PM SAST

# Subscription Settings
STRIPE_PUBLIC_KEY=pk_xxxxx
STRIPE_SECRET_KEY=sk_xxxxx
FREE_TIER_PHOTO_LIMIT=8
PAID_TIER_PHOTO_LIMIT=30

# WhatsApp Business API (if using)
WHATSAPP_API_KEY=xxxxx
WHATSAPP_API_URL=https://api.whatsapp.com/v1
```

---

## Documentation Updates Required

### User Documentation
1. **Help Center Articles**:
   - How to book a venue tour
   - Understanding subscription tiers
   - Photo upload guidelines
   - How to contact portfolio manager
   - Portfolio assistance service guide

2. **Video Tutorials**:
   - Creating your first portfolio
   - Optimizing your listing photos
   - Using the help system
   - Booking venue tours

### Developer Documentation
1. Update API documentation
2. Document new database tables
3. Component usage examples
4. WhatsApp integration guide
5. Subscription tier logic flow

---

## Notes & Considerations

### Technical Considerations
1. **WhatsApp Deep Links**: May not work on all devices/platforms, need fallback
2. **Photo Storage**: Ensure S3/storage bucket has capacity for increased uploads
3. **Real-time Chat**: Consider using WebSocket or polling for messages
4. **Subscription Billing**: Integrate with Stripe or local payment gateway
5. **Manager Assignment**: Auto-assign based on workload or manual assignment?

### Business Considerations
1. **Support Staffing**: Ensure sufficient portfolio managers hired before launch
2. **Response Time SLAs**: Define expected response times for each tier
3. **Pricing Strategy**: Validate subscription pricing matches market
4. **Tour Liability**: Terms of service for venue tours
5. **Manager Training**: Ensure managers trained on portfolio assistance

### Future Enhancements
1. AI-powered FAQ chatbot
2. Video call support for portfolio assistance
3. Portfolio templates marketplace
4. Analytics dashboard for managers
5. Automated tour scheduling system
6. Photo editing tools in-app
7. Bulk photo upload for paid tiers
8. Portfolio health score

---

## Success Metrics

### Key Performance Indicators
1. **Help System Usage**:
   - % of users clicking help button
   - Most searched FAQ topics
   - Support ticket resolution time

2. **Tour Bookings**:
   - Number of tour requests per week
   - Tour conversion rate (request → completed)
   - Tours leading to bookings

3. **Subscription Upgrades**:
   - Free → Paid conversion rate
   - Upgrade prompts click-through rate
   - Revenue from subscriptions

4. **Portfolio Assistance**:
   - Portfolio completion rate with/without assistance
   - User satisfaction scores
   - Time to complete portfolio setup

---

## Risks & Mitigation

### Risk 1: WhatsApp Integration Failure
**Impact**: High - Core feature unusable
**Mitigation**: 
- Implement fallback to regular messaging
- Test on multiple devices/platforms
- Provide alternative contact methods

### Risk 2: Support Overwhelm
**Impact**: Medium - Poor user experience
**Mitigation**:
- Comprehensive FAQ section to reduce tickets
- Automated responses for common queries
- Gradual feature rollout

### Risk 3: Photo Storage Costs
**Impact**: Medium - Budget overrun
**Mitigation**:
- Implement image compression
- Set reasonable limits
- Monitor usage closely
- Consider CDN for serving images

### Risk 4: Subscription Tier Confusion
**Impact**: Low - User frustration
**Mitigation**:
- Clear tier comparison UI
- In-app education about benefits
- Trial period for paid tiers

---

## Appendix

### Reference Materials
- WhatsApp Business API Documentation
- Material Design Guidelines
- React Native Best Practices
- Supabase Documentation

### Contact Information
- **Project Manager**: [Name]
- **Lead Developer**: [Name]
- **Support Team Lead**: [Name]
- **Product Owner**: [Name]

---

**Document Version**: 1.0
**Created**: 26 January 2026
**Last Updated**: 26 January 2026
**Status**: Draft - Awaiting Approval
