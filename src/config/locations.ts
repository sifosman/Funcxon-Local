export interface Province {
  name: string;
  cities: string[];
}

export const provinces: Province[] = [
  {
    name: "Gauteng",
    cities: [
      "Johannesburg", "Pretoria", "Centurion", "Sandton", "Soweto", "Midrand", 
      "Roodepoort", "Benoni", "Boksburg", "Kempton Park", "Randburg", "Edenvale",
      "Germiston", "Krugersdorp", "Alberton", "Springs", "Brakpan", "Vereeniging",
      "Vanderbijlpark", "Nigel", "Bronkhorstspruit", "Carletonville", "Randfontein",
      "Westonaria", "Heidelberg", "Meyerton", "Tembisa", "Alexandra", "Fourways",
      "Rosebank", "Melville"
    ]
  },
  {
    name: "Western Cape",
    cities: [
      "Cape Town", "Stellenbosch", "Paarl", "George", "Knysna", "Hermanus", 
      "Somerset West", "Franschhoek", "Worcester", "Mossel Bay", "Oudtshoorn",
      "Swellendam", "Caledon", "Wellington", "Robertson", "Plettenberg Bay",
      "Saldanha Bay", "Malmesbury", "Bredasdorp", "Vredenburg", "Beaufort West",
      "Montagu", "Ceres", "Grabouw", "Langebaan", "Muizenberg", "Simons Town",
      "Strand", "Gordon's Bay", "Bellville", "Parow", "Mitchells Plain",
      "Khayelitsha", "Atlantis", "Fish Hoek"
    ]
  },
  {
    name: "KwaZulu-Natal",
    cities: [
      "Durban", "Pietermaritzburg", "Umhlanga", "Ballito", "Richards Bay", 
      "Newcastle", "Ladysmith", "Empangeni", "Port Shepstone", "Dundee",
      "Vryheid", "Eshowe", "Kokstad", "Scottburgh", "Margate", "Amanzimtoti",
      "Howick", "Estcourt", "Pinetown", "Chatsworth", "Phoenix", "Westville",
      "Umlazi", "Tongaat", "Stanger", "Mtunzini", "Hluhluwe", "Ixopo"
    ]
  },
  {
    name: "Eastern Cape",
    cities: [
      "Port Elizabeth", "East London", "Mthatha", "Grahamstown", "Jeffreys Bay",
      "Graaff-Reinet", "Queenstown", "Uitenhage", "King William's Town",
      "Port Alfred", "Cradock", "Fort Beaufort", "Adelaide", "Butterworth",
      "Komga", "Aliwal North", "Lady Frere", "Middleburg", "Somerset East",
      "Burgersdorp", "Despatch", "Humansdorp", "Kirkwood", "St Francis Bay",
      "Bathurst", "Alexandria"
    ]
  },
  {
    name: "Free State",
    cities: [
      "Bloemfontein", "Welkom", "Kroonstad", "Bethlehem", "Parys", "Clarens",
      "Sasolburg", "Phuthaditjhaba", "Virginia", "Bothaville", "Odendaalsrus",
      "Harrismith", "Ficksburg", "Vrede", "Heilbron", "Frankfort", "Vredefort",
      "Koffiefontein", "Trompsburg", "Marquard", "Lindley", "Ladybrand",
      "Clocolan", "Senekal", "Reitz", "Fouriesburg"
    ]
  },
  {
    name: "Limpopo",
    cities: [
      "Polokwane", "Tzaneen", "Louis Trichardt", "Mokopane", "Thohoyandou",
      "Phalaborwa", "Musina", "Giyani", "Lebowakgomo", "Modimolle", "Bela-Bela",
      "Thabazimbi", "Lephalale", "Hoedspruit", "Burgersfort", "Nkowakowa",
      "Makhado", "Groblersdal", "Marble Hall", "Messina", "Nylstroom",
      "Mokopane", "Dendron", "Duiwelskloof", "Haenertsburg"
    ]
  },
  {
    name: "Mpumalanga",
    cities: [
      "Nelspruit", "Witbank", "Secunda", "White River", "Middelburg", "Hazyview",
      "Ermelo", "Standerton", "Barberton", "Sabie", "Graskop", "Komatipoort",
      "Piet Retief", "Carolina", "Delmas", "Bethal", "Lydenburg", "Balfour",
      "Belfast", "Dullstroom", "Pilgrim's Rest", "Waterval Boven", "Machadodorp",
      "Hendrina", "eMalahleni", "Steve Tshwete", "Kinross"
    ]
  },
  {
    name: "North West",
    cities: [
      "Rustenburg", "Potchefstroom", "Klerksdorp", "Mahikeng", "Brits", "Sun City",
      "Mmabatho", "Zeerust", "Lichtenburg", "Vryburg", "Hartbeespoort",
      "Schweizer-Reneke", "Koster", "Orkney", "Stilfontein", "Wolmaransstad",
      "Groot Marico", "Madikwe", "Taung", "Ventersdorp", "Coligny", "Christiana",
      "Delareyville", "Bloemhof"
    ]
  },
  {
    name: "Northern Cape",
    cities: [
      "Kimberley", "Upington", "Springbok", "Kuruman", "De Aar", "Sutherland",
      "Kathu", "Postmasburg", "Prieska", "Carnarvon", "Calvinia", "Fraserburg",
      "Victoria West", "Hopetown", "Colesberg", "Britstown", "Richmond",
      "Douglas", "Pofadder", "Kenhardt", "Brandvlei", "Williston", "Griquatown",
      "Campbell", "Barkly West"
    ]
  }
];

export const getCitiesByProvince = (provinceName: string): string[] => {
  const province = provinces.find(p => p.name === provinceName);
  return province ? province.cities : [];
};

export const getProvinceNames = (): string[] => {
  return provinces.map(p => p.name);
};

export const getAllCities = (): string[] => {
  return provinces.flatMap(p => p.cities).sort();
};
