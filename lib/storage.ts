import fs from "fs";
import path from "path";
import type { ParkingLot, ParkingLotScore } from "@/types";

const ROOT = path.join(process.cwd(), "storage");
const CITIES_DIR = path.join(ROOT, "cities");
const SCORES_DIR = path.join(ROOT, "scores");
const IMAGES_DIR = path.join(ROOT, "images");

function mkdirp(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Deterministic, filesystem-safe slug from a user query string. */
export function citySlug(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Safe filename component from an arbitrary lot ID like "way-123456". */
function safeId(id: string): string {
  return id.replace(/[^a-z0-9-]/gi, "-");
}

// ─── City cache ──────────────────────────────────────────────────────────────

export interface CityCache {
  slug: string;
  query: string;
  displayName: string;
  lat: number;
  lon: number;
  lots: ParkingLot[];
  fetchedAt: string;
}

export function loadCityCache(query: string): CityCache | null {
  try {
    const raw = fs.readFileSync(
      path.join(CITIES_DIR, `${citySlug(query)}.json`),
      "utf-8"
    );
    return JSON.parse(raw) as CityCache;
  } catch {
    return null;
  }
}

export function saveCityCache(
  query: string,
  data: Omit<CityCache, "slug">
): void {
  mkdirp(CITIES_DIR);
  fs.writeFileSync(
    path.join(CITIES_DIR, `${citySlug(query)}.json`),
    JSON.stringify({ slug: citySlug(query), ...data }, null, 2)
  );
}

// ─── Score cache ─────────────────────────────────────────────────────────────

export function loadScore(lotId: string): ParkingLotScore | null {
  try {
    const raw = fs.readFileSync(
      path.join(SCORES_DIR, `${safeId(lotId)}.json`),
      "utf-8"
    );
    return JSON.parse(raw) as ParkingLotScore;
  } catch {
    return null;
  }
}

export function saveScore(lotId: string, score: ParkingLotScore): void {
  mkdirp(SCORES_DIR);
  fs.writeFileSync(
    path.join(SCORES_DIR, `${safeId(lotId)}.json`),
    JSON.stringify(score, null, 2)
  );
}

// ─── Image cache ─────────────────────────────────────────────────────────────

export function loadImageBuffer(lotId: string): Buffer | null {
  try {
    return fs.readFileSync(path.join(IMAGES_DIR, `${safeId(lotId)}.jpg`));
  } catch {
    return null;
  }
}

export function saveImageBuffer(lotId: string, buf: Buffer): void {
  mkdirp(IMAGES_DIR);
  fs.writeFileSync(path.join(IMAGES_DIR, `${safeId(lotId)}.jpg`), buf);
}
