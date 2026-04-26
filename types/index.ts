export interface ParkingLot {
  id: string;
  lat: number;
  lon: number;
  name?: string;
  surface?: string;
  capacity?: string;
  imageUrl: string;
}

export interface ParkingLotScore {
  overall: number;
  surface: number;
  markings: number;
  drainage: number;
  vegetation: number;
  summary: string;
  label: RehabLabel;
}

export type RehabLabel =
  | "Excellent Condition"
  | "Good Condition"
  | "Moderate Wear"
  | "Significant Deterioration"
  | "Critical Rehabilitation Needed";

export interface LotWithCachedScore extends ParkingLot {
  cachedScore: ParkingLotScore | null;
}

export interface ScoredParkingLot extends ParkingLot {
  score?: ParkingLotScore;
  scoreStatus: "idle" | "loading" | "done" | "error";
}

export interface LotsResponse {
  lots: LotWithCachedScore[];
  region: string;
  /** Total lots stored for this city (may exceed the requested limit). */
  storedTotal: number;
  fromCache: boolean;
}

export const LIMIT_OPTIONS = [5, 10, 15, 20, 25, 30] as const;
export type LimitOption = (typeof LIMIT_OPTIONS)[number];
export const DEFAULT_LIMIT: LimitOption = 10;
