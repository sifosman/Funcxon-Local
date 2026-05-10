# Vendor Application Form - Changes Summary

**Date:** May 7, 2026  
**Status:** Completed

---

## Changes Made

### Page 1 (ApplicationStep1Screen.tsx)
1. **Removed LinkedIn field** - Deleted the entire LinkedIn input section and removed `linkedin` from the `handleChange` function's `isVenueLinksField` check.

2. **Removed Website field** - Deleted the entire Website URL input section from the Business Information card.

3. **Removed Banking Details section** - Deleted the entire "Bank Account Details" card including:
   - Account Holder Name
   - Bank
   - Branch
   - Branch Code
   - Account Number

4. **Increased bottom spacing** - Changed `paddingBottom` from `spacing.xxl * 4` to `spacing.xxl * 6` in the ScrollView's `contentContainerStyle`.

---

### Page 3 (ApplicationStep3Screen.tsx)
1. **Removed Bank Confirmation Letter** - Removed `{ key: 'bank_confirmation', label: 'Bank Confirmation letter', required: true }` from the `BUSINESS_DOCS` array.

2. **Removed Proof of Trading/Residence** - Removed `{ key: 'proof_of_residence', label: 'Proof of trading address', required: true }` from the `BUSINESS_DOCS` array.

3. **Updated TypeScript types** - Removed `'bank_confirmation'` and `'proof_of_residence'` from the `RequiredDocKey` type.

---

### Page 4 (ApplicationStep4Screen.tsx)
1. **Removed submit popup/alert dialog** - Deleted the `Alert.alert` dialog that showed after submission.

2. **Removed "Continue to Payment" popup** - Deleted the alert that prompted paid plan users to proceed to payment.

3. **Direct navigation to portfolio** - On successful submission, the form now:
   - Resets the form
   - Navigates directly to `UpdateVenuePortfolio` (for venues) or `UpdateVendorPortfolio` (for vendors)
   - No longer shows the `ApplicationStatus` screen

4. **Legal Agreements section** - Already exists in the UI with checkboxes for Terms & Conditions and Privacy Policy.

---

### ApplicationFormContext.tsx
1. **Updated Step1Data interface** - Removed the following fields:
   - `linkedin: string;`
   - `website: string;`
   - `accountHolderName: string;`
   - `bank: string;`
   - `branch: string;`
   - `branchCode: string;`
   - `accountNumber: string;`

2. **Updated initialState** - Removed the same fields from the initial state object.

---

### formValidation.ts
1. **Updated validateStep1 function** - Removed the validation check for `website` field:
   ```typescript
   // REMOVED:
   if (data.website && !validateURL(data.website)) {
     errors.website = 'Invalid website URL';
   }
   ```

---

### ApplicationStatusScreen.tsx
1. **Updated hydrateForm function** - Removed references to deleted fields when hydrating form state from application data:
   - `linkedin`
   - `website`
   - `accountHolderName`
   - `bank`
   - `branch`
   - `branchCode`
   - `accountNumber`

---

## Files Modified

| File | Changes |
|------|----------|
| `src/screens/subscriber/ApplicationStep1Screen.tsx` | Removed LinkedIn, Website, Banking Details; Increased bottom spacing |
| `src/screens/subscriber/ApplicationStep3Screen.tsx` | Removed Bank Confirmation Letter and Proof of Trading from documents |
| `src/screens/subscriber/ApplicationStep4Screen.tsx` | Removed submit popups; Direct navigation to portfolio |
| `src/context/ApplicationFormContext.tsx` | Removed deleted fields from Step1Data interface and initial state |
| `src/utils/formValidation.ts` | Removed validation for deleted website field |
| `src/screens/subscriber/ApplicationStatusScreen.tsx` | Removed deleted fields from form hydration |

---

## Testing Checklist

- [x] Page 1: LinkedIn field is no longer visible
- [x] Page 1: Website field is removed
- [x] Page 1: Banking details section is completely removed
- [x] Page 1: Bottom spacing is increased for better scrolling
- [x] Page 3: Bank Confirmation Letter upload option is removed
- [x] Page 3: Proof of Trading document is removed
- [x] Page 4: No popup/alert appears after submission
- [x] Page 4: On success, user is taken directly to Lister Portfolio Management
- [x] Form validation works correctly without the removed fields
- [x] Form context properly initializes without the removed fields
- [x] No console errors related to missing fields
- [x] TypeScript compilation passes with no errors

---

## Notes

1. The Legal Agreements section (Terms & Conditions and Privacy Policy checkboxes) already existed in Page 4 - no changes needed.

2. The `linkedin_url` and `website_url` fields in `UpdateVenuePortfolioScreen.tsx` and profile screens are **different fields** - they are for displaying social media links on live venue/vendor profiles, not part of the application form. These were NOT removed.

3. The venue subscription plans ("Get Started", "Monthly", "6-Month", "12-Month") and vendor packages ("Get Started", "Premium", "Premium Plus") display format was not changed as part of this task. The current format appears to match the `subscription_plans_reference.md` document.

4. All changes have been verified to compile without TypeScript errors.
