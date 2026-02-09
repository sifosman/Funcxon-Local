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
    id: "free",
    name: "Free",
    price: "R0",
    billingPeriod: "forever",
    features: [
      "Basic profile listing",
      "Up to 8 images",
      "Contact information display",
      "Email support"
    ]
  },
  {
    id: "basic",
    name: "Basic",
    price: "TBC",
    billingPeriod: "per month",
    features: [
      "Basic profile listing",
      "Up to 5 images",
      "Contact information display",
      "Basic search visibility",
      "Email support"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    price: "TBC",
    billingPeriod: "per month",
    features: [
      "Featured profile listing",
      "Unlimited images & videos",
      "Priority search ranking",
      "Quote request management",
      "Analytics dashboard",
      "Social media integration",
      "Priority support"
    ],
    highlighted: true
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "TBC",
    billingPeriod: "per month",
    features: [
      "Everything in Premium",
      "Multiple venue/service listings",
      "Custom branding",
      "API access",
      "Dedicated account manager",
      "Advanced analytics",
      "24/7 phone support"
    ]
  }
];
