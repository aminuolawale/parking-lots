import { NextRequest, NextResponse } from "next/server";
import { geocodeRegion, findParkingLots } from "@/lib/overpass";
import { getSatelliteImageUrl } from "@/lib/mapbox";
import type { ParkingLot } from "@/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
  }

  try {
    const { lat, lon, displayName } = await geocodeRegion(q);
    const elements = await findParkingLots(lat, lon, 4000);

    const lots: ParkingLot[] = elements
      .filter((el) => el.center || (el.lat != null && el.lon != null))
      .map((el) => {
        const clat = el.center?.lat ?? el.lat!;
        const clon = el.center?.lon ?? el.lon!;
        return {
          id: `${el.type}-${el.id}`,
          lat: clat,
          lon: clon,
          name: el.tags?.name,
          surface: el.tags?.surface,
          capacity: el.tags?.capacity,
          imageUrl: getSatelliteImageUrl(clon, clat),
        };
      });

    return NextResponse.json({ lots, region: displayName, total: lots.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
