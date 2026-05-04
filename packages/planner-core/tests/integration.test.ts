import { describe, expect, it } from "vitest";
import {
  sulphurSpringsCourse,
  sulphurSprings100kGoal,
  sulphurSprings100kPlan,
  sulphurSpringsRunner,
  sulphurSpringsProducts,
} from "../../../fixtures/sulphur-springs.js";
import { buildPlan } from "../src/plan";
import { computePace } from "../src/pace";
import {
  loopSpanId,
  resolveItems,
  suggestLoadout,
  targetsForDuration,
  totalsForItems,
  validateLoadout,
} from "../src/nutrition";

describe("Sulphur Springs 100K pace model", () => {
  const paceResult = computePace(
    sulphurSpringsCourse,
    sulphurSpringsRunner,
    sulphurSprings100kGoal
  );

  it("derives baseline flat pace near 339 sec/km (~5:39/km)", () => {
    // Sulphur Springs: 1825m gain, 1825m loss over 100km. With climb=2/descent=1:
    // cost = 1825*2 - 1825*1 = 1825 sec; baseline = (35700 - 1825) / 100 = 338.75 sec/km
    expect(paceResult.baselinePaceSecPerKm).toBeCloseTo(339, 0);
  });

  it("predicts per-loop time near 1:59:00 (7140s)", () => {
    const expectedLoopSec = 1 * 3600 + 59 * 60;
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
  const planResult = buildPlan(sulphurSprings100kPlan, sulphurSpringsProducts);

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

  it("each loop has a validated loadout from the user-specified plan", () => {
    for (const loop of planResult.loops) {
      expect(loop.loadout.spanId).toBe(loopSpanId(loop.loopNumber));
      expect(loop.loadout.items.length).toBeGreaterThan(0);
    }
  });

  it("loop targets scale with loop duration", () => {
    const loop1 = planResult.loops[0]!;
    const expectedHours = loop1.loopTimeSec / 3600;
    expect(loop1.loadout.targets.fluidMl).toBeCloseTo(
      sulphurSpringsRunner.fluidMlPerHour * expectedHours,
      1
    );
    expect(loop1.loadout.targets.carbsG).toBeCloseTo(
      sulphurSpringsRunner.carbsGPerHour * expectedHours,
      1
    );
  });
});

describe("validateLoadout — math correctness", () => {
  const oneHourSec = 3600;
  const runner = sulphurSpringsRunner;
  const products = sulphurSpringsProducts;

  it("computes correct totals for a known item set", () => {
    const items = [
      { productId: "skratch-hydration", quantity: 2 }, // 1000mL, 38g carbs, 800mg Na
      { productId: "sis-beta-fuel-gel", quantity: 1 }, // 0mL, 40g carbs, 0mg Na
    ];
    const v = validateLoadout("test", 1, oneHourSec, items, products, runner);
    expect(v.totals.fluidMl).toBe(1000);
    expect(v.totals.carbsG).toBe(78);
    expect(v.totals.sodiumMg).toBe(800);
    expect(v.totals.caffeineMg).toBe(0);
  });

  it("computes deltas vs hourly targets", () => {
    const items = [{ productId: "skratch-hydration", quantity: 1 }]; // 500mL, 19g, 400mg
    const v = validateLoadout("test", 1, oneHourSec, items, products, runner);
    expect(v.targets.fluidMl).toBe(600);
    expect(v.deltas.fluidMl).toBe(500 - 600);
    expect(v.deltas.carbsG).toBe(19 - 80);
    expect(v.deltas.sodiumMg).toBe(400 - 700);
    expect(v.status.fluid).toBe("deficit");
    expect(v.status.carbs).toBe("deficit");
    expect(v.status.sodium).toBe("deficit");
  });

  it("returns 'ok' status when within ±10% of target", () => {
    // 2× SiS Beta = exactly 80g carbs = 100% of target → ok
    const items = [{ productId: "sis-beta-fuel-gel", quantity: 2 }];
    const v = validateLoadout("test", 1, oneHourSec, items, products, runner);
    expect(v.status.carbs).toBe("ok");
  });

  it("classifies surplus when over +10%", () => {
    // 2× Skratch hydration = 800mg sodium vs 700mg target = +14%
    const items = [{ productId: "skratch-hydration", quantity: 2 }];
    const v = validateLoadout("test", 1, oneHourSec, items, products, runner);
    expect(v.status.sodium).toBe("surplus");
  });

  it("ignores unknown product ids gracefully", () => {
    const items = [{ productId: "nonexistent", quantity: 5 }];
    const v = validateLoadout("test", 1, oneHourSec, items, products, runner);
    expect(v.items).toHaveLength(0);
    expect(v.totals.carbsG).toBe(0);
  });

  it("warns when no items planned", () => {
    const v = validateLoadout("test", 1, oneHourSec, [], products, runner);
    expect(v.warnings.some((w) => w.includes("No items planned"))).toBe(true);
  });
});

describe("helpers", () => {
  it("targetsForDuration scales linearly with hours", () => {
    const t1 = targetsForDuration(sulphurSpringsRunner, 3600);
    const t2 = targetsForDuration(sulphurSpringsRunner, 7200);
    expect(t2.fluidMl).toBe(t1.fluidMl * 2);
    expect(t2.carbsG).toBe(t1.carbsG * 2);
    expect(t2.sodiumMg).toBe(t1.sodiumMg * 2);
  });

  it("totalsForItems handles empty list", () => {
    expect(totalsForItems([])).toEqual({ fluidMl: 0, carbsG: 0, sodiumMg: 0, caffeineMg: 0 });
  });

  it("resolveItems drops zero-quantity entries", () => {
    const resolved = resolveItems(
      [
        { productId: "skratch-hydration", quantity: 0 },
        { productId: "sis-beta-fuel-gel", quantity: 1 },
      ],
      sulphurSpringsProducts
    );
    expect(resolved).toHaveLength(1);
  });

  it("suggestLoadout produces a non-empty loadout for a 2h loop", () => {
    const items = suggestLoadout(7200, sulphurSpringsRunner, sulphurSpringsProducts);
    expect(items.length).toBeGreaterThan(0);
  });
});
