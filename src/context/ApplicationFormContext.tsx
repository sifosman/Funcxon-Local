import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PortfolioType = 'vendors' | 'venues' | null;

export interface Step1Data {
  registeredBusinessName: string;
  tradingName: string;
  funcxonUserName: string;
  userWhatsapp: string;
  userEmail: string;
  ownersName: string;
  companyRegNumber: string;
  vatNumber: string;
  businessPhysicalAddress: string;
  billingAddress: string;
  contactPhoneNumber: string;
  alternatePhone1: string;
  alternatePhone2: string;
  email: string;
  alternateEmail: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  linkedin: string;
  website: string;
  accountHolderName: string;
  bank: string;
  branch: string;
  branchCode: string;
  accountNumber: string;
}

export interface Step2Data {
  venueType?: string;
  venueCapacity?: string;
  amenities: string[];
  eventTypes: string[];
  serviceCategories: string[];
  serviceSubcategories: string[];
  provinces: string[];
  cities: string[];
  specialFeatures: string[];
  description: string;
}

export interface Step3Data {
  documents: Array<{
    uri: string;
    name: string;
    type: string;
    size: number;
  }>;
  images: Array<{
    uri: string;
    name: string;
    type: string;
  }>;
  videos: Array<{
    uri: string;
    name: string;
    type: string;
  }>;
}

export interface Step4Data {
  subscriptionPlan: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingConsent: boolean;
}

export interface ApplicationFormState {
  portfolioType: PortfolioType;
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
}

type ApplicationFormAction =
  | { type: 'SET_PORTFOLIO_TYPE'; payload: PortfolioType }
  | { type: 'UPDATE_STEP1'; payload: Partial<Step1Data> }
  | { type: 'UPDATE_STEP2'; payload: Partial<Step2Data> }
  | { type: 'UPDATE_STEP3'; payload: Partial<Step3Data> }
  | { type: 'UPDATE_STEP4'; payload: Partial<Step4Data> }
  | { type: 'LOAD_DRAFT'; payload: ApplicationFormState }
  | { type: 'RESET_FORM' };

const initialState: ApplicationFormState = {
  portfolioType: null,
  step1: {
    registeredBusinessName: '',
    tradingName: '',
    funcxonUserName: '',
    userWhatsapp: '',
    userEmail: '',
    ownersName: '',
    companyRegNumber: '',
    vatNumber: '',
    businessPhysicalAddress: '',
    billingAddress: '',
    contactPhoneNumber: '',
    alternatePhone1: '',
    alternatePhone2: '',
    email: '',
    alternateEmail: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    linkedin: '',
    website: '',
    accountHolderName: '',
    bank: '',
    branch: '',
    branchCode: '',
    accountNumber: '',
  },
  step2: {
    amenities: [],
    eventTypes: [],
    serviceCategories: [],
    serviceSubcategories: [],
    provinces: [],
    cities: [],
    specialFeatures: [],
    description: '',
  },
  step3: {
    documents: [],
    images: [],
    videos: [],
  },
  step4: {
    subscriptionPlan: '',
    termsAccepted: false,
    privacyAccepted: false,
    marketingConsent: false,
  },
};

function applicationFormReducer(
  state: ApplicationFormState,
  action: ApplicationFormAction
): ApplicationFormState {
  switch (action.type) {
    case 'SET_PORTFOLIO_TYPE':
      return { ...state, portfolioType: action.payload };
    case 'UPDATE_STEP1':
      return { ...state, step1: { ...state.step1, ...action.payload } };
    case 'UPDATE_STEP2':
      return { ...state, step2: { ...state.step2, ...action.payload } };
    case 'UPDATE_STEP3':
      return { ...state, step3: { ...state.step3, ...action.payload } };
    case 'UPDATE_STEP4':
      return { ...state, step4: { ...state.step4, ...action.payload } };
    case 'LOAD_DRAFT':
      return action.payload;
    case 'RESET_FORM':
      return initialState;
    default:
      return state;
  }
}

interface ApplicationFormContextValue {
  state: ApplicationFormState;
  setPortfolioType: (type: PortfolioType) => void;
  updateStep1: (data: Partial<Step1Data>) => void;
  updateStep2: (data: Partial<Step2Data>) => void;
  updateStep3: (data: Partial<Step3Data>) => void;
  updateStep4: (data: Partial<Step4Data>) => void;
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<void>;
  resetForm: () => void;
}

const ApplicationFormContext = createContext<ApplicationFormContextValue | undefined>(undefined);

const STORAGE_KEY = '@funcxon_application_draft';

export function ApplicationFormProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(applicationFormReducer, initialState);

  const saveDraft = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const loadDraft = async () => {
    try {
      const draft = await AsyncStorage.getItem(STORAGE_KEY);
      if (draft) {
        dispatch({ type: 'LOAD_DRAFT', payload: JSON.parse(draft) });
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  useEffect(() => {
    loadDraft();
  }, []);

  useEffect(() => {
    saveDraft();
  }, [state]);

  const value: ApplicationFormContextValue = {
    state,
    setPortfolioType: (type) => dispatch({ type: 'SET_PORTFOLIO_TYPE', payload: type }),
    updateStep1: (data) => dispatch({ type: 'UPDATE_STEP1', payload: data }),
    updateStep2: (data) => dispatch({ type: 'UPDATE_STEP2', payload: data }),
    updateStep3: (data) => dispatch({ type: 'UPDATE_STEP3', payload: data }),
    updateStep4: (data) => dispatch({ type: 'UPDATE_STEP4', payload: data }),
    saveDraft,
    loadDraft,
    resetForm: () => dispatch({ type: 'RESET_FORM' }),
  };

  return (
    <ApplicationFormContext.Provider value={value}>
      {children}
    </ApplicationFormContext.Provider>
  );
}

export function useApplicationForm() {
  const context = useContext(ApplicationFormContext);
  if (!context) {
    throw new Error('useApplicationForm must be used within ApplicationFormProvider');
  }
  return context;
}
