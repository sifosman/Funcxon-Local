export interface LegalSection {
  title: string;
  content: string;
  subsections?: { title: string; content: string }[];
}

export interface LegalDocument {
  id: string;
  title: string;
  effectiveDate: string;
  preamble: string;
  sections: LegalSection[];
  closing?: string;
}

export const privacyPolicy: LegalDocument = {
  id: 'privacy-policy',
  title: 'Funcxon Privacy Policy (POPIA Compliant)',
  effectiveDate: '05 December 2025',
  preamble:
    'This Privacy Policy explains how Funcxon collects, uses, stores, shares, protects, and processes personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA) and applicable South African law.\n\nBy using the Funcxon mobile application, website, platform, and related services (collectively, the "Platform"), you consent to the collection and processing of your personal information as described in this Policy.',
  sections: [
    {
      title: '1. Responsible Party',
      content:
        'Funcxon (Pty) Ltd is the Responsible Party as defined under POPIA.\n\nContact Details (Information Officer)\nName: Zulayka Bhyat\nEmail: zulaykab@gmail.com\nRegistered Address: 46 Alhambra Place, Roshnee, Vereeniging, Gauteng, South Africa, 1936',
    },
    {
      title: '2. Personal Information We Collect',
      content: 'We collect the following categories of personal information:',
      subsections: [
        {
          title: '2.1 Information You Provide Directly',
          content:
            '\u2022 Full name and surname\n\u2022 Email address\n\u2022 Phone number\n\u2022 Physical address (where applicable)\n\u2022 Business registration information (for vendors)\n\u2022 Bank/payment details (processed via third parties)\n\u2022 Booking details and event information\n\u2022 Profile pictures, photos, videos, documents\n\u2022 Reviews, messages, and communication data',
        },
        {
          title: '2.2 Information Collected Automatically',
          content:
            '\u2022 Device information\n\u2022 IP address\n\u2022 Browser type\n\u2022 Usage data (pages viewed, clicks, time spent)\n\u2022 Location data (if enabled)\n\u2022 Cookies and tracking technologies (website)',
        },
        {
          title: '2.3 Third-Party Information',
          content:
            'We may receive personal information through:\n\u2022 Payment processors\n\u2022 Identity verification services\n\u2022 Vendors you engage with via the Platform',
        },
      ],
    },
    {
      title: '3. Purpose of Processing',
      content:
        'We process personal information for:\n\u2022 Account creation and login\n\u2022 Providing platform services\n\u2022 Facilitating bookings between users and vendors\n\u2022 Processing payments and invoicing\n\u2022 Customer support and dispute resolution\n\u2022 Sending notifications (bookings, payments, updates)\n\u2022 Marketing communications (with consent)\n\u2022 Platform analytics and improvement\n\u2022 Legal and compliance requirements\n\u2022 Security, fraud detection, and prevention\n\nWe will only process personal information for purposes compatible with this Privacy Policy.',
    },
    {
      title: '4. Consent',
      content:
        'By creating an account, browsing, booking, or communicating through the Platform, you:\n\u2022 Consent to the processing of your personal information\n\u2022 Confirm information provided is accurate\n\u2022 Understand you may withdraw consent at any time (subject to legal limitations)\n\nConsent for marketing communications may be withdrawn using the unsubscribe option or by contacting the Information Officer.',
    },
    {
      title: '5. Your Rights Under POPIA',
      content:
        'You have the right to:\n\u2022 Access your personal information\n\u2022 Request correction or deletion of inaccurate information\n\u2022 Object to processing of your data\n\u2022 Withdraw consent to processing\n\u2022 Lodge a complaint with the Information Regulator\n\nInformation Regulator Contact:\nEmail: complaints.IR@justice.gov.za',
    },
    {
      title: '6. Information Sharing & Disclosure',
      content:
        'We will not sell your personal information.\n\nWe may share information with:\n6.1 Vendors \u2014 to fulfil bookings and provide services.\n6.2 Payment Processors \u2014 for secure payment processing.\n6.3 Service Providers \u2014 IT, hosting, analytics.\n6.4 Legal Authorities \u2014 when required by law or to protect rights.\n\nAll third parties must comply with POPIA.',
    },
    {
      title: '7. International Transfers',
      content:
        'Where information must be processed or stored outside South Africa (e.g., cloud hosting providers), we will ensure:\n\u2022 The receiving country has adequate data protection laws, or\n\u2022 Appropriate contractual safeguards are in place.',
    },
    {
      title: '8. Security Safeguards',
      content:
        'We implement appropriate security measures, including:\n\u2022 Encryption technologies\n\u2022 Restricted access control\n\u2022 Secure firewalls and server settings\n\u2022 Password protection and authentication\n\u2022 Regular security reviews and audits\n\nHowever, no internet-based system is 100% secure, and we cannot guarantee absolute security.',
    },
    {
      title: '9. Retention of Information',
      content:
        'We retain personal information only for:\n\u2022 As long as necessary to fulfil the purpose collected\n\u2022 Legal or regulatory retention periods\n\u2022 Accounting and audit requirements\n\nOnce no longer required, information will be securely deleted or anonymised.',
    },
    {
      title: '10. Children',
      content:
        'The Platform is not intended for children under 18. We do not knowingly collect personal information from minors without legal guardian consent.',
    },
    {
      title: '11. Cookies & Tracking Technologies',
      content:
        'Cookies may be used on the website for:\n\u2022 Session management\n\u2022 Analytics data\n\u2022 Improving user experience\n\u2022 Security purposes\n\nUsers may manage cookie preferences in browser settings.\n\nA separate Cookie Policy applies to the web version of the Platform.',
    },
    {
      title: '12. Direct Marketing',
      content:
        'We may send marketing content only when:\n\u2022 The user has given consent\n\u2022 It relates to similar services already used by the user\n\nUsers may opt-out at any time without charge.',
    },
    {
      title: '13. Information Regulator Compliance',
      content:
        'If you believe your personal information has been mishandled, contact:\n\u2022 Funcxon Information Officer (see section 1)\n\u2022 Or submit a complaint to the Information Regulator',
    },
    {
      title: '14. Updates to This Policy',
      content:
        'This Privacy Policy may be updated periodically. Material changes will be communicated to users, and continued use of the Platform constitutes acceptance of the updated policy.',
    },
    {
      title: '15. Contact',
      content:
        'For all privacy inquiries:\nInformation Officer\nEmail: zulaykab@gmail.com\nAddress: 46 Alhambra Place, Roshnee, Vereeniging, Gauteng, South Africa, 1936',
    },
  ],
  closing:
    'By using Funcxon, you acknowledge that you have read and understood this Privacy Policy and consent to the processing of personal information under POPIA.',
};

