// A course is one or more aid stations connected by segments.
// A loop course = one Course replayed N times.
// A point-to-point course = one Course played once.

export interface Course {
  id: string;
  name: string;
  loopDistanceM: number;
  loopElevationGainM: number;
  loopElevationLossM: number;
  aidStations: AidStation[];
  segments: Segment[];
}

export interface AidStation {
  id: string;
  name: string;
  distanceMOnLoop: number; // 0 = loop start
  elevationM: number;
  crewAccess: boolean;
  dropBagAccess: boolean;
  onCourseProductIds: string[]; // products available at this aid station
  notes?: string;
}

export interface Segment {
  fromAidId: string;
  toAidId: string;
  distanceM: number;
  gainM: number;
  lossM: number;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  type: "drink_mix" | "gel" | "bar" | "candy" | "water" | "real_food";
  servingDescription: string; // human-readable, e.g. "500mL flask", "1 gel"
  servingFluidMl: number;
  carbsG: number;
  sodiumMg: number;
  caffeineMg: number;
  notes?: string;
}

export interface RunnerProfile {
  id: string;
  name: string;
  // Pace model knobs
  secPerMeterClimb: number; // default 6 (trail running)
  secPerMeterDescent: number; // default 2 (capped so segment >= 70% of flat time)
  // Hourly hydration/fueling targets
  fluidMlPerHour: number;
  sodiumMgPerHour: number;
  carbsGPerHour: number;
  // Pack capacity (single loop)
  packCapacityMl: number;
}

export interface RaceGoal {
  raceId: string;
  raceName: string;
  raceDate: string; // ISO date
  startTime: string; // HH:MM
  goalFinishTimeSec: number;
  loopCount: number;
}

export interface Plan {
  id: string;
  course: Course;
  runner: RunnerProfile;
  goal: RaceGoal;
  products: Product[]; // products this runner has available
  createdAt: string;
  updatedAt: string;
}
