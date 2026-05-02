import type { Course, RunnerProfile, RaceGoal, Segment } from "./types";

export interface SegmentPace {
  fromAidId: string;
  toAidId: string;
  distanceM: number;
  gainM: number;
  lossM: number;
  predictedSec: number;
}

export interface PaceResult {
  baselinePaceSecPerKm: number;
  loopTimeSec: number;
  segmentPaces: SegmentPace[];
  warnings: string[];
}

export function computePace(
  course: Course,
  runner: RunnerProfile,
  goal: RaceGoal
): PaceResult {
  const { loopCount } = goal;
  const { secPerMeterClimb, secPerMeterDescent } = runner;

  const totalDistanceM = course.loopDistanceM * loopCount;
  const totalGainM = course.loopElevationGainM * loopCount;
  const totalLossM = course.loopElevationLossM * loopCount;

  const totalElevationCost = totalGainM * secPerMeterClimb - totalLossM * secPerMeterDescent;
  const baselinePaceSecPerKm =
    (goal.goalFinishTimeSec - totalElevationCost) / (totalDistanceM / 1000);

  const warnings: string[] = [];
  if (baselinePaceSecPerKm < 180) {
    warnings.push(
      `Derived flat pace is ${(baselinePaceSecPerKm / 60).toFixed(2)} min/km — that's faster than 3:00/km. Check your goal time.`
    );
  }
  if (baselinePaceSecPerKm > 720) {
    warnings.push(
      `Derived flat pace is ${(baselinePaceSecPerKm / 60).toFixed(2)} min/km — that's slower than 12:00/km. Check your goal time.`
    );
  }

  const segmentPaces = computeSegmentPaces(
    course.segments,
    baselinePaceSecPerKm,
    secPerMeterClimb,
    secPerMeterDescent
  );

  const loopTimeSec = segmentPaces.reduce((sum, s) => sum + s.predictedSec, 0);

  return { baselinePaceSecPerKm, loopTimeSec, segmentPaces, warnings };
}

function computeSegmentPaces(
  segments: Segment[],
  baselinePaceSecPerKm: number,
  secPerMeterClimb: number,
  secPerMeterDescent: number
): SegmentPace[] {
  return segments.map((seg) => {
    const flatTimeSec = (seg.distanceM / 1000) * baselinePaceSecPerKm;
    const rawTimeSec =
      flatTimeSec + seg.gainM * secPerMeterClimb - seg.lossM * secPerMeterDescent;
    // Floor at 70% of flat time so descents can't produce unreasonably fast segments
    const predictedSec = Math.max(rawTimeSec, flatTimeSec * 0.7);
    return {
      fromAidId: seg.fromAidId,
      toAidId: seg.toAidId,
      distanceM: seg.distanceM,
      gainM: seg.gainM,
      lossM: seg.lossM,
      predictedSec,
    };
  });
}