export const cookiePolicy: LegalDocument = {
  id: 'cookie-policy',
  title: 'Funcxon Cookie Policy',
  effectiveDate: '05 December 2025',
  preamble:
    'This Cookie Policy explains how Funcxon uses cookies and similar technologies on our website and web-based platform features. It applies to all visitors and users accessing Funcxon through a web browser.\n\nIf you do not accept the use of cookies, please disable cookies in your browser settings or refrain from using the web-based features of the Platform.',
  sections: [
    {
      title: '1. What Are Cookies?',
      content:
        'Cookies are small text files that are stored on your device when you visit a website. Cookies allow the website to recognise your device and store certain information about your preferences and interactions.\n\nCookies may be:\n\u2022 Session Cookies: Deleted when you close your browser.\n\u2022 Persistent Cookies: Remain stored until they expire or are deleted.',
    },
    {
      title: '2. Why We Use Cookies',
      content: 'Funcxon uses cookies for the following purposes:',
      subsections: [
        {
          title: '2.1 Essential Platform Functionality',
          content:
            '\u2022 Enable website and platform navigation\n\u2022 Maintain secure login sessions\n\u2022 Support bookings and payment processing',
        },
        {
          title: '2.2 Preferences & Customisation',
          content:
            '\u2022 Save language preferences\n\u2022 Save browsing settings\n\u2022 Improve user experience',
        },
        {
          title: '2.3 Analytics & Performance',
          content:
            '\u2022 Understand how users interact with the website\n\u2022 Analyse page performance and usage\n\u2022 Improve design and content',
        },
        {
          title: '2.4 Security',
          content: '\u2022 Detect suspicious behaviour or fraud\n\u2022 Maintain platform integrity',
        },
      ],
    },
    {
      title: '3. Types of Cookies We Use',
      content:
        'We may use:\n\u2022 Strictly Necessary Cookies\n\u2022 Performance Cookies\n\u2022 Functionality Cookies\n\u2022 Analytics Cookies\n\nThe specific cookies and providers may change over time.',
    },
    {
      title: '4. Third-Party Cookies',
      content:
        'Some cookies are placed by third-party service providers, such as:\n\u2022 Analytics tools\n\u2022 Payment processors\n\u2022 Advertising networks (if applicable)\n\nThese third parties may collect browsing data across the Platform.',
    },
    {
      title: '5. Managing Cookies',
      content:
        'You may control cookie preferences through:\n\u2022 Browser cookie settings\n\u2022 Clearing browsing history\n\u2022 Using private/incognito browsing modes\n\nPlease note: Disabling cookies may affect certain functionality, including login and booking features.',
    },
    {
      title: '6. Legal Basis & Consent',
      content:
        'By using the web-based Platform, you:\n\u2022 Consent to the use of cookies\n\u2022 Understand you may withdraw consent through browser controls\n\nFor essential cookies, consent is not required under applicable law, as they are required for the functioning of the Platform.',
    },
    {
      title: '7. Changes to This Cookie Policy',
      content:
        'We may update this Cookie Policy from time to time. Continued use of the Platform constitutes acceptance of any updated policy.',
    },
    {
      title: '8. Contact',
      content:
        'For questions about this Cookie Policy:\nFuncxon Information Officer\nEmail: zulaykab@gmail.com\nAddress: 46 Alhambra Place, Roshnee, Vereeniging, Gauteng, South Africa, 1936',
    },
  ],
  closing:
    'By continuing to use the web version of Funcxon, you agree to the use of cookies as described in this Cookie Policy.',
};

