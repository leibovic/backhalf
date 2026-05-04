"use client";

import { useRouter } from "next/navigation";
import type { Plan } from "planner-core";
import { usePlanStore } from "@/stores/planStore";
import { samplePlan } from "@/lib/sample-plan";
import { AppHeader, Screen } from "@/components/design/Shell";
import { Btn, Card, SectionHeader, Stat, StatusPill } from "@/components/design/Primitives";
import { Icon } from "@/components/design/Icon";

function fmtRaceDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatHours(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function makeNewPlan(): Plan {
  const id = `plan-${Date.now()}`;
  const now = new Date().toISOString();
  return {
    id,
    course: {
      id: `course-${Date.now()}`,
      loopDistanceM: 0,
      loopElevationGainM: 0,
      loopElevationLossM: 0,
      aidStations: [],
      segments: [],
    },
    runner: {
      id: "runner",
      name: "Runner",
      secPerMeterClimb: 2,
      secPerMeterDescent: 1,
      fluidMlPerHour: 600,
      sodiumMgPerHour: 700,
      carbsGPerHour: 80,
    },
    goal: {
      raceId: id,
      raceName: "New race",
      raceDate: "",
      startTime: "06:00",
      goalFinishTimeSec: 36000,
      loopCount: 1,
    },
    products: [],
    loadouts: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function HomeClient() {
  const router = useRouter();
  const { plans, activePlanId, createPlan, deletePlan, setActivePlan } = usePlanStore();

  const planList = Object.values(plans).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  function handleNewPlan() {
    createPlan(makeNewPlan());
    router.push("/plan/course");
  }

  function handleLoadExample() {
    const now = new Date().toISOString();
    const id = `plan-${Date.now()}`;
    createPlan({ ...samplePlan, id, createdAt: now, updatedAt: now });
    router.push("/plan/course");
  }

  function handleOpen(id: string) {
    setActivePlan(id);
    router.push("/plan/course");
  }

  function handleDuplicate(id: string) {
    const src = plans[id];
    if (!src) return;
    const newId = `plan-${Date.now()}`;
    const now = new Date().toISOString();
    const dup: Plan = {
      ...JSON.parse(JSON.stringify(src)),
      id: newId,
      goal: { ...src.goal, raceId: newId, raceName: `${src.goal.raceName} (copy)` },
      createdAt: now,
      updatedAt: now,
    };
    createPlan(dup);
  }

  function handleDelete(id: string) {
    if (planList.length <= 1) return;
    if (confirm("Delete this plan?")) deletePlan(id);
  }

  return (
    <>
      <AppHeader
        title="My races"
        subtitle={`${planList.length} race plan${planList.length === 1 ? "" : "s"}`}
        breadcrumbs={["Plan"]}
      />
      <div className="app-scroll" style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "24px 28px 60px", maxWidth: 1200, margin: "0 auto" }}>
          <SectionHeader
            title="My races"
            subtitle="A plan per race. Each one bundles the course, fuel, and pacing."
            right={
              <>
                {planList.length === 0 && (
                  <Btn variant="ghost" onClick={handleLoadExample}>
                    Load Sulphur Springs
                  </Btn>
                )}
                <Btn variant="primary" onClick={handleNewPlan}>
                  <Icon name="plus" size={13} color="#fff" />
                  New race plan
                </Btn>
              </>
            }
          />

          {planList.length === 0 ? (
            <Card style={{ marginTop: 18, padding: "60px 28px", textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 28,
                  letterSpacing: "0.08em",
                  color: "var(--fg-tertiary)",
                  textTransform: "uppercase",
                  lineHeight: 1,
                  marginBottom: 12,
                }}
              >
                No races yet
              </div>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  color: "var(--fg-secondary)",
                  maxWidth: 420,
                  lineHeight: 1.6,
                  margin: "0 auto 18px",
                }}
              >
                Create a new race plan or load the Sulphur Springs 100K example to see how
                everything fits together.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <Btn variant="primary" onClick={handleNewPlan}>
                  <Icon name="plus" size={13} color="#fff" />
                  New race plan
                </Btn>
                <Btn variant="ghost" onClick={handleLoadExample}>
                  Try Sulphur Springs 100K
                </Btn>
              </div>
            </Card>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: 14,
                marginTop: 18,
              }}
            >
              {planList.map((p) => {
                const dist = (p.course.loopDistanceM * p.goal.loopCount) / 1000;
                const isActive = p.id === activePlanId;
                return (
                  <Card key={p.id} padding={0} style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <button
                      type="button"
                      onClick={() => handleOpen(p.id)}
                      style={{
                        textAlign: "left",
                        padding: "16px 18px 14px",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--fg-primary)",
                        borderBottom: "1px solid var(--border)",
                        borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 10,
                              color: "var(--fg-tertiary)",
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              marginBottom: 4,
                            }}
                          >
                            {fmtRaceDate(p.goal.raceDate)}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-display)",
                              fontSize: 22,
                              color: "var(--fg-primary)",
                              letterSpacing: "0.04em",
                              lineHeight: 1.1,
                              textTransform: "uppercase",
                            }}
                          >
                            {p.goal.raceName || "Untitled race"}
                          </div>
                        </div>
                        {isActive && <StatusPill status="ok" label="Active" size="sm" />}
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 10,
                        }}
                      >
                        <Stat label="Distance" value={dist.toFixed(1)} unit="km" />
                        <Stat label="Goal" value={formatHours(p.goal.goalFinishTimeSec)} unit="h" />
                        <Stat label="Loops" value={p.goal.loopCount} />
                      </div>
                    </button>
                    <div
                      style={{
                        display: "flex",
                        padding: "8px 10px",
                        gap: 6,
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn variant="ghost" size="sm" onClick={() => handleOpen(p.id)}>
                          Open
                        </Btn>
                        <Btn
                          variant="bare"
                          size="sm"
                          onClick={() => handleDuplicate(p.id)}
                          title="Duplicate"
                        >
                          <Icon name="copy" size={11} />
                        </Btn>
                      </div>
                      <Btn
                        variant="bare"
                        size="sm"
                        onClick={() => handleDelete(p.id)}
                        title="Delete"
                        style={{ color: "var(--fg-tertiary)" }}
                      >
                        <Icon name="trash" size={11} />
                      </Btn>
                    </div>
                  </Card>
                );
              })}

              {/* New plan card */}
              <button
                type="button"
                onClick={handleNewPlan}
                style={{
                  background: "transparent",
                  border: "1px dashed var(--border-strong)",
                  borderRadius: 2,
                  padding: "32px 18px",
                  cursor: "pointer",
                  color: "var(--fg-tertiary)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: "var(--font-mono)",
                  minHeight: 180,
                }}
              >
                <Icon name="plus" size={20} color="var(--fg-tertiary)" />
                <div style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  New race plan
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
