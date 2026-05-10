# Vendor Application Form - Implementation Plan

**Date:** May 7, 2026  
**Goal:** Simplify the vendor application form by removing unnecessary fields and streamlining the submission flow.

---

## Overview of Changes

| Page | Changes Required |
|------|------------------|
| **Page 1** (ApplicationStep1Screen.tsx) | Remove LinkedIn field, remove website link from profile, remove banking details section, add bottom spacing |
| **Page 3** (ApplicationStep3Screen.tsx) | Remove Bank Confirmation Letter, remove Proof of Trading/Residence |
| **Page 4** (ApplicationStep4Screen.tsx) | Update packages to new format, add legal agreements, remove submit popup, navigate directly to portfolio on success |

---

## Page 1: ApplicationStep1Screen.tsx

### 1.1 Remove LinkedIn Field
**File:** `src/screens/subscriber/ApplicationStep1Screen.tsx`  
**Context:** The LinkedIn input field should be removed from the form.

**Current code to remove:**
```tsx
<View>
  <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
    LinkedIn Profile
  </Text>
  <TextInput
    placeholder="Enter LinkedIn profile URL"
    value={state.step1.linkedin}
    onChangeText={(value) => handleChange('linkedin', value)}
    style={{...}}
  />
</View>
```

**Also update:** `src/context/ApplicationFormContext.tsx` - Remove `linkedin: string;` from `Step1Data` interface.

---

### 1.2 Remove Website Field from Profile Display
**File:** `src/screens/subscriber/ApplicationStep1Screen.tsx`  
**Context:** The website link input should be removed so it doesn't show in the profile.

**Current code to remove:**
```tsx
<View>
  <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
    Website
  </Text>
  <TextInput
    placeholder="Enter your website URL"
    value={state.step1.website}
    onChangeText={(value) => handleChange('website', value)}
    style={{...}}
  />
</View>
```

**Also update:** `src/context/ApplicationFormContext.tsx` - Remove `website: string;` from `Step1Data` interface.

---

### 1.3 Remove Banking Details Section
**File:** `src/screens/subscriber/ApplicationStep1Screen.tsx`  
**Context:** Remove the entire banking details section (Account Holder Name, Bank, Branch, Branch Code, Account Number).

**Fields to remove from `Step1Data` in `ApplicationFormContext.tsx`:**
- `accountHolderName: string;`
- `bank: string;`
- `branch: string;`
- `branchCode: string;`
- `accountNumber: string;`

**UI section to remove from ApplicationStep1Screen.tsx:**
```tsx
{/* Banking Details Section */}
<View style={{ marginTop: spacing.lg, ... }}>
  <Text>Banking Details</Text>
  {/* Account Holder Name */}
  {/* Bank */}
  {/* Branch */}
  {/* Branch Code */}
  {/* Account Number */}
</View>
```

---

### 1.4 Add Space at Bottom of Page
**File:** `src/screens/subscriber/ApplicationStep1Screen.tsx`  
**Context:** Ensure there's adequate spacing at the bottom of the scroll view.

**Current code (line ~105):**
```tsx
<ScrollView
  ...
  contentContainerStyle={{ paddingBottom: spacing.xxl * 4 }}
>
```

**Update to increase bottom spacing:**
```tsx
<ScrollView
  ...
  contentContainerStyle={{ paddingBottom: spacing.xxl * 6 }} // Increase from 4 to 6
>
```

---

## Page 3: ApplicationStep3Screen.tsx

### 3.1 Remove Bank Confirmation Letter
**File:** `src/screens/subscriber/ApplicationStep3Screen.tsx`  
**Context:** Remove the Bank Confirmation Letter from required documents.

**Current code (around line 70-80):**
```tsx
const BUSINESS_DOCS: Array<{ key: DocKey; label: string; required: boolean; acceptLabel?: string }> = [
  { key: 'bank_confirmation', label: 'Bank Confirmation letter', required: true },  // REMOVE THIS
  { key: 'id_copy', label: 'ID copy', required: true },
  { key: 'cipro', label: 'CIPRO', required: false, acceptLabel: 'If applicable' },
  { key: 'proof_of_residence', label: 'Proof of trading address', required: true },  // ALSO REMOVE (see 3.2)
  { key: 'company_logo', label: 'Company Logo', required: true },
];
```

**Updated code:**
```tsx
const BUSINESS_DOCS: Array<{ key: DocKey; label: string; required: boolean; acceptLabel?: string }> = [
  { key: 'id_copy', label: 'ID copy', required: true },
  { key: 'cipro', label: 'CIPRO', required: false, acceptLabel: 'If applicable' },
  { key: 'company_logo', label: 'Company Logo', required: true },
];
```