export const dataProcessingAgreement: LegalDocument = {
  id: 'data-processing-agreement',
  title: 'Data Processing Agreement (DPA)',
  effectiveDate: '05 December 2025',
  preamble:
    'Between: Funcxon (Pty) Ltd ("Processor/Platform")\nAnd: Vendor/Subscriber ("Responsible Party")\n\nThis Data Processing Agreement ("Agreement") forms part of the Funcxon Terms & Conditions and governs the processing of personal information by Funcxon (Pty) Ltd ("Funcxon") on behalf of the Vendor/Subscriber (the "Vendor") for the purpose of providing platform services under the Protection of Personal Information Act 4 of 2013 ("POPIA").',
  sections: [
    {
      title: '1. Definitions',
      content:
        '\u2022 Personal Information: As defined in POPIA.\n\u2022 Processing: Any operation involving personal information.\n\u2022 Responsible Party: The Vendor who determines the purpose of processing.\n\u2022 Operator: Funcxon (Pty) Ltd acting on behalf of Vendor.\n\u2022 Data Subject: Individual to whom the personal information relates.',
    },
    {
      title: '2. Role of the Parties',
      content:
        '\u2022 Vendor is the Responsible Party.\n\u2022 Funcxon is the Operator and processes personal information only on documented instructions of the Vendor.',
    },
    {
      title: '3. Purpose of Processing',
      content:
        'Funcxon will process personal information solely to:\n\u2022 Host Vendor profile and content\n\u2022 Enable communication with customers\n\u2022 Facilitate bookings and transactions\n\u2022 Provide payment services through third-party providers\n\u2022 Provide platform analytics and improvements\n\u2022 Customer dispute resolution and support\n\nNo other use is permitted unless required by law.',
    },
    {
      title: '4. Types of Personal Information',
      content:
        'Typical information processed includes:\n\u2022 Customer identification details\n\u2022 Contact information\n\u2022 Booking and event details\n\u2022 Payment and invoice information\n\u2022 Communication and review data',
    },
    {
      title: '5. Responsibilities of the Vendor',
      content:
        'Vendor represents and warrants that:\n\u2022 Personal information is obtained lawfully\n\u2022 Data subjects are informed of processing activities\n\u2022 Necessary consents are obtained where required\n\u2022 Vendor complies with POPIA obligations\n\nVendor indemnifies Funcxon for any breach of POPIA by the Vendor.',
    },
    {
      title: '6. Obligations of Funcxon (Operator)',
      content:
        'Funcxon will:\n\u2022 Process only on documented instructions from Vendor\n\u2022 Implement appropriate security safeguards\n\u2022 Restrict internal access on a need-to-know basis\n\u2022 Notify Vendor of any data breach without undue delay\n\u2022 Cooperate with Vendor in responding to data subject requests\n\u2022 Not engage another operator without safeguards in place',
    },
    {
      title: '7. Sub-Processors',
      content:
        'Funcxon may use third-party providers to deliver services, including:\n\u2022 Cloud hosting providers\n\u2022 Payment gateways\n\u2022 Analytics providers\n\nFuncxon remains responsible for ensuring sub-processors meet POPIA requirements.',
    },
    {
      title: '8. International Data Transfers',
      content:
        'Where personal information is transferred outside South Africa, Funcxon will ensure legal safeguards exist including:\n\u2022 Adequate data protection laws, or\n\u2022 Standard contractual clauses, or\n\u2022 Written undertakings compatible with POPIA.',
    },
    {
      title: '9. Security Safeguards',
      content:
        'Funcxon will maintain:\n\u2022 Encryption where appropriate\n\u2022 Secure access control\n\u2022 Firewalls and intrusion detection\n\u2022 Regular vulnerability assessments\n\u2022 Backup and disaster recovery procedures',
    },
    {
      title: '10. Data Breach Notification',
      content:
        'In the event of a confirmed data breach, Funcxon will:\n\u2022 Notify Vendor promptly\n\u2022 Provide details of the breach\n\u2022 Assist with mitigation efforts\n\u2022 Cooperate with regulatory reporting duties\n\nVendor is responsible for notification to data subjects unless agreed otherwise.',
    },
    {
      title: '11. Data Subject Rights',
      content:
        'Funcxon will assist Vendor, where reasonable, with:\n\u2022 Access to personal information\n\u2022 Rectification or deletion requests\n\u2022 Objections to processing\n\u2022 Complaints or enquiries from data subjects',
    },
    {
      title: '12. Audits',
      content:
        'Vendor may request documentation demonstrating compliance. On-site audits are permitted only:\n\u2022 With reasonable notice, and\n\u2022 Not more than once annually, unless mandated by law',
    },
    {
      title: '13. Retention and Deletion',
      content:
        'Upon termination of the Vendor\'s contract:\n\u2022 Funcxon will delete or anonymise personal information after legal retention periods\n\u2022 Backups will be purged during routine cycles\n\nException: Information required for legal claims or compliance may be retained.',
    },
    {
      title: '14. Confidentiality',
      content:
        'Funcxon must ensure that authorised personnel:\n\u2022 Maintain strict confidentiality, and\n\u2022 Receive training regarding POPIA compliance',
    },
    {
      title: '15. Liability',
      content:
        'Vendor is responsible for:\n\u2022 Lawful data collection\n\u2022 Accuracy of information supplied\n\u2022 Consent obligations\n\nFuncxon is liable for breaches caused by its own negligence or security failure.',
    },
    {
      title: '16. Term and Termination',
      content:
        "This Agreement remains in force for the duration of the Vendor's subscription to Funcxon services and will automatically terminate upon full deletion of Vendor data.",
    },
    {
      title: '17. Governing Law',
      content: 'This Agreement is governed by South African law.',
    },
  ],
  closing:
    'This Agreement ensures POPIA compliance and defines the responsibilities of both parties in the processing of personal information.',
};

