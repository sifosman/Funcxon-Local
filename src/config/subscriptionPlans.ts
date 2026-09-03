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
    name: "Basic Package",
    price: "R0",
    billingPeriod: "forever",
    features: [
      "Up to 5 photos",
      "0 videos",
      "Limited catalogue / pricelist",
      "Online quote requests",
      "Map location display",
      "Limited ratings & reviews",
      "Self edit portfolio anytime",
      "Funxon portfolio build assistance"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    price: "R299",
    billingPeriod: "per month",
    features: [
      "Up to 25 photos",
      "5 videos",
      "Full catalogue / pricelist",
      "Online quote requests",
      "WhatsApp chat",
      "Website & social links",
      "Map location display",
      "Ratings & reviews",
      "Self edit portfolio anytime",
      "Limited portfolio performance analytics & stats",
      "Funxon portfolio build assistance"
    ],
    highlighted: true
  },
  {
    id: "premium_plus",
    name: "Premium Plus",
    price: "R399",
    billingPeriod: "per month",
    features: [
      "Up to 50 photos",
      "10 videos",
      "Full catalogue / pricelist",
      "Online quote requests",
      "WhatsApp chat",
      "Website & social links",
      "Map location display",
      "Ratings & reviews",
      "Self edit portfolio anytime",
      "Full portfolio performance analytics & stats",
      "Featured Listings",
      "Funxon portfolio build assistance",
      "Dedicated Funxon portfolio manager"
    ]
  }
];