**Also update the `DocKey` type (around line 65):**
```tsx
// Remove 'bank_confirmation' from the type
type RequiredDocKey = 'id_copy' | 'proof_of_residence' | 'company_logo';
// Update to:
type RequiredDocKey = 'id_copy' | 'company_logo';
```

---

### 3.2 Remove Proof of Trading/Residence
**File:** `src/screens/subscriber/ApplicationStep3Screen.tsx`  
**Context:** Remove "Proof of trading address" document requirement.

**Already handled in 3.1 above** - remove the `proof_of_residence` entry from `BUSINESS_DOCS` array.

**Also update the `RequiredDocKey` type:**
```tsx
// Remove 'proof_of_residence' from the type
type RequiredDocKey = 'id_copy' | 'company_logo';
```

---

## Page 4: ApplicationStep4Screen.tsx

### 4.1 Update Packages to New Format
**File:** `src/screens/subscriber/ApplicationStep4Screen.tsx`  
**Context:** The subscription packages need to be displayed in a new format. This likely requires:

1. **Check current package display format** - Review how tiers are currently rendered (look for the JSX that maps over `tiers`)
2. **Design new package card format** - May need to update the UI components that display subscription tiers
3. **Update data structure if needed** - The `tiers` state may need to be transformed for the new format

**Key areas to review (lines 100-250):**
- The `loadTiers()` function fetches subscription data
- The tier selection UI renders the packages
- May need to reference `subscription_plans_reference.md` for the new format

---

### 4.2 Add Legal Agreements Section
**File:** `src/screens/subscriber/ApplicationStep4Screen.tsx`  
**Context:** Add a section for legal agreements (Terms & Conditions, Privacy Policy) that users must accept before submitting.

**Current state already has:**
```tsx
export interface Step4Data {
  subscriptionPlan: string;
  billingPeriod: 'monthly' | 'yearly' | '6_month' | '12_month' | '';
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingConsent: boolean;
}
```

**Add UI section for legal agreements:**
```tsx
{/* Legal Agreements Section */}
<View style={{ marginTop: spacing.lg }}>
  <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
    Legal Agreements
  </Text>
  
  {/* Terms & Conditions */}
  <TouchableOpacity onPress={() => navigation.navigate('LegalDocument', { documentId: 'terms' })}>
    <Text>Read Terms & Conditions</Text>
  </TouchableOpacity>
  
  {/* Privacy Policy */}
  <TouchableOpacity onPress={() => navigation.navigate('LegalDocument', { documentId: 'privacy' })}>
    <Text>Read Privacy Policy</Text>
  </TouchableOpacity>
  
  {/* Checkboxes for acceptance */}
  <Checkbox
    value={state.step4.termsAccepted}
    onValueChange={(value) => updateStep4({ termsAccepted: value })}
    label="I accept the Terms & Conditions"
  />
  <Checkbox
    value={state.step4.privacyAccepted}
    onValueChange={(value) => updateStep4({ privacyAccepted: value })}
    label="I accept the Privacy Policy"
  />
</View>
```

---

### 4.3 Remove Submit Popup/Alert Dialog
**File:** `src/screens/subscriber/ApplicationStep4Screen.tsx`  
**Context:** Remove the `Alert.alert` popup that shows after submission, and navigate directly to the portfolio.

**Current code (around lines 310-340):**
```tsx
Alert.alert(
  'Application Submitted!',
  'Your application has been submitted successfully. We will review it and get back to you within 12 to 24 hours.',
  [
    {
      text: 'OK',
      onPress: () => {
        resetForm();
        navigation.reset({
          index: 0,
          routes: [{ name: 'ApplicationStatus' }],
        });
      },
    },
  ]
);
```

**Replace with direct navigation:**
```tsx
// Remove the Alert.alert dialog
resetForm();

// Navigate directly to the appropriate portfolio
if (state.portfolioType === 'venues') {
  navigation.reset({
    index: 0,
    routes: [{ name: 'UpdateVenuePortfolio' }],
  });
} else {
  navigation.reset({
    index: 0,
    routes: [{ name: 'UpdateVendorPortfolio' }],
  });
}
```

**Also remove the paid plan alert (around lines 280-300):**
```tsx
// REMOVE THIS ENTIRE BLOCK:
if (isPaidPlan) {
  Alert.alert(
    'Application Submitted!',
    'Your application has been submitted successfully. Please proceed to payment to complete your subscription.',
    [
      {
        text: 'Continue to Payment',
        onPress: () => { ... },
      },
    ]
  );
  return;
}
```

