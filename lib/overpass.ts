export interface OverpassElement {
  type: "way" | "relation" | "node";
  id: number;
  center?: { lat: number; lon: number };
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

export async function geocodeRegion(region: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(region)}&format=json&limit=1&addressdetails=1`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "ParkingRehabApp/1.0",
      "Accept-Language": "en",
    },
  });
  if (!res.ok) throw new Error("Geocoding request failed");
  const data = await res.json();
  if (!data.length) throw new Error(`Region "${region}" not found`);
  const { lat, lon, display_name } = data[0];
  return {
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    displayName: display_name as string,
  };
}

export async function findParkingLots(
  lat: number,
  lon: number,
  radiusMeters = 4000,
  maxResults = 50
): Promise<OverpassElement[]> {
  const query = `
[out:json][timeout:30];
(
  way["amenity"="parking"](around:${radiusMeters},${lat},${lon});
  relation["amenity"="parking"](around:${radiusMeters},${lat},${lon});
);
out body center ${maxResults} qt;
  `.trim();

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
      "User-Agent": "ParkingRehabApp/1.0",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Overpass API error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.elements ?? []) as OverpassElement[];
}
