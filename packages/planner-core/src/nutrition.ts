import type { PackItem, Product, RunnerProfile } from "./types";

export interface ResolvedPackItem {
  product: Product;
  quantity: number;
}

export interface NutritionTargets {
  fluidMl: number;
  carbsG: number;
  sodiumMg: number;
}

export interface NutritionTotals {
  fluidMl: number;
  carbsG: number;
  sodiumMg: number;
  caffeineMg: number;
}

export interface LoadoutValidation {
  spanId: string;
  loopNumber: number;
  spanDurationSec: number;
  items: ResolvedPackItem[];
  totals: NutritionTotals;
  targets: NutritionTargets;
  // Positive = surplus, negative = deficit.
  deltas: { fluidMl: number; carbsG: number; sodiumMg: number };
  packCapacityMl: number;
  fluidOverCapacityBy: number; // 0 if within capacity, positive if over
  status: {
    fluid: TargetStatus;
    carbs: TargetStatus;
    sodium: TargetStatus;
    capacity: "ok" | "over";
  };
  warnings: string[];
}

export type TargetStatus = "deficit" | "ok" | "surplus";
const TARGET_TOLERANCE = 0.1; // ±10% counts as "ok"

export function targetsForDuration(
  runner: RunnerProfile,
  durationSec: number
): NutritionTargets {
  const hours = durationSec / 3600;
  return {
    fluidMl: runner.fluidMlPerHour * hours,
    carbsG: runner.carbsGPerHour * hours,
    sodiumMg: runner.sodiumMgPerHour * hours,
  };
}

export function resolveItems(items: PackItem[], products: Product[]): ResolvedPackItem[] {
  const productById = new Map(products.map((p) => [p.id, p]));
  const resolved: ResolvedPackItem[] = [];
  for (const item of items) {
    const product = productById.get(item.productId);
    if (product && item.quantity > 0) {
      resolved.push({ product, quantity: item.quantity });
    }
  }
  return resolved;
}

export function totalsForItems(items: ResolvedPackItem[]): NutritionTotals {
  return items.reduce(
    (acc, item) => ({
      fluidMl: acc.fluidMl + item.product.servingFluidMl * item.quantity,
      carbsG: acc.carbsG + item.product.carbsG * item.quantity,
      sodiumMg: acc.sodiumMg + item.product.sodiumMg * item.quantity,
      caffeineMg: acc.caffeineMg + item.product.caffeineMg * item.quantity,
    }),
    { fluidMl: 0, carbsG: 0, sodiumMg: 0, caffeineMg: 0 }
  );
}

export function validateLoadout(
  spanId: string,
  loopNumber: number,
  spanDurationSec: number,
  items: PackItem[],
  products: Product[],
  runner: RunnerProfile
): LoadoutValidation {
  const resolvedItems = resolveItems(items, products);
  const targets = targetsForDuration(runner, spanDurationSec);
  const totals = totalsForItems(resolvedItems);

  const deltas = {
    fluidMl: totals.fluidMl - targets.fluidMl,
    carbsG: totals.carbsG - targets.carbsG,
    sodiumMg: totals.sodiumMg - targets.sodiumMg,
  };

  const fluidOverCapacityBy = Math.max(0, totals.fluidMl - runner.packCapacityMl);

  const status = {
    fluid: classifyStatus(totals.fluidMl, targets.fluidMl),
    carbs: classifyStatus(totals.carbsG, targets.carbsG),
    sodium: classifyStatus(totals.sodiumMg, targets.sodiumMg),
    capacity: (fluidOverCapacityBy > 0 ? "over" : "ok") as "ok" | "over",
  };

  const warnings: string[] = [];
  if (resolvedItems.length === 0) {
    warnings.push("No items planned for this loop.");
  }
  if (status.carbs === "deficit") {
    warnings.push(
      `Carbs ${pctOf(totals.carbsG, targets.carbsG)}% of target (${Math.round(totals.carbsG)}g vs ${Math.round(targets.carbsG)}g).`
    );
  }
  if (status.sodium === "deficit") {
    warnings.push(
      `Sodium ${pctOf(totals.sodiumMg, targets.sodiumMg)}% of target (${Math.round(totals.sodiumMg)}mg vs ${Math.round(targets.sodiumMg)}mg).`
    );
  }
  if (status.fluid === "deficit") {
    warnings.push(
      `Fluid ${pctOf(totals.fluidMl, targets.fluidMl)}% of target (${Math.round(totals.fluidMl)}mL vs ${Math.round(targets.fluidMl)}mL).`
    );
  }
  if (status.capacity === "over") {
    warnings.push(
      `Pack over capacity by ${Math.round(fluidOverCapacityBy)}mL (${Math.round(totals.fluidMl)}mL vs ${runner.packCapacityMl}mL pack).`
    );
  }

  return {
    spanId,
    loopNumber,
    spanDurationSec,
    items: resolvedItems,
    totals,
    targets,
    deltas,
    packCapacityMl: runner.packCapacityMl,
    fluidOverCapacityBy,
    status,
    warnings,
  };
}

function classifyStatus(actual: number, target: number): TargetStatus {
  if (target === 0) return "ok";
  const ratio = actual / target;
  if (ratio < 1 - TARGET_TOLERANCE) return "deficit";
  if (ratio > 1 + TARGET_TOLERANCE) return "surplus";
  return "ok";
}

function pctOf(actual: number, target: number): number {
  if (target === 0) return 100;
  return Math.round((actual / target) * 100);
}

// Helper for the "auto-suggest" button in the editor.
// Greedy: pick highest-density carb-and-sodium product, fill remaining fluid with first drink mix.
export function suggestLoadout(
  spanDurationSec: number,
  runner: RunnerProfile,
  products: Product[]
): PackItem[] {
  const targets = targetsForDuration(runner, spanDurationSec);
  const itemMap = new Map<string, number>();
  let fluidMl = 0;
  let carbsG = 0;
  let sodiumMg = 0;

  const MAX_ITERATIONS = 50;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (carbsG >= targets.carbsG && sodiumMg >= targets.sodiumMg) break;

    let best: Product | null = null;
    let bestScore = -1;

    for (const product of products) {
      if (product.type === "water") continue;
      if (product.servingFluidMl > 0 && fluidMl + product.servingFluidMl > runner.packCapacityMl) {
        continue;
      }
      const carbShortfall = Math.max(0, targets.carbsG - carbsG);
      const sodiumShortfall = Math.max(0, targets.sodiumMg - sodiumMg);
      const score =
        product.carbsG / Math.max(1, carbShortfall) +
        product.sodiumMg / Math.max(1, sodiumShortfall);
      if (score > bestScore) {
        bestScore = score;
        best = product;
      }
    }
    if (!best) break;
    itemMap.set(best.id, (itemMap.get(best.id) ?? 0) + 1);
    fluidMl += best.servingFluidMl;
    carbsG += best.carbsG;
    sodiumMg += best.sodiumMg;
  }

  // Fill remaining fluid capacity with first drink mix
  const drinkMix = products.find((p) => p.type === "drink_mix");
  if (drinkMix && drinkMix.servingFluidMl > 0) {
    while (fluidMl + drinkMix.servingFluidMl <= runner.packCapacityMl) {
      itemMap.set(drinkMix.id, (itemMap.get(drinkMix.id) ?? 0) + 1);
      fluidMl += drinkMix.servingFluidMl;
    }
  }

  return Array.from(itemMap.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

// Loop-course span id helper. For point-to-point this would expand.
export function loopSpanId(loopNumber: number): string {
  return `loop-${loopNumber}`;
}
