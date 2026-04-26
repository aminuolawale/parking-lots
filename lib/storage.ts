/**
 * Storage backend selection:
 *   - BLOB_READ_WRITE_TOKEN set  → Vercel Blob (persistent across all Lambda instances)
 *   - Vercel without Blob token  → /tmp          (per-instance, ephemeral)
 *   - Local dev                  → ./storage/    (persistent on disk)
 *
 * All public functions are async so callers are backend-agnostic.
 */

import fs from "fs";
import path from "path";
import type { ParkingLot, ParkingLotScore } from "@/types";

// ─── Backend config ───────────────────────────────────────────────────────────

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

const LOCAL_ROOT = process.env.VERCEL === "1"
  ? "/tmp/parking-scan"                   // writable on Lambda, no Blob token
  : path.join(process.cwd(), "storage");  // local dev

// Per-instance URL cache so we avoid repeated list() calls on warm Lambdas.
const blobUrlCache = new Map<string, string | null>();

// ─── Vercel Blob helpers ──────────────────────────────────────────────────────

async function blobRead(pathname: string): Promise<Buffer | null> {
  let url = blobUrlCache.get(pathname);

  if (url === undefined) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: pathname, limit: 10 });
      const exact = blobs.find((b) => b.pathname === pathname);
      url = exact?.url ?? null;
    } catch {
      url = null;
    }
    blobUrlCache.set(pathname, url);
  }

  if (!url) return null;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function blobWrite(
  pathname: string,
  data: Buffer | string,
  contentType: string
): Promise<void> {
  try {
    const { put } = await import("@vercel/blob");
    const body = typeof data === "string" ? Buffer.from(data, "utf-8") : data;
    const result = await put(pathname, body, {
      access: "public",
      addRandomSuffix: false,
      contentType,
    });
    blobUrlCache.set(pathname, result.url);
  } catch (err) {
    console.error("[storage] blobWrite failed:", pathname, err);
  }
}

// ─── Local filesystem helpers ─────────────────────────────────────────────────

function fsRead(pathname: string): Buffer | null {
  try {
    return fs.readFileSync(path.join(LOCAL_ROOT, pathname));
  } catch {
    return null;
  }
}

function fsWrite(pathname: string, data: Buffer | string): void {
  try {
    const full = path.join(LOCAL_ROOT, pathname);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, data);
  } catch (err) {
    console.error("[storage] fsWrite failed:", pathname, err);
  }
}

// ─── Generic read/write ───────────────────────────────────────────────────────

async function readFile(pathname: string): Promise<Buffer | null> {
  return USE_BLOB ? blobRead(pathname) : (fsRead(pathname) ?? null);
}

async function writeFile(
  pathname: string,
  data: Buffer | string,
  contentType = "application/octet-stream"
): Promise<void> {
  if (USE_BLOB) {
    await blobWrite(pathname, data, contentType);
  } else {
    fsWrite(pathname, data);
  }
}

// ─── Utils ────────────────────────────────────────────────────────────────────

export function citySlug(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function safeId(id: string): string {
  return id.replace(/[^a-z0-9-]/gi, "-");
}

// ─── City cache ───────────────────────────────────────────────────────────────

export interface CityCache {
  slug: string;
  query: string;
  displayName: string;
  lat: number;
  lon: number;
  lots: ParkingLot[];
  fetchedAt: string;
}

export async function loadCityCache(query: string): Promise<CityCache | null> {
  const buf = await readFile(`cities/${citySlug(query)}.json`);
  if (!buf) return null;
  try {
    return JSON.parse(buf.toString("utf-8")) as CityCache;
  } catch {
    return null;
  }
}

export async function saveCityCache(
  query: string,
  data: Omit<CityCache, "slug">
): Promise<void> {
  await writeFile(
    `cities/${citySlug(query)}.json`,
    JSON.stringify({ slug: citySlug(query), ...data }, null, 2),
    "application/json"
  );
}

// ─── Score cache ──────────────────────────────────────────────────────────────

export async function loadScore(lotId: string): Promise<ParkingLotScore | null> {
  const buf = await readFile(`scores/${safeId(lotId)}.json`);
  if (!buf) return null;
  try {
    return JSON.parse(buf.toString("utf-8")) as ParkingLotScore;
  } catch {
    return null;
  }
}

export async function saveScore(
  lotId: string,
  score: ParkingLotScore
): Promise<void> {
  await writeFile(
    `scores/${safeId(lotId)}.json`,
    JSON.stringify(score, null, 2),
    "application/json"
  );
}

// ─── Image cache ──────────────────────────────────────────────────────────────

export async function loadImageBuffer(lotId: string): Promise<Buffer | null> {
  return readFile(`images/${safeId(lotId)}.jpg`);
}

export async function saveImageBuffer(lotId: string, buf: Buffer): Promise<void> {
  await writeFile(`images/${safeId(lotId)}.jpg`, buf, "image/jpeg");
}
