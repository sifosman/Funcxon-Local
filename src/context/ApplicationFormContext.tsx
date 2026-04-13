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
  awardsAndNominations?: string;
  browserTags?: string;
  halls?: Array<{
    name: string;
    capacity: string;
  }>;
  paymentTermsAndConditions?: string;
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
  editingApplicationId: string | null;
  portfolioType: PortfolioType;
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
}

type ApplicationFormAction =
  | { type: 'SET_EDITING_APPLICATION_ID'; payload: string | null }
  | { type: 'SET_PORTFOLIO_TYPE'; payload: PortfolioType }
  | { type: 'UPDATE_STEP1'; payload: Partial<Step1Data> }
  | { type: 'UPDATE_STEP2'; payload: Partial<Step2Data> }
  | { type: 'UPDATE_STEP3'; payload: Partial<Step3Data> }
  | { type: 'UPDATE_STEP4'; payload: Partial<Step4Data> }
  | { type: 'LOAD_DRAFT'; payload: ApplicationFormState }
  | { type: 'RESET_FORM' };

const initialState: ApplicationFormState = {
  editingApplicationId: null,
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
    awardsAndNominations: '',
    browserTags: '',
    halls: [],
    paymentTermsAndConditions: '',
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
    case 'SET_EDITING_APPLICATION_ID':
      return { ...state, editingApplicationId: action.payload };
    case 'SET_PORTFOLIO_TYPE':
      // If portfolio type is changing (and not being set for the first time), 
      // reset form data except step1 (company details)
      const isChangingType = state.portfolioType !== null && state.portfolioType !== action.payload;
      if (isChangingType) {
        console.log('Portfolio type changing from', state.portfolioType, 'to', action.payload, '- resetting form');
        return {
          portfolioType: action.payload,
          editingApplicationId: null,
          step1: state.step1, // Keep company details
          step2: initialState.step2,
          step3: initialState.step3,
          step4: initialState.step4,
        };
      }
      console.log('Setting portfolio type to', action.payload);
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
  setEditingApplicationId: (applicationId: string | null) => void;
  setPortfolioType: (type: PortfolioType) => Promise<void>;
  updateStep1: (data: Partial<Step1Data>) => void;
  updateStep2: (data: Partial<Step2Data>) => void;
  updateStep3: (data: Partial<Step3Data>) => void;
  updateStep4: (data: Partial<Step4Data>) => void;
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<void>;
  resetForm: () => void;
  hydrateForm: (nextState: ApplicationFormState) => void;
}

const ApplicationFormContext = createContext<ApplicationFormContextValue | undefined>(undefined);

const getStorageKey = (portfolioType: PortfolioType) => {
  if (portfolioType === 'venues') {
    return '@funcxon_application_draft_venue';
  } else if (portfolioType === 'vendors') {
    return '@funcxon_application_draft_vendor';
  }
  return '@funcxon_application_draft';
};

export function ApplicationFormProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(applicationFormReducer, initialState);
  const [hasHydrated, setHasHydrated] = React.useState(false);

  const saveDraft = async () => {
    try {
      const storageKey = getStorageKey(state.portfolioType);
      await AsyncStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const loadDraft = async () => {
    try {
      const storageKey = getStorageKey(state.portfolioType);
      const draft = await AsyncStorage.getItem(storageKey);
      if (draft) {
        dispatch({ type: 'LOAD_DRAFT', payload: JSON.parse(draft) });
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    } finally {
      setHasHydrated(true);
    }
  };

  // Clean up old generic draft storage on mount to prevent conflicts
  useEffect(() => {
    const cleanup = async () => {
      try {
        // Remove old generic draft that might conflict
        await AsyncStorage.removeItem('@funcxon_application_draft');
        console.log('Cleaned up old draft storage');
      } catch (error) {
        console.error('Failed to cleanup old drafts:', error);
      } finally {
        setHasHydrated(true);
      }
    };
    cleanup();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    saveDraft();
  }, [hasHydrated, state]);

  const resetForm = () => {
    const storageKey = getStorageKey(state.portfolioType);
    dispatch({ type: 'RESET_FORM' });
    AsyncStorage.removeItem(storageKey).catch((error) => {
      console.error('Failed to clear draft:', error);
    });
  };

  const setPortfolioTypeAndLoadDraft = async (type: PortfolioType) => {
    console.log('=== setPortfolioTypeAndLoadDraft called with type:', type);
    
    try {
      const storageKey = getStorageKey(type);
      console.log('Checking for draft at storage key:', storageKey);
      const draft = await AsyncStorage.getItem(storageKey);
      
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        console.log('Found saved draft with portfolioType:', parsedDraft.portfolioType);
        
        // Only load if the draft matches the selected portfolio type
        if (parsedDraft.portfolioType === type) {
          console.log('✓ Draft matches selected type, loading it');
          dispatch({ type: 'LOAD_DRAFT', payload: { ...parsedDraft, portfolioType: type } });
        } else {
          console.log('✗ Draft type mismatch! Ignoring it and starting fresh');
          dispatch({ type: 'SET_PORTFOLIO_TYPE', payload: type });
        }
      } else {
        console.log('No saved draft found, starting fresh with type:', type);
        dispatch({ type: 'SET_PORTFOLIO_TYPE', payload: type });
      }
    } catch (error) {
      console.error('Error in setPortfolioTypeAndLoadDraft:', error);
      // On error, just set the portfolio type
      dispatch({ type: 'SET_PORTFOLIO_TYPE', payload: type });
    }
    
    console.log('=== setPortfolioTypeAndLoadDraft completed');
  };

  const value: ApplicationFormContextValue = {
    state,
    setEditingApplicationId: (applicationId) => dispatch({ type: 'SET_EDITING_APPLICATION_ID', payload: applicationId }),
    setPortfolioType: setPortfolioTypeAndLoadDraft,
    updateStep1: (data) => dispatch({ type: 'UPDATE_STEP1', payload: data }),
    updateStep2: (data) => dispatch({ type: 'UPDATE_STEP2', payload: data }),
    updateStep3: (data) => dispatch({ type: 'UPDATE_STEP3', payload: data }),
    updateStep4: (data) => dispatch({ type: 'UPDATE_STEP4', payload: data }),
    saveDraft,
    loadDraft,
    resetForm,
    hydrateForm: (nextState) => dispatch({ type: 'LOAD_DRAFT', payload: nextState }),
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
