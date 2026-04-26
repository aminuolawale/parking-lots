// Degrees per meter at the equator; adjust for latitude below
const DEG_PER_M_LAT = 1 / 111320;
const degPerMLon = (lat: number) => 1 / (111320 * Math.cos((lat * Math.PI) / 180));

function arcgisUrl(lon: number, lat: number, radiusM = 200, w = 800, h = 500): string {
  const dLat = radiusM * DEG_PER_M_LAT * (h / w);
  const dLon = radiusM * degPerMLon(lat);
  const bbox = `${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat}`;
  return (
    `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export` +
    `?bbox=${bbox}&bboxSR=4326&size=${w},${h}&imageSR=4326&format=jpg&f=image&dpi=96`
  );
}

export function getSatelliteImageUrl(lon: number, lat: number): string {
  const token = process.env.MAPBOX_TOKEN;
  if (token) {
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lon},${lat},18/800x500@2x?access_token=${token}`;
  }
  // Free fallback: ArcGIS World Imagery (no API key required)
  return arcgisUrl(lon, lat, 200, 800, 500);
}
