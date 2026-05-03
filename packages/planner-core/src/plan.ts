import { loopSpanId, validateLoadout, type LoadoutValidation } from "./nutrition";
import { computePace, type SegmentPace } from "./pace";
import type { Plan } from "./types";

export interface SegmentSplit {
  fromAidId: string;
  toAidId: string;
  fromAidName: string;
  toAidName: string;
  distanceM: number;
  gainM: number;
  lossM: number;
  segmentSec: number;
  cumulativeSec: number;
  timeOfDay: string; // HH:MM
}

export interface LoopSplit {
  loopNumber: number;
  spanId: string;
  segments: SegmentSplit[];
  loopTimeSec: number;
  cumulativeTimeSec: number;
  finishTimeOfDay: string;
  loadout: LoadoutValidation;
}

export interface PlanResult {
  baselinePaceSecPerKm: number;
  totalTimeSec: number;
  loops: LoopSplit[];
  warnings: string[];
}

export function buildPlan(plan: Plan): PlanResult {
  const { course, runner, goal } = plan;

  const paceResult = computePace(course, runner, goal);

  const [startHour, startMin] = goal.startTime.split(":").map(Number);
  const startSec = (startHour ?? 0) * 3600 + (startMin ?? 0) * 60;

  const aidById = new Map(course.aidStations.map((a) => [a.id, a]));

  const loops: LoopSplit[] = [];
  let cumulativeSec = 0;

  for (let i = 0; i < goal.loopCount; i++) {
    const loopNumber = i + 1;
    const spanId = loopSpanId(loopNumber);
    const loopSegments = buildLoopSegments(
      paceResult.segmentPaces,
      aidById,
      cumulativeSec,
      startSec
    );

    cumulativeSec += paceResult.loopTimeSec;
    const finishTimeOfDay = formatTimeOfDay(startSec + cumulativeSec);

    const items = plan.loadouts[spanId] ?? [];
    const loadout = validateLoadout(
      spanId,
      loopNumber,
      paceResult.loopTimeSec,
      items,
      plan.products,
      runner
    );

    loops.push({
      loopNumber,
      spanId,
      segments: loopSegments,
      loopTimeSec: paceResult.loopTimeSec,
      cumulativeTimeSec: cumulativeSec,
      finishTimeOfDay,
      loadout,
    });
  }

  const allWarnings = [
    ...paceResult.warnings,
    ...loops.flatMap((l) => l.loadout.warnings.map((w) => `Loop ${l.loopNumber}: ${w}`)),
  ];

  return {
    baselinePaceSecPerKm: paceResult.baselinePaceSecPerKm,
    totalTimeSec: cumulativeSec,
    loops,
    warnings: allWarnings,
  };
}

function buildLoopSegments(
  segmentPaces: SegmentPace[],
  aidById: Map<string, { name: string }>,
  loopStartSec: number,
  raceStartSec: number
): SegmentSplit[] {
  const splits: SegmentSplit[] = [];
  let cumSec = loopStartSec;

  for (const sp of segmentPaces) {
    cumSec += sp.predictedSec;
    splits.push({
      fromAidId: sp.fromAidId,
      toAidId: sp.toAidId,
      fromAidName: aidById.get(sp.fromAidId)?.name ?? sp.fromAidId,
      toAidName: aidById.get(sp.toAidId)?.name ?? sp.toAidId,
      distanceM: sp.distanceM,
      gainM: sp.gainM,
      lossM: sp.lossM,
      segmentSec: sp.predictedSec,
      cumulativeSec: cumSec,
      timeOfDay: formatTimeOfDay(raceStartSec + cumSec),
    });
  }

  return splits;
}

function formatTimeOfDay(totalSec: number): string {
  const sec = Math.round(totalSec) % 86400;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
