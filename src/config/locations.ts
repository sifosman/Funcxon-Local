export interface Province {
  name: string;
  cities: string[];
}

export const provinces: Province[] = [
  {
    name: "Gauteng",
    cities: [
      "Alberton", "Alexandra", "Benoni", "Boksburg", "Brakpan", "Bronkhorstspruit",
      "Carletonville", "Centurion", "Daveyton", "Edenvale", "Evaton", "Fourways",
      "Germiston", "Heidelberg", "Isando", "Johannesburg", "Katlehong", "Kempton Park",
      "Krugersdorp", "Lenasia", "Mabopane", "Mamelodi", "Melville", "Meyerton",
      "Midrand", "Ormonde", "Parktown", "Pretoria", "Protea Glen", "Randburg",
      "Randfontein", "Roodepoort", "Rosebank", "Sandton", "Sebokeng", "Sharpeville",
      "Soweto", "Springs", "Tembisa", "Tsakane", "Vanderbijlpark", "Vereeniging",
      "Vosloorus", "Wattville", "Westonaria", "Yeoville"
    ]
  },
  {
    name: "Western Cape",
    cities: [
      "Athlone", "Atlantis", "Bellville", "Bloubergstrand", "Brackenfell", "Beaufort West",
      "Bredasdorp", "Caledon", "Cape Town", "Ceres", "Claremont", "Durbanville",
      "Fish Hoek", "Franschhoek", "Gansbaai", "George", "Grabouw", "Gordon's Bay",
      "Hermanus", "Hout Bay", "Khayelitsha", "Knysna", "Kuils River", "Langebaan",
      "Lansdowne", "Malmesbury", "Milnerton", "Mitchells Plain", "Montagu", "Mossel Bay",
      "Muizenberg", "Newlands", "Observatory", "Oudtshoorn", "Paarl", "Parow",
      "Pinelands", "Plettenberg Bay", "Robertson", "Rondebosch", "Saldanha Bay", "Sea Point",
      "Simons Town", "Somerset West", "Stellenbosch", "Strand", "Swellendam", "Table View",
      "Vredenburg", "Wellington", "Worcester", "Wynberg"
    ]
  },
  {
    name: "KwaZulu-Natal",
    cities: [
      "Amanzimtoti", "Ballito", "Chatsworth", "Dundee", "Durban", "Empangeni",
      "Eshowe", "Estcourt", "Hillcrest", "Hluhluwe", "Howick", "Ixopo",
      "Kloof", "Kokstad", "La Lucia", "Ladysmith", "Margate", "Mtunzini",
      "Newcastle", "Phoenix", "Pietermaritzburg", "Pinetown", "Port Edward", "Port Shepstone",
      "Queensburgh", "Richards Bay", "Scottburgh", "Stanger", "Tongaat", "Umhlanga",
      "Umlazi", "Vryheid", "Westville"
    ]
  },
  {
    name: "Eastern Cape",
    cities: [
      "Adelaide", "Alexandria", "Aliwal North", "Bathurst", "Bhisho", "Burgersdorp",
      "Butterworth", "Cradock", "Despatch", "East London", "Fort Beaufort", "Graaff-Reinet",
      "Grahamstown", "Humansdorp", "Jeffreys Bay", "King William's Town", "Kirkwood", "Komani",
      "Komga", "Lady Frere", "Matatiele", "Middleburg", "Mthatha", "Port Alfred",
      "Port Elizabeth", "Queenstown", "Somerset East", "St Francis Bay", "Sterkspruit", "Uitenhage"
    ]
  },
  {
    name: "Free State",
    cities: [
      "Bethlehem", "Bloemfontein", "Bothaville", "Clarens", "Clocolan", "Ficksburg",
      "Fouriesburg", "Frankfort", "Harrismith", "Heilbron", "Hennenman", "Kestell",
      "Koffiefontein", "Kroonstad", "Ladybrand", "Lindley", "Marquard", "Odendaalsrus",
      "Parys", "Phuthaditjhaba", "Reitz", "Sasolburg", "Senekal", "Trompsburg", "Villiers",
      "Virginia", "Vrede", "Vredefort", "Welkom", "Winburg"
    ]
  },
  {
    name: "Limpopo",
    cities: [
      "Bela-Bela", "Bochum", "Burgersfort", "Dendron", "Duiwelskloof", "Giyani",
      "Groblersdal", "Haenertsburg", "Hoedspruit", "Lebowakgomo", "Lephalale", "Letsitele",
      "Louis Trichardt", "Makhado", "Malamulele", "Marble Hall", "Messina", "Modimolle",
      "Modjadjiskloof", "Mokopane", "Musina", "Mutale", "Namakgale", "Nkowakowa",
      "Nylstroom", "Phalaborwa", "Polokwane", "Seshego", "Thabazimbi", "Thohoyandou",
      "Tzaneen", "Vuwani"
    ]
  },
  {
    name: "Mpumalanga",
    cities: [
      "Acornhoek", "Balfour", "Barberton", "Belfast", "Bethal", "Bushbuckridge",
      "Carolina", "Delmas", "Dullstroom", "Ermelo", "Graskop", "Hazyview",
      "Hendrina", "KaBokweni", "Kinross", "Komatipoort", "KwaMhlanga", "Lydenburg",
      "Machadodorp", "Malelane", "Middelburg", "Nelspruit", "Piet Retief", "Pilgrim's Rest",
      "Sabie", "Secunda", "Siyabuswa", "Standerton", "Steve Tshwete", "Volksrust",
      "Wakkerstroom", "Waterval Boven", "White River", "Witbank", "eMalahleni"
    ]
  },
  {
    name: "North West",
    cities: [
      "Bapong", "Bloemhof", "Brits", "Christiana", "Coligny", "Delareyville",
      "Ga-Rankuwa", "Groot Marico", "Hartbeespoort", "Itsoseng", "Klerksdorp", "Koster",
      "Lehurutshe", "Lichtenburg", "Madikwe", "Mahikeng", "Marikana", "Mmabatho",
      "Mogwase", "Mooinooi", "Orkney", "Potchefstroom", "Rustenburg", "Sannieshof",
      "Schweizer-Reneke", "Stilfontein", "Sun City", "Swartruggens", "Taung", "Ventersdorp",
      "Vryburg", "Wolmaransstad", "Zeerust"
    ]
  },
  {
    name: "Northern Cape",
    cities: [
      "Aggeneys", "Barkly West", "Brandvlei", "Britstown", "Calvinia", "Campbell",
      "Carnarvon", "Colesberg", "Daniëlskuil", "De Aar", "Douglas", "Fraserburg",
      "Griquatown", "Groblershoop", "Hartswater", "Hopetown", "Kakamas", "Kathu",
      "Kenhardt", "Kimberley", "Koopmansfontein", "Kuruman", "Loxton", "Niekerkshoop",
      "Olifantshoek", "Orania", "Pofadder", "Postmasburg", "Prieska", "Richmond",
      "Springbok", "Strydenburg", "Sutherland", "Upington", "Victoria West", "Vioolsdrif",
      "Williston"
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
