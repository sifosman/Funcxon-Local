export interface Province {
  name: string;
  cities: string[];
}

export const provinces: Province[] = [
  {
    name: "Gauteng",
    cities: ["Johannesburg", "Pretoria", "Centurion", "Sandton", "Soweto", "Midrand", "Roodepoort", "Benoni", "Boksburg"]
  },
  {
    name: "Western Cape",
    cities: ["Cape Town", "Stellenbosch", "Paarl", "George", "Knysna", "Hermanus", "Somerset West", "Franschhoek"]
  },
  {
    name: "KwaZulu-Natal",
    cities: ["Durban", "Pietermaritzburg", "Umhlanga", "Ballito", "Richards Bay", "Newcastle", "Ladysmith"]
  },
  {
    name: "Eastern Cape",
    cities: ["Port Elizabeth", "East London", "Mthatha", "Grahamstown", "Jeffreys Bay", "Graaff-Reinet"]
  },
  {
    name: "Free State",
    cities: ["Bloemfontein", "Welkom", "Kroonstad", "Bethlehem", "Parys", "Clarens"]
  },
  {
    name: "Limpopo",
    cities: ["Polokwane", "Tzaneen", "Louis Trichardt", "Mokopane", "Thohoyandou", "Phalaborwa"]
  },
  {
    name: "Mpumalanga",
    cities: ["Nelspruit", "Witbank", "Secunda", "White River", "Middelburg", "Hazyview"]
  },
  {
    name: "North West",
    cities: ["Rustenburg", "Potchefstroom", "Klerksdorp", "Mahikeng", "Brits", "Sun City"]
  },
  {
    name: "Northern Cape",
    cities: ["Kimberley", "Upington", "Springbok", "Kuruman", "De Aar", "Sutherland"]
  }
];

export const getCitiesByProvince = (provinceName: string): string[] => {
  const province = provinces.find(p => p.name === provinceName);
  return province ? province.cities : [];
};

export const getProvinceNames = (): string[] => {
  return provinces.map(p => p.name);
};
