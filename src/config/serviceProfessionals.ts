export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  types: string[];
}

export const serviceCategories: ServiceCategory[] = [
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Performers, DJs, Musicians, Dancers",
    types: [
      "Actors / Performers",
      "Aerial Artists / Acrobats",
      "Comedians / Entertainers",
      "Cultural / Traditional Performers",
      "Dancers",
      "DJ / Music Specialists",
      "Fire Dancers / Specialty Acts",
      "Magicians / Illusionists",
      "Musicians / Bands / Singers"
    ]
  },
  {
    id: "food-drinks",
    name: "Food & Drinks",
    description: "Chefs, Caterers, Bartenders, Baristas",
    types: [
      "Bakers / Pastry Chefs",
      "Baristas (Coffee Specialists)",
      "Bartenders / Mixologists",
      "Caterers",
      "Chefs / Cooks"
    ]
  },
  {
    id: "support-staff",
    name: "Support Staff",
    description: "Ushers, Servers, Setup & Cleanup Crews",
    types: [
      "Cleaning Crews",
      "Event Setup Crews",
      "Hospitality Staff",
      "Parking Attendants / Valet Services",
      "Registration / Front Desk Staff",
      "Ushers"
    ]
  },
  {
    id: "creative-services",
    name: "Creative Services",
    description: "Designers, Stylists, Florists, Models",
    types: [
      "Designers",
      "Fashion Stylists / Dressers",
      "Florists / Floral Designers",
      "Hair Stylists / Makeup Artists",
      "Models / Brand Hosts",
      "Stage Designers / Stage Managers",
      "Wardrobe Consultants / Costume Designers"
    ]
  },
  {
    id: "technical-services",
    name: "Technical Services",
    description: "Sound, Lighting, IT, Electricians",
    types: [
      "Carpenters / Set Builders",
      "Electricians",
      "IT & Technical Support Staff",
      "Lighting Technicians",
      "Production Crew",
      "Sound Engineers / Technicians"
    ]
  },
  {
    id: "media-content",
    name: "Media & Content",
    description: "Photographers, Videographers, Social Media",
    types: [
      "Photographers",
      "Pilots / Drone Operators",
      "Social Media Managers",
      "Videographers / Editors",
      "Voice-over Artists / Announcers"
    ]
  },
  {
    id: "event-management",
    name: "Event Management",
    description: "Planners, Coordinators, Hosts, Consultants",
    types: [
      "Brand Ambassadors / Promotional Staff",
      "Consultants",
      "Emcees / Hosts / Compères",
      "Event Coordinators / Planners / Managers",
      "Project Managers",
      "Translators / Interpreters"
    ]
  },
  {
    id: "specialized-services",
    name: "Specialized Services",
    description: "Security, Medical, Transport, Officiants",
    types: [
      "Chauffeurs / Drivers",
      "Health & Safety Officers",
      "Logistics & Delivery Teams",
      "Medical Staff",
      "Officiants",
      "Pyrotechnic Specialists / Fireworks Experts",
      "Security Personnel",
      "Transport & Shuttle Operators"
    ]
  }
];

export const specialServiceFeatures = [
  "Halaal",
  "Vegan",
  "Customisable Packages",
  "International Experience",
  "Travels National",
  "Local within Radius"
];