export const termsAndConditions: LegalDocument = {
  id: 'terms-and-conditions',
  title: 'Funcxon App — Terms & Conditions (South Africa Compliant)',
  effectiveDate: '05 December 2025',
  preamble:
    'These Terms and Conditions ("Terms") govern the use of the Funcxon mobile application, website, platform, and all related services (collectively, the "Platform"). By accessing, registering, browsing, or transacting on the Platform, all users — including consumers, vendors, service providers, event organisers, developers, and subscribers — agree to be bound by these Terms.\n\nThese Terms are designed to comply with all applicable South African laws, including but not limited to:\n\u2022 The Consumer Protection Act 68 of 2008 (CPA)\n\u2022 The Protection of Personal Information Act 4 of 2013 (POPIA)\n\u2022 The Electronic Communications and Transactions Act 25 of 2002 (ECTA)\n\u2022 The Copyright Act 98 of 1978\n\u2022 The Companies Act 71 of 2008\n\u2022 Applicable contract, commercial, and common law principles in South Africa\n\nAny policies legally required to be displayed separately (e.g., Privacy Policy, PAIA Manual, Cookies Policy) will be provided as standalone documents. All other matters are contained herein.',
  sections: [
    {
      title: '1. Definitions',
      content:
        '\u2022 "Funcxon/We/Us/Our": The company owning and operating the Funcxon Platform.\n\u2022 "User": Any person accessing or using the Platform, including consumers and vendors.\n\u2022 "Vendor/Service Provider": A business or individual listing products/services for booking or sale on the Platform.\n\u2022 "Subscriber": Any vendor/service provider paying for listing packages.\n\u2022 "Client/Customer": Any user booking or purchasing a vendor\'s services.\n\u2022 "Content": All information, media, images, videos, documents, messages, reviews, and data uploaded to the Platform.\n\u2022 "Developer": Any authorised individual contracted to maintain, update, or enhance the Platform.',
    },
    {
      title: '2. Acceptance of Terms',
      content:
        'By using the Platform, you:\n\u2022 Confirm you are 18 years or older.\n\u2022 Confirm you have read, understood, and agreed to these Terms.\n\u2022 Consent to the processing of personal information in line with POPIA.\n\u2022 Agree to any additional terms displayed during specific transactions (e.g., payments, promotions).\n\nIf you do not agree with any part of the Terms, you must discontinue use of the Platform immediately.',
    },
    {
      title: '3. Platform Description',
      content:
        'Funcxon is a marketplace and directory platform connecting clients with vendors in the events industry. Funcxon:\n\u2022 Does not own any vendor businesses.\n\u2022 Is not party to agreements between vendors and clients.\n\u2022 Provides tools, listings, catalogues, calendars, payment features, and communication features.\n\u2022 Is not responsible for execution of services by vendors.',
    },
    {
      title: '4. User Obligations',
      content: 'All users must adhere to the following obligations:',
      subsections: [
        {
          title: '4.1 Accurate Information',
          content:
            'All users must provide:\n\u2022 Accurate personal or business details\n\u2022 Valid contact information\n\u2022 Updated payment details (where applicable)\n\nFalse or fraudulent information is strictly prohibited.',
        },
        {
          title: '4.2 Responsible Use',
          content:
            'Users may not:\n\u2022 Upload illegal, defamatory, harmful, hateful, pornographic, or copyrighted content.\n\u2022 Misrepresent identity or business.\n\u2022 Attempt to hack, modify, disrupt, or reverse-engineer the Platform.\n\u2022 Use the Platform for any unlawful purpose.',
        },
        {
          title: '4.3 Account Security',
          content:
            'Users are responsible for:\n\u2022 Maintaining confidentiality of login details.\n\u2022 All activity under their account.\n\u2022 Informing Funcxon immediately of suspicious access.',
        },
      ],
    },
    {
      title: '5. Vendor/Subscriber Terms',
      content: '',
      subsections: [
        {
          title: '5.1 Listings & Content',
          content:
            'Vendors are solely responsible for:\n\u2022 The accuracy of all listings.\n\u2022 Images, videos, pricing, availability calendars, catalogues, business profiles.\n\u2022 Compliance with South African business and tax laws.\n\nFuncxon may remove any listing violating policy or law.',
        },
        {
          title: '5.2 Subscriptions & Payments',
          content:
            '\u2022 Subscription fees are billed per the selected package.\n\u2022 Fees are non-refundable unless required by law.\n\u2022 Non-payment may result in suspension or removal.',
        },
        {
          title: '5.3 Vendor Performance',
          content:
            'Vendors must:\n\u2022 Honour bookings.\n\u2022 Deliver agreed services/products.\n\u2022 Communicate professionally with clients.\n\nFuncxon is not liable for vendor actions or inactions.',
        },
      ],
    },
    {
      title: '6. Client/Customer Terms',
      content:
        'Clients acknowledge that:\n\u2022 Vendors are independent businesses.\n\u2022 Funcxon is not responsible for vendor quality, conduct, cancellations, or disputes.\n\u2022 Clients must verify suitability of vendors before booking.',
    },
    {
      title: '7. Bookings, Payments & Fees',
      content: '',
      subsections: [
        {
          title: '7.1 Marketplace Interactions',
          content:
            '\u2022 Bookings may occur via direct vendor contact or through in-app booking features.\n\u2022 Payment methods may include EFT, card payments, or third-party processors.',
        },
        {
          title: '7.2 Payment Processing',
          content:
            '\u2022 Payments may be processed by authorised third-party payment gateways.\n\u2022 Funcxon does not store credit card information.',
        },
        {
          title: '7.3 Refunds',
          content:
            'Refunds are governed by:\n\u2022 Vendor\'s individual refund policy\n\u2022 CPA requirements (where applicable)\n\nFuncxon does not issue refunds for vendor services.',
        },
      ],
    },
    {
      title: '8. Content Ownership & Licenses',
      content: '',
      subsections: [
        {
          title: '8.1 User Content',
          content:
            'Users retain copyright over uploaded content. However, by uploading, users grant Funcxon:\n\u2022 A non-exclusive, worldwide licence to display, reproduce, and distribute the content solely within the Platform.',
        },
        {
          title: '8.2 Funcxon Intellectual Property',
          content:
            'All Funcxon branding, logos, software, UI/UX, features, and databases belong exclusively to Funcxon and may not be copied, reverse-engineered, or used without permission.',
        },
      ],
    },
    {
      title: '9. Privacy Compliance (POPIA)',
      content:
        'Funcxon will:\n\u2022 Collect only necessary personal information.\n\u2022 Use information for platform functionality.\n\u2022 Secure all data with appropriate safeguards.\n\u2022 Never sell personal data.\n\nPersonal data may be shared with:\n\u2022 Vendors (to fulfil bookings)\n\u2022 Payment processors\n\u2022 Legal authorities when required',
    },
    {
      title: '10. Communication Policy',
      content:
        'Funcxon may send users:\n\u2022 Booking updates\n\u2022 Payment confirmations\n\u2022 System notifications\n\u2022 Marketing (with consent)\n\nUsers may opt out of marketing at any time.',
    },
    {
      title: '11. Reviews & Ratings',
      content:
        'Users agree to:\n\u2022 Post fair, truthful reviews.\n\u2022 Refrain from harassment, defamation, or extortion.\n\nFuncxon may remove or moderate reviews violating the Terms.',
    },
    {
      title: '12. Limitation of Liability',
      content:
        'To the maximum extent allowed by law, Funcxon is not liable for:\n\u2022 Losses due to vendor actions or negligence\n\u2022 Event failures, cancellations, delays\n\u2022 Financial disputes between clients and vendors\n\u2022 Internet outages or technical disruptions\n\u2022 Loss of data beyond our reasonable control\n\nUsers indemnify Funcxon against claims arising from their use of the Platform.',
    },
    {
      title: '13. Suspension & Termination',
      content:
        'Funcxon may suspend or terminate accounts for:\n\u2022 Violations of these Terms\n\u2022 Illegal activity\n\u2022 Fraud\n\u2022 Abuse of the Platform\n\nUsers may delete their accounts at any time.',
    },
    {
      title: '14. Developer Rights & Responsibilities',
      content:
        'Developers working for Funcxon:\n\u2022 Must maintain confidentiality\n\u2022 May not copy, share, or re-use Funcxon code or systems\n\u2022 Must adhere to cybercrime and IP law\n\u2022 Are bound by NDAs and internal agreements',
    },
    {
      title: '15. Updates to Terms',
      content:
        'Funcxon may update these Terms periodically. Users will be notified of material changes, and continued use constitutes acceptance.',
    },
    {
      title: '16. Governing Law',
      content:
        'These Terms are governed by South African law. Disputes must first be attempted through mediation before formal legal action.',
    },
    {
      title: '17. Contact Information',
      content:
        'For queries, complaints, or legal notices:\nFuncxon Legal & Compliance Department\nEmail: zulaykab@gmail.com\nRegistered Address: 46 Alhambra Place, Roshnee, Vereeniging, Gauteng, South Africa, 1936',
    },
    {
      title: '18. Separate Legally Mandated Policies',
      content:
        'The following will appear as separate documents:\n\u2022 POPIA-compliant Privacy Policy\n\u2022 PAIA Manual\n\u2022 Cookie Policy\n\u2022 Refund Policy',
    },
  ],
  closing:
    'By using Funcxon, you confirm acceptance of these Terms & Conditions.',
};

export const allLegalDocuments: LegalDocument[] = [
  privacyPolicy,
  cookiePolicy,
  dataProcessingAgreement,
  termsAndConditions,
];

export const legalDocumentIndex = [
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect your personal information',
    icon: 'privacy-tip' as const,
    iconColor: '#2B9EB3',
    iconBg: '#E0F2F7',
  },
  {
    id: 'cookie-policy',
    title: 'Cookie Policy',
    description: 'How we use cookies and tracking technologies',
    icon: 'cookie' as const,
    iconColor: '#D97706',
    iconBg: '#FEF3C7',
  },
  {
    id: 'data-processing-agreement',
    title: 'Data Processing Agreement',
    description: 'POPIA-compliant data processing terms for vendors',
    icon: 'description' as const,
    iconColor: '#6366F1',
    iconBg: '#EEF2FF',
  },
  {
    id: 'terms-and-conditions',
    title: 'Terms and Conditions',
    description: 'General terms for using the Funcxon platform',
    icon: 'gavel' as const,
    iconColor: '#059669',
    iconBg: '#D1FAE5',
  },
];
