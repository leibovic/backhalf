import { describe, expect, it } from "vitest";
import {
  sulphurSpringsCourse,
  sulphurSprings100kGoal,
  sulphurSprings100kPlan,
  sulphurSpringsRunner,
} from "../../../fixtures/sulphur-springs.js";
import { buildPlan } from "../src/plan.js";
import { computePace } from "../src/pace.js";

describe("Sulphur Springs 100K pace model", () => {
  const paceResult = computePace(
    sulphurSpringsCourse,
    sulphurSpringsRunner,
    sulphurSprings100kGoal
  );

  it("derives baseline flat pace near 284 sec/km (~4:44/km)", () => {
    expect(paceResult.baselinePaceSecPerKm).toBeCloseTo(284, 0);
  });

  it("predicts per-loop time near 1:59:00 (7140s)", () => {
    const expectedLoopSec = 1 * 3600 + 59 * 60; // 7140s
    expect(Math.abs(paceResult.loopTimeSec - expectedLoopSec)).toBeLessThanOrEqual(60);
  });

  it("segment times sum to loop time", () => {
    const segSum = paceResult.segmentPaces.reduce((s, p) => s + p.predictedSec, 0);
    expect(segSum).toBeCloseTo(paceResult.loopTimeSec, 0);
  });

  it("produces no pace warnings for the fixture", () => {
    expect(paceResult.warnings).toHaveLength(0);
  });
});

describe("Sulphur Springs 100K full plan", () => {
  const planResult = buildPlan(sulphurSprings100kPlan);

  it("total finish time within 60 seconds of goal (9:55:00)", () => {
    const goalSec = sulphurSprings100kGoal.goalFinishTimeSec;
    expect(Math.abs(planResult.totalTimeSec - goalSec)).toBeLessThanOrEqual(60);
  });

  it("produces 5 loops", () => {
    expect(planResult.loops).toHaveLength(5);
  });

  it("each loop has 4 segment splits", () => {
    for (const loop of planResult.loops) {
      expect(loop.segments).toHaveLength(4);
    }
  });

  it("finish time of day is 15:55 (6:00 start + 9:55:00)", () => {
    const lastLoop = planResult.loops[planResult.loops.length - 1];
    expect(lastLoop?.finishTimeOfDay).toBe("15:55");
  });

  it("all loops have nutrition loadouts with items", () => {
    for (const loop of planResult.loops) {
      expect(loop.loadout.items.length).toBeGreaterThan(0);
    }
  });
});
