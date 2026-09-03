export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  types: string[];
}

// Categories sourced from "09.01.2026_Categories tags etc.xlsx" (Prof_Vendor Categories tab).
export const serviceCategories: ServiceCategory[] = [
  {
    id: "audio-visual",
    name: "Audio & Visual",
    description: "Sound, lighting, screens, AV technicians & special effects",
    types: [
      "Indoor/Outdoor Sound",
      "Indoor & Stage Lighting",
      "Outdoor Lighting",
      "AV Technician",
      "Screens & Projectors",
      "Special Effects",
      "Live Feeds",
      "Fireworks / Drone Pyrotechnics",
    ]
  },
  {
    id: "catering-edibles-drinkables",
    name: "Catering - Edibles & Drinkables",
    description: "Chefs, bakers, desserts, beverages & finger foods",
    types: [
      "Cocktails / Mocktails",
      "Hot Beverages",
      "Food Chefs / Cooks",
      "Desserts / Patisserie",
      "Bakers",
      "Savoury / Finger Foods",
      "Fruit Carvers",
      "Ice Sculptors",
    ]
  },
  {
    id: "catering-table-wear",
    name: "Catering - Table Wear",
    description: "Cutlery, crockery, centrepieces, food warmers & table cloths",
    types: [
      "Cutlery",
      "Crockery",
      "Centre Pieces",
      "Food Warmers",
      "Urns",
      "Table Cloths",
      "Chair Covers",
    ]
  },
  {
    id: "waste-management",
    name: "Waste Management",
    description: "Waste removal & recycling",
    types: [
      "Waste Removal",
      "Recycling",
    ]
  },
  {
    id: "decor-venue-styling",
    name: "Decor & Venue Styling",
    description: "Decorators, florists, draping, backdrops & styling",
    types: [
      "Interior Decorators",
      "Linen & Draping",
      "Florists",
      "Stage Stylists",
      "Carpets",
      "Backdrops",
      "Food Station Stylists",
    ]
  },
  {
    id: "entertainment-live-performers",
    name: "Entertainment - Live Performers & Acts",
    description: "Celebrity hosts, comedians, dancers, singers & speciality acts",
    types: [
      "Celebrity Hosts",
      "Clowns",
      "Comedians",
      "Content Creators & Influencers",
      "Dancers",
      "Impersonators",
      "Instrumentalists (Violinist, Pianist)",
      "MC's",
      "Singers & Bands",
      "Speciality Acts (Acrobats, Fire Eaters, Jugglers, Puppeteers, Ventriloquists)",
    ]
  },
  {
    id: "entertainment-rentals-rides-games",
    name: "Entertainment Rentals - Rides & Games",
    description: "Rides, inflatables, arcade & interactive games",
    types: [
      "Craft Stations",
      "Putt Putt",
      "Fun Fair Rides",
      "Petting Zoos",
      "Arcade Gaming",
      "VR Experiences",
      "Inflatables",
      "Mechanical Rides & Simulators",
      "Lazer Tag / Escape Room Kits",
      "Carnival & Interactive Games",
      "Face Painting",
    ]
  },
  {
    id: "equipment-hire",
    name: "Equipment Hire",
    description: "Braai stands, stoves, heaters, cooling & electrical",
    types: [
      "Braai Stands",
      "Stoves",
      "Heaters / Heating",
      "Cooling / Air Conditioning",
      "Refrigerators & Freezers",
      "Spotlights",
      "Electricity / Electrical",
    ]
  },
  {
    id: "planners",
    name: "Planners",
    description: "Event planners, concept development & promoters",
    types: [
      "Event Planners",
      "Concept Development",
      "Promoters",
    ]
  },
  {
    id: "furniture-hire",
    name: "Furniture Hire",
    description: "Tables, chairs, lounge, staging & dance floors",
    types: [
      "Lounge",
      "Ottomans & Poufs",
      "Cocktail Tables",
      "Benches & Stools",
      "Bar Units",
      "Shelving Displays",
      "Tables",
      "Plinths & Pedestals / Thrones & Feature Chairs",
      "Chairs",
      "Stage",
      "Podiums",
      "Dance Floor",
      "Food Carts",
    ]
  },
  {
    id: "personal-services",
    name: "Personal Services",
    description: "Hair & makeup, nails, henna & seamstresses",
    types: [
      "Hair & Makeup",
      "Nail Tech",
      "Henna Artists",
      "Seamstress",
      "Styling Assistance",
      "Outfit Steaming & Fitting",
    ]
  },
  {
    id: "photography-videography",
    name: "Photography & Videography",
    description: "Photographers, videographers, drones & live streaming",
    types: [
      "Photographer",
      "Videographer",
      "Drone Operator",
      "Live Streaming",
      "Social Media",
    ]
  },
  {
    id: "power-load-shedding",
    name: "Power & Load-Shedding Solutions",
    description: "Generators, backup power & distribution equipment",
    types: [
      "Generators",
      "Backup Power Solutions",
      "Extension & Distribution Equipment",
    ]
  },
  {
    id: "props-hire",
    name: "Props Hire",
    description: "Photo booths, themed décor & backdrop frames",
    types: [
      "Photo Booths",
      "Themed Décor",
      "Backdrop Frames",
    ]
  },
  {
    id: "signage-printing",
    name: "Signage & Printing",
    description: "Signage, seating charts, banners & invitations",
    types: [
      "Welcome & Directional Signage",
      "Seating Charts & Table Numbers",
      "Branding & Banners",
      "Invitations",
      "Embossing",
    ]
  },
  {
    id: "stages-rigging",
    name: "Stages & Rigging",
    description: "Stage builds, trussing, podiums & platforms",
    types: [
      "Stage Builds",
      "Trussing & Rigging",
      "Podiums & Platforms",
      "Stage Balustrade",
    ]
  },
  {
    id: "staffing-professional-general",
    name: "Staffing Professional & General",
    description: "Security, waiters, bartenders, ushers & crews",
    types: [
      "Security & Body Guards",
      "Valet",
      "Waiters",
      "General Workers",
      "Cleaning Crews",
      "Bartenders",
      "Ushers / Hostesses",
      "Ticketing Staff",
      "Setup & Breakdown Crew",
      "Technicians",
    ]
  },
  {
    id: "tents-marquees",
    name: "Tents & Marquees",
    description: "Frame tents, peg & pole, stretch tents & gazebos",
    types: [
      "Frame Tents",
      "Peg & Pole Marquees",
      "Clear Roof / Stretch Tents",
      "Gazebos",
    ]
  },
  {
    id: "transport-logistics",
    name: "Transport & Logistics",
    description: "Shuttles, equipment transport & vehicle hire",
    types: [
      "Shuttle / Passenger Services",
      "Equipment Transport",
      "Vehicle Hire (Luxury/Sports/SUV's)",
    ]
  },
  {
    id: "sanitation-facilities",
    name: "Sanitation Facilities",
    description: "Portable toilets & luxury restrooms",
    types: [
      "Portable Toilets",
      "Luxury Restrooms",
    ]
  },
  {
    id: "parcelling-gifting",
    name: "Parcelling & Gifting",
    description: "Party packs, gift parcels & goodie bags",
    types: [
      "Party Packs",
      "Bride/Groom Gift Parcels",
      "Thank You Bags",
      "Promotional Goodie Bags",
    ]
  },
  {
    id: "ticketing-access-control",
    name: "Ticketing & Access Control",
    description: "On-site ticketing & access management",
    types: [
      "On-site Ticketing",
      "Access Management",
    ]
  },
];

export const specialServiceFeatures = ["Customisable Packages", "Halaal", "International Experience", "Local within Radius", "Travels National", "Vegan"];
