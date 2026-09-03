const KNOWN_PROVINCES = [
  'Gauteng',
  'Western Cape',
  'Eastern Cape',
  'Northern Cape',
  'North West',
  'Free State',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
];

function isKnownProvince(value: string): boolean {
  const lower = value.toLowerCase();
  return KNOWN_PROVINCES.some(
    (province) =>
      lower.includes(province.toLowerCase()) ||
      province.toLowerCase().includes(lower),
  );
}

function parseLocationToAddress(
  location: string,
): { street: string | null; city: string | null } {
  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const cleanParts = parts.filter((part) => {
    const lower = part.toLowerCase();
    return lower !== 'south africa' && !/^\d{4,}$/.test(part);
  });

  if (cleanParts.length === 0) {
    return { street: null, city: null };
  }

  if (cleanParts.length === 1) {
    const single = cleanParts[0];
    return isKnownProvince(single)
      ? { street: null, city: null }
      : { street: null, city: single };
  }

  const provinceIndex = cleanParts.findIndex(isKnownProvince);

  if (provinceIndex === -1) {
    return { street: null, city: cleanParts[0] };
  }

  const cityIndex = provinceIndex - 1;
  if (cityIndex < 0) {
    return { street: null, city: null };
  }

  const city = cleanParts[cityIndex];
  const streetParts = cleanParts.slice(0, cityIndex);

  return {
    street: streetParts.length > 0 ? streetParts.join(', ') : null,
    city,
  };
}

export function formatCardAddress(item: {
  address_line_1?: string | null;
  city?: string | null;
  province?: string | null;
  location?: string | null;
}): string {
  const street = item.address_line_1?.trim();
  const city = item.city?.trim();

  if (street && city) {
    return `${street}, ${city}`;
  }

  const parsed = item.location?.trim()
    ? parseLocationToAddress(item.location.trim())
    : null;

  if (parsed?.street && parsed?.city) {
    return `${parsed.street}, ${parsed.city}`;
  }

  if (city) {
    return item.province?.trim()
      ? `${city}, ${item.province.trim()}`
      : city;
  }

  if (street) {
    return street;
  }

  if (parsed?.city) {
    return parsed.city;
  }

  if (item.location?.trim()) {
    return item.location.trim();
  }

  return 'Location available on profile';
}
