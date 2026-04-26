import { NextRequest, NextResponse } from "next/server";
import { geocodeRegion, findParkingLots } from "@/lib/overpass";
import { getSatelliteImageUrl } from "@/lib/mapbox";
import {
  loadCityCache,
  saveCityCache,
  loadScore,
} from "@/lib/storage";
import type { ParkingLot, LotsResponse } from "@/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
  }

  const limit = Math.min(
    Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") ?? "10", 10) || 10),
    50
  );

  try {
    let cache = loadCityCache(q);
    let fromCache = true;

    // Fetch from Overpass only when we don't yet have enough stored lots.
    if (!cache || cache.lots.length < limit) {
      fromCache = false;
      const { lat, lon, displayName } = await geocodeRegion(q);

      // Always fetch a generous amount so future requests can be served from cache.
      const fetchCount = Math.max(50, limit);
      const elements = await findParkingLots(lat, lon, 4000, fetchCount);

      const freshLots: ParkingLot[] = elements
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

      // Merge: preserve existing order, append genuinely new lots.
      const existingIds = new Set((cache?.lots ?? []).map((l) => l.id));
      const merged = [
        ...(cache?.lots ?? []),
        ...freshLots.filter((l) => !existingIds.has(l.id)),
      ];

      saveCityCache(q, {
        query: q,
        displayName,
        lat,
        lon,
        lots: merged,
        fetchedAt: new Date().toISOString(),
      });

      cache = {
        slug: "",
        query: q,
        displayName,
        lat,
        lon,
        lots: merged,
        fetchedAt: new Date().toISOString(),
      };
    }

    // Return the first `limit` lots, each annotated with its cached score (or null).
    const slice = cache.lots.slice(0, limit);
    const lots = slice.map((lot) => ({
      ...lot,
      cachedScore: loadScore(lot.id),
    }));

    const body: LotsResponse = {
      lots,
      region: cache.displayName,
      storedTotal: cache.lots.length,
      fromCache,
    };

    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
