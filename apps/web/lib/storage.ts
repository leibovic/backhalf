import type { Plan } from "planner-core";

const PLANS_KEY = "backhalf.plans";
const ACTIVE_PLAN_KEY = "backhalf.activePlanId";

export function loadPlans(): Record<string, Plan> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Plan>) : {};
  } catch {
    return {};
  }
}

export function savePlans(plans: Record<string, Plan>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
}

export function loadActivePlanId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_PLAN_KEY);
}

export function saveActivePlanId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id === null) {
    localStorage.removeItem(ACTIVE_PLAN_KEY);
  } else {
    localStorage.setItem(ACTIVE_PLAN_KEY, id);
  }
}

export function exportPlans(): void {
  const plans = loadPlans();
  const json = JSON.stringify(plans, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backhalf-plans-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importPlans(json: string): void {
  const parsed = JSON.parse(json) as Record<string, Plan>;
  savePlans(parsed);
}

export function clearAllData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PLANS_KEY);
  localStorage.removeItem(ACTIVE_PLAN_KEY);
}
