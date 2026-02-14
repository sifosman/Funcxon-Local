import { Step1Data, Step2Data, Step3Data, Step4Data } from '../context/ApplicationFormContext';

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}

export function validateURL(url: string): boolean {
  if (!url) return true;
  try {
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return urlPattern.test(url);
  } catch {
    return false;
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateStep1(data: Step1Data): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.registeredBusinessName.trim()) {
    errors.registeredBusinessName = 'Registered business name is required';
  }

  if (!data.ownersName.trim()) {
    errors.ownersName = "Owner's name is required";
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Invalid email format';
  }

  if (data.alternateEmail && !validateEmail(data.alternateEmail)) {
    errors.alternateEmail = 'Invalid email format';
  }

  if (!data.contactPhoneNumber.trim()) {
    errors.contactPhoneNumber = 'Contact phone number is required';
  } else if (!validatePhone(data.contactPhoneNumber)) {
    errors.contactPhoneNumber = 'Invalid phone number format';
  }

  if (data.alternatePhone1 && !validatePhone(data.alternatePhone1)) {
    errors.alternatePhone1 = 'Invalid phone number format';
  }

  if (data.alternatePhone2 && !validatePhone(data.alternatePhone2)) {
    errors.alternatePhone2 = 'Invalid phone number format';
  }

  if (data.website && !validateURL(data.website)) {
    errors.website = 'Invalid website URL';
  }

  if (data.userEmail && !validateEmail(data.userEmail)) {
    errors.userEmail = 'Invalid email format';
  }

  if (data.userWhatsapp && !validatePhone(data.userWhatsapp)) {
    errors.userWhatsapp = 'Invalid phone number format';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStep2(data: Step2Data, portfolioType: 'vendors' | 'venues' | null): ValidationResult {
  const errors: Record<string, string> = {};

  if (portfolioType === 'venues') {
    if (!data.venueType) {
      errors.venueType = 'Venue type is required';
    }
    if (!data.venueCapacity) {
      errors.venueCapacity = 'Venue capacity is required';
    }
    if (data.eventTypes.length === 0) {
      errors.eventTypes = 'Please select at least one event type';
    }
  } else if (portfolioType === 'vendors') {
    if (data.serviceCategories.length === 0) {
      errors.serviceCategories = 'Please select at least one service category';
    }
  }

  if (data.provinces.length === 0) {
    errors.provinces = 'Please select at least one coverage area';
  }

  if (!data.description.trim()) {
    errors.description = 'Venue bio is required';
  } else if (data.description.trim().length < 50) {
    errors.description = 'Description must be at least 50 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStep3(data: Step3Data): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.images.length === 0) {
    errors.images = 'Please upload at least one image';
  }

  const hasDoc = (prefix: string) =>
    data.documents.some((d) => typeof d.name === 'string' && d.name.startsWith(`${prefix}__`));

  if (!hasDoc('bank_confirmation')) {
    errors.bankConfirmation = 'Bank confirmation letter is required';
  }

  if (!hasDoc('id_copy')) {
    errors.idCopy = 'ID copy is required';
  }

  if (!hasDoc('proof_of_residence')) {
    errors.proofOfResidence = 'Proof of trading address is required';
  }

  if (!hasDoc('company_logo')) {
    errors.companyLogo = 'Company logo is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateStep4(data: Step4Data): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.subscriptionPlan) {
    errors.subscriptionPlan = 'Please select a subscription plan';
  }

  if (!data.termsAccepted) {
    errors.termsAccepted = 'You must accept the terms and conditions';
  }

  if (!data.privacyAccepted) {
    errors.privacyAccepted = 'You must accept the privacy policy';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
