import type { Plan, Product } from "./types";

export interface PackItem {
  product: Product;
  quantity: number;
}

export interface LoopLoadout {
  loopNumber: number;
  loopDurationSec: number;
  items: PackItem[];
  totalFluidMl: number;
  totalCarbsG: number;
  totalSodiumMg: number;
  totalCaffeineMg: number;
  targetFluidMl: number;
  targetCarbsG: number;
  targetSodiumMg: number;
  warnings: string[];
}

export function computeNutrition(plan: Plan, loopTimeSec: number): LoopLoadout[] {
  const { runner, goal, products } = plan;
  const loopDurationHours = loopTimeSec / 3600;

  const targetFluidMl = runner.fluidMlPerHour * loopDurationHours;
  const targetSodiumMg = runner.sodiumMgPerHour * loopDurationHours;
  const targetCarbsG = runner.carbsGPerHour * loopDurationHours;

  const loadouts: LoopLoadout[] = [];

  for (let loop = 1; loop <= goal.loopCount; loop++) {
    const loadout = greedyFill(
      products,
      targetFluidMl,
      targetCarbsG,
      targetSodiumMg,
      runner.packCapacityMl,
      loopTimeSec,
      loop
    );
    loadouts.push(loadout);
  }

  return loadouts;
}

function greedyFill(
  products: Product[],
  targetFluidMl: number,
  targetCarbsG: number,
  targetSodiumMg: number,
  packCapacityMl: number,
  loopDurationSec: number,
  loopNumber: number
): LoopLoadout {
  const items: Map<string, { product: Product; quantity: number }> = new Map();
  let fluidMl = 0;
  let carbsG = 0;
  let sodiumMg = 0;

  // Greedy: pick product that covers largest remaining shortfall per iteration
  const MAX_ITERATIONS = 50;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (carbsG >= targetCarbsG && sodiumMg >= targetSodiumMg) break;

    let bestProduct: Product | null = null;
    let bestScore = -1;

    for (const product of products) {
      // Skip if adding this product would exceed pack fluid capacity
      if (product.servingFluidMl > 0 && fluidMl + product.servingFluidMl > packCapacityMl) {
        continue;
      }
      // Skip water unless we have remaining fluid capacity and other targets are met
      if (product.type === "water") continue;

      const carbShortfall = Math.max(0, targetCarbsG - carbsG);
      const sodiumShortfall = Math.max(0, targetSodiumMg - sodiumMg);
      const score =
        (product.carbsG / Math.max(1, carbShortfall)) +
        (product.sodiumMg / Math.max(1, sodiumShortfall));

      if (score > bestScore) {
        bestScore = score;
        bestProduct = product;
      }
    }

    if (!bestProduct) break;

    const existing = items.get(bestProduct.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.set(bestProduct.id, { product: bestProduct, quantity: 1 });
    }
    fluidMl += bestProduct.servingFluidMl;
    carbsG += bestProduct.carbsG;
    sodiumMg += bestProduct.sodiumMg;
  }

  // Fill remaining fluid capacity with preferred drink mix (first drink_mix)
  const drinkMix = products.find((p) => p.type === "drink_mix");
  if (drinkMix) {
    while (fluidMl + drinkMix.servingFluidMl <= packCapacityMl) {
      const existing = items.get(drinkMix.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        items.set(drinkMix.id, { product: drinkMix, quantity: 1 });
      }
      fluidMl += drinkMix.servingFluidMl;
      carbsG += drinkMix.carbsG;
      sodiumMg += drinkMix.sodiumMg;
    }
  }

  const packItems = Array.from(items.values()).map((v) => ({
    product: v.product,
    quantity: v.quantity,
  }));

  const totalCaffeineMg = packItems.reduce(
    (sum, item) => sum + item.product.caffeineMg * item.quantity,
    0
  );

  const warnings: string[] = [];
  if (targetCarbsG > 0 && carbsG < targetCarbsG * 0.9) {
    warnings.push(
      `Carbs: target ${targetCarbsG.toFixed(0)}g, only achieved ${carbsG.toFixed(0)}g (${((carbsG / targetCarbsG) * 100).toFixed(0)}%)`
    );
  }
  if (targetSodiumMg > 0 && sodiumMg < targetSodiumMg * 0.9) {
    warnings.push(
      `Sodium: target ${targetSodiumMg.toFixed(0)}mg, only achieved ${sodiumMg.toFixed(0)}mg (${((sodiumMg / targetSodiumMg) * 100).toFixed(0)}%)`
    );
  }

  return {
    loopNumber,
    loopDurationSec,
    items: packItems,
    totalFluidMl: fluidMl,
    totalCarbsG: carbsG,
    totalSodiumMg: sodiumMg,
    totalCaffeineMg,
    targetFluidMl,
    targetCarbsG,
    targetSodiumMg,
    warnings,
  };
}
