"use client";

import type {
  AidStation,
  Course,
  PackItem,
  Plan,
  Product,
  RaceGoal,
  RunnerProfile,
  Segment,
} from "planner-core";
import { create } from "zustand";
import {
  loadActivePlanId,
  loadPlans,
  saveActivePlanId,
  savePlans,
} from "@/lib/storage";

// Migrate plans saved before `loadouts` existed.
function migratePlan(plan: Plan): Plan {
  if (!plan.loadouts) {
    return { ...plan, loadouts: {} };
  }
  return plan;
}

interface PlanStore {
  plans: Record<string, Plan>;
  activePlanId: string | null;
  activePlan: Plan | null;

  // Lifecycle
  initFromStorage: () => void;
  createPlan: (plan: Plan) => void;
  deletePlan: (id: string) => void;
  setActivePlan: (id: string | null) => void;

  // Course editing
  updateCourse: (course: Course) => void;
  addAidStation: (station: AidStation) => void;
  updateAidStation: (station: AidStation) => void;
  removeAidStation: (id: string) => void;
  updateSegments: (segments: Segment[]) => void;

  // Runner editing
  updateRunner: (runner: RunnerProfile) => void;

  // Goal editing
  updateGoal: (goal: RaceGoal) => void;

  // Products editing
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  setProducts: (products: Product[]) => void;

  // Loadout editing (per-loop pack contents)
  setLoadout: (spanId: string, items: PackItem[]) => void;
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  plans: {},
  activePlanId: null,
  activePlan: null,

  initFromStorage: () => {
    const rawPlans = loadPlans();
    const plans: Record<string, Plan> = {};
    for (const [id, plan] of Object.entries(rawPlans)) {
      plans[id] = migratePlan(plan);
    }
    const activePlanId = loadActivePlanId();
    const activePlan = activePlanId ? (plans[activePlanId] ?? null) : null;
    set({ plans, activePlanId, activePlan });
  },

  createPlan: (plan) => {
    const plans = { ...get().plans, [plan.id]: plan };
    savePlans(plans);
    saveActivePlanId(plan.id);
    set({ plans, activePlanId: plan.id, activePlan: plan });
  },

  deletePlan: (id) => {
    const plans = { ...get().plans };
    delete plans[id];
    const activePlanId = get().activePlanId === id ? null : get().activePlanId;
    const activePlan = activePlanId ? (plans[activePlanId] ?? null) : null;
    savePlans(plans);
    saveActivePlanId(activePlanId);
    set({ plans, activePlanId, activePlan });
  },

  setActivePlan: (id) => {
    const plans = get().plans;
    const activePlan = id ? (plans[id] ?? null) : null;
    saveActivePlanId(id);
    set({ activePlanId: id, activePlan });
  },

  updateCourse: (course) => {
    const plan = get().activePlan;
    if (!plan) return;
    const updated = { ...plan, course, updatedAt: new Date().toISOString() };
    const plans = { ...get().plans, [plan.id]: updated };
    savePlans(plans);
    set({ plans, activePlan: updated });
  },

  addAidStation: (station) => {
    const plan = get().activePlan;
    if (!plan) return;
    const aidStations = [...plan.course.aidStations, station];
    get().updateCourse({ ...plan.course, aidStations });
  },

  updateAidStation: (station) => {
    const plan = get().activePlan;
    if (!plan) return;
    const aidStations = plan.course.aidStations.map((a) =>
      a.id === station.id ? station : a
    );
    get().updateCourse({ ...plan.course, aidStations });
  },

  removeAidStation: (id) => {
    const plan = get().activePlan;
    if (!plan) return;
    const aidStations = plan.course.aidStations.filter((a) => a.id !== id);
    const segments = plan.course.segments.filter(
      (s) => s.fromAidId !== id && s.toAidId !== id
    );
    get().updateCourse({ ...plan.course, aidStations, segments });
  },

  updateSegments: (segments) => {
    const plan = get().activePlan;
    if (!plan) return;
    get().updateCourse({ ...plan.course, segments });
  },

  updateRunner: (runner) => {
    const plan = get().activePlan;
    if (!plan) return;
    const updated = { ...plan, runner, updatedAt: new Date().toISOString() };
    const plans = { ...get().plans, [plan.id]: updated };
    savePlans(plans);
    set({ plans, activePlan: updated });
  },

  updateGoal: (goal) => {
    const plan = get().activePlan;
    if (!plan) return;
    const updated = { ...plan, goal, updatedAt: new Date().toISOString() };
    const plans = { ...get().plans, [plan.id]: updated };
    savePlans(plans);
    set({ plans, activePlan: updated });
  },

  addProduct: (product) => {
    const plan = get().activePlan;
    if (!plan) return;
    const products = [...plan.products, product];
    const updated = { ...plan, products, updatedAt: new Date().toISOString() };
    const plans = { ...get().plans, [plan.id]: updated };
    savePlans(plans);
    set({ plans, activePlan: updated });
  },

  updateProduct: (product) => {
    const plan = get().activePlan;
    if (!plan) return;
    const products = plan.products.map((p) => (p.id === product.id ? product : p));
    const updated = { ...plan, products, updatedAt: new Date().toISOString() };
    const plans = { ...get().plans, [plan.id]: updated };
    savePlans(plans);
    set({ plans, activePlan: updated });
  },

  removeProduct: (id) => {
    const plan = get().activePlan;
    if (!plan) return;
    const products = plan.products.filter((p) => p.id !== id);
    const updated = { ...plan, products, updatedAt: new Date().toISOString() };
    const plans = { ...get().plans, [plan.id]: updated };
    savePlans(plans);
    set({ plans, activePlan: updated });
  },

  setProducts: (products) => {
    const plan = get().activePlan;
    if (!plan) return;
    const updated = { ...plan, products, updatedAt: new Date().toISOString() };
    const plans = { ...get().plans, [plan.id]: updated };
    savePlans(plans);
    set({ plans, activePlan: updated });
  },

  setLoadout: (spanId, items) => {
    const plan = get().activePlan;
    if (!plan) return;
    const loadouts = { ...plan.loadouts };
    if (items.length === 0) {
      delete loadouts[spanId];
    } else {
      loadouts[spanId] = items;
    }
    const updated = { ...plan, loadouts, updatedAt: new Date().toISOString() };
    const plans = { ...get().plans, [plan.id]: updated };
    savePlans(plans);
    set({ plans, activePlan: updated });
  },
}));
