"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { computePace } from "planner-core";
import { usePlanStore } from "@/stores/planStore";
import { AppHeader } from "@/components/design/Shell";
import {
  Alert,
  Btn,
  Card,
  Field,
  Input,
  NumberInput,
  SectionHeader,
  Stat,
} from "@/components/design/Primitives";
import { Icon } from "@/components/design/Icon";

function formatPace(secPerKm: number): string {
  if (!isFinite(secPerKm)) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function PlanEditorClient() {
  const router = useRouter();
  const { activePlan, updateGoal, updateRunner } = usePlanStore();

  const paceResult = useMemo(() => {
    if (!activePlan) return null;
    try {
      return computePace(activePlan.course, activePlan.runner, activePlan.goal);
    } catch {
      return null;
    }
  }, [activePlan]);

  if (!activePlan) {
    return (
      <>
        <AppHeader title="Editor" breadcrumbs={["Plan", "Editor"]} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "var(--fg-secondary)" }}>
            <p style={{ marginBottom: 16 }}>No race plan selected.</p>
            <Btn variant="primary" onClick={() => router.push("/")}>
              Go to Races
            </Btn>
          </div>
        </div>
      </>
    );
  }

  const { goal, runner, course } = activePlan;
  const totalDist = course.loopDistanceM * goal.loopCount;
  const totalGain = course.loopElevationGainM * goal.loopCount;

  const goalH = Math.floor(goal.goalFinishTimeSec / 3600);
  const goalM = Math.floor((goal.goalFinishTimeSec % 3600) / 60);
  const setGoalHM = (h: number, m: number) =>
    updateGoal({ ...goal, goalFinishTimeSec: (h || 0) * 3600 + (m || 0) * 60 });

  return (
    <>
      <AppHeader
        title="Editor"
        subtitle={goal.raceName}
        breadcrumbs={["Plan", "Editor"]}
      />
      <div className="app-scroll" style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "24px 28px 60px", maxWidth: 1100, margin: "0 auto" }}>
          <SectionHeader
            title="Plan editor"
            subtitle="Race info, your engine, and goal time. The planner uses these to build splits."
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            {/* Race info */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="flag" size={14} color="var(--accent)" />
                <h5 style={{ margin: 0 }}>Race</h5>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Race name">
                  <Input
                    value={goal.raceName}
                    onChange={(e) => updateGoal({ ...goal, raceName: e.target.value })}
                  />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Race date">
                    <Input
                      type="date"
                      value={goal.raceDate}
                      onChange={(e) => updateGoal({ ...goal, raceDate: e.target.value })}
                    />
                  </Field>
                  <Field label="Start time">
                    <Input
                      type="time"
                      value={goal.startTime}
                      onChange={(e) => updateGoal({ ...goal, startTime: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Loop count" hint="Number of times you complete the loop course.">
                  <NumberInput
                    value={goal.loopCount}
                    min={1}
                    step={1}
                    onChange={(v) => updateGoal({ ...goal, loopCount: Math.max(1, v || 1) })}
                    suffix="loops"
                  />
                </Field>
              </div>
            </Card>

            {/* Goal time */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="activity" size={14} color="var(--accent)" />
                <h5 style={{ margin: 0 }}>Goal finish time</h5>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Hours">
                  <NumberInput
                    value={goalH}
                    min={0}
                    max={48}
                    step={1}
                    onChange={(v) => setGoalHM(v, goalM)}
                    suffix="h"
                  />
                </Field>
                <Field label="Minutes">
                  <NumberInput
                    value={goalM}
                    min={0}
                    max={59}
                    step={1}
                    onChange={(v) => setGoalHM(goalH, v)}
                    suffix="m"
                  />
                </Field>
              </div>

              <div
                style={{
                  marginTop: 18,
                  padding: "14px 0 0",
                  borderTop: "1px solid var(--border)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                }}
              >
                <Stat label="Total" value={(totalDist / 1000).toFixed(1)} unit="km" />
                <Stat label="Climb" value={Math.round(totalGain)} unit="m" />
                <Stat
                  label="Flat pace"
                  accent
                  value={paceResult ? formatPace(paceResult.baselinePaceSecPerKm) : "—"}
                  unit="/km"
                />
              </div>
              {paceResult && paceResult.warnings.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Alert variant="warning">{paceResult.warnings[0]}</Alert>
                </div>
              )}
            </Card>

            {/* Climb / descent cost */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="mountain" size={14} color="var(--accent)" />
                <h5 style={{ margin: 0 }}>Climb / descent cost</h5>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  color: "var(--fg-secondary)",
                  marginBottom: 14,
                  lineHeight: 1.6,
                }}
              >
                How much each meter of vertical changes your pace. Climbing adds time; descending
                takes a little back.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Climb cost" hint="1 flat road · 2 rolling · 4 steep · 6 power-hike">
                  <NumberInput
                    value={runner.secPerMeterClimb}
                    step={0.5}
                    min={0}
                    onChange={(v) => updateRunner({ ...runner, secPerMeterClimb: v || 0 })}
                    suffix="s/m"
                  />
                </Field>
                <Field label="Descent gain" hint="0 technical · 1 runnable · 2 smooth fast">
                  <NumberInput
                    value={runner.secPerMeterDescent}
                    step={0.5}
                    min={0}
                    onChange={(v) => updateRunner({ ...runner, secPerMeterDescent: v || 0 })}
                    suffix="s/m"
                  />
                </Field>
              </div>
            </Card>

            {/* Hourly nutrition targets */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="zap" size={14} color="var(--accent)" />
                <h5 style={{ margin: 0 }}>Hourly nutrition targets</h5>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Field label="Fluid">
                  <NumberInput
                    value={runner.fluidMlPerHour}
                    step={50}
                    min={0}
                    onChange={(v) => updateRunner({ ...runner, fluidMlPerHour: v || 0 })}
                    suffix="mL/h"
                  />
                </Field>
                <Field label="Carbs">
                  <NumberInput
                    value={runner.carbsGPerHour}
                    step={5}
                    min={0}
                    onChange={(v) => updateRunner({ ...runner, carbsGPerHour: v || 0 })}
                    suffix="g/h"
                  />
                </Field>
                <Field label="Sodium">
                  <NumberInput
                    value={runner.sodiumMgPerHour}
                    step={50}
                    min={0}
                    onChange={(v) => updateRunner({ ...runner, sodiumMgPerHour: v || 0 })}
                    suffix="mg/h"
                  />
                </Field>
                <Field label="Pack capacity" hint="Total fluid your pack/vest can carry.">
                  <NumberInput
                    value={runner.packCapacityMl}
                    step={100}
                    min={0}
                    onChange={(v) => updateRunner({ ...runner, packCapacityMl: v || 0 })}
                    suffix="mL"
                  />
                </Field>
              </div>
            </Card>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => router.push("/plan/course")}>
              Edit course
              <Icon name="chevronRight" size={11} />
            </Btn>
            <Btn variant="primary" onClick={() => router.push("/plan/race-plan")}>
              See race plan
              <Icon name="chevronRight" size={11} color="#fff" />
            </Btn>
          </div>
        </div>
      </div>
    </>
  );
}
