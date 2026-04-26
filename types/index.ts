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

export interface ScoredParkingLot extends ParkingLot {
  score?: ParkingLotScore;
  scoreStatus: "idle" | "loading" | "done" | "error";
}

export interface LotsResponse {
  lots: ParkingLot[];
  region: string;
  total: number;
}
