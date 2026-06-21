export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  billingPeriod: string;
  features: string[];
  highlighted?: boolean;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "get_started",
    name: "Get Started",
    price: "R0",
    billingPeriod: "forever",
    features: [
      "Basic profile listing",
      "Up to 5 images",
      "Contact information display",
      "Email support"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    price: "R299",
    billingPeriod: "per month",
    features: [
      "Featured profile listing",
      "Up to 25 images & 5 videos",
      "Priority search ranking",
      "Quote request management",
      "Analytics dashboard",
      "Social media integration",
      "Priority support"
    ],
    highlighted: true
  },
  {
    id: "premium_plus",
    name: "Premium Plus",
    price: "R399",
    billingPeriod: "per month",
    features: [
      "Everything in Premium",
      "Up to 50 images & 10 videos",
      "Featured Listings badge",
      "Dedicated account manager",
      "Advanced analytics",
      "24/7 phone support"
    ]
  }
];
