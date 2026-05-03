export type {
  AidStation,
  Course,
  PackItem,
  Plan,
  Product,
  RaceGoal,
  RunnerProfile,
  Segment,
} from "./types";
export {
  buildPlan,
  type SegmentSplit,
  type LoopSplit,
  type PlanResult,
} from "./plan";
export { computePace } from "./pace";
export {
  loopSpanId,
  resolveItems,
  suggestLoadout,
  targetsForDuration,
  totalsForItems,
  validateLoadout,
  type LoadoutValidation,
  type NutritionTargets,
  type NutritionTotals,
  type ResolvedPackItem,
  type TargetStatus,
} from "./nutrition";