---

### 4.4 Remove Application Approval Status & Navigate Directly to Portfolio
**File:** `src/screens/subscriber/ApplicationStep4Screen.tsx`  
**Context:** On successful submission, skip the ApplicationStatus screen and go directly to the Lister Portfolio Management screen.

**Current flow:**
1. Submit → Show Alert → Navigate to `ApplicationStatus`

**New flow:**
1. Submit → Reset form → Navigate directly to `UpdateVendorPortfolio` or `UpdateVenuePortfolio`

**Code changes:**

```tsx
// In handleSubmit function, after successful submission:
if (result.success) {
  // ... existing code for venue listings, email sending, etc. ...

  // REMOVE: The Alert.alert dialog (see 4.3)
  
  // ADD: Direct navigation to portfolio
  resetForm();
  
  if (state.portfolioType === 'venues') {
    navigation.reset({
      index: 0,
      routes: [{ name: 'UpdateVenuePortfolio' }],
    });
  } else {
    navigation.reset({
      index: 0,
      routes: [{ name: 'UpdateVendorPortfolio' }],
    });
  }
}
```

**Also consider:** You may want to keep the `ApplicationStatusScreen.tsx` for users who want to check their application status later from their profile, but it should not be the destination after initial submission.

---

## Additional Files to Update

### ApplicationFormContext.tsx
**File:** `src/context/ApplicationFormContext.tsx`

**Remove from `Step1Data` interface:**
```tsx
export interface Step1Data {
  // ... keep existing fields ...
  // REMOVE:
  linkedin: string;
  website: string;
  accountHolderName: string;
  bank: string;
  branch: string;
  branchCode: string;
  accountNumber: string;
}
```

**Update initial state in the same file:**
```tsx
const initialState: ApplicationFormState = {
  // ...
  step1: {
    // ... keep existing ...
    // REMOVE these from initial state:
    // linkedin: '',
    // website: '',
    // accountHolderName: '',
    // bank: '',
    // branch: '',
    // branchCode: '',
    // accountNumber: '',
  },
  // ...
};
```

---

### formValidation.ts
**File:** `src/utils/formValidation.ts`

**Update `validateStep1` function** to remove validation for deleted fields:
- Remove validation for `linkedin`
- Remove validation for `website`
- Remove validation for banking fields (`accountHolderName`, `bank`, `branch`, `branchCode`, `accountNumber`)

---

## Summary of Files to Modify

| File Path | Changes |
|-----------|---------|
| `src/screens/subscriber/ApplicationStep1Screen.tsx` | Remove LinkedIn, Website, Banking Details; Add bottom spacing |
| `src/screens/subscriber/ApplicationStep3Screen.tsx` | Remove Bank Confirmation Letter, Proof of Trading |
| `src/screens/subscriber/ApplicationStep4Screen.tsx` | New package format, Legal agreements, Remove popup, Direct navigation |
| `src/context/ApplicationFormContext.tsx` | Remove deleted fields from Step1Data interface and initial state |
| `src/utils/formValidation.ts` | Remove validation rules for deleted fields |

---

## Testing Checklist

After implementing all changes, verify:

- [ ] Page 1: LinkedIn field is no longer visible
- [ ] Page 1: Website field is removed
- [ ] Page 1: Banking details section is completely removed
- [ ] Page 1: Bottom spacing is adequate for scrolling
- [ ] Page 3: Bank Confirmation Letter upload option is removed
- [ ] Page 3: Proof of Trading document is removed
- [ ] Page 4: Packages display in the new format
- [ ] Page 4: Legal agreements section is visible and functional
- [ ] Page 4: No popup/alert appears after submission
- [ ] Page 4: On success, user is taken directly to Lister Portfolio Management
- [ ] Form validation works correctly without the removed fields
- [ ] Form context properly initializes without the removed fields
- [ ] No console errors related to missing fields

---

## Notes

1. **Backup:** Create a backup or commit current state before making changes
2. **Incremental testing:** Test after each page's changes to catch issues early
3. **New package format:** The exact new format for packages (4.1) needs clarification - check `subscription_plans_reference.md` for details
4. **Legal documents:** Ensure the `LegalDocument` screen exists and has the correct document IDs for Terms & Conditions and Privacy Policy
5. **Portfolio navigation:** Verify that `UpdateVendorPortfolio` and `UpdateVenuePortfolio` routes exist in the navigation stack
