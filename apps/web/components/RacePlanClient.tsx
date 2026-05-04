"use client";

import { Fragment, useMemo } from "react";
import { useRouter } from "next/navigation";
import { buildPlan } from "planner-core";
import { usePlanStore } from "@/stores/planStore";
import { AppHeader } from "@/components/design/Shell";
import { Alert, Btn, Card, EmptyState } from "@/components/design/Primitives";
import { Icon } from "@/components/design/Icon";

function fmtRaceDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "—";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${m}:${String(ss).padStart(2, "0")}`;
}

function formatDurationHM(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "—";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function formatPace(secPerKm: number): string {
  if (!isFinite(secPerKm)) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function RacePlanClient() {
  const router = useRouter();
  const { activePlan, products } = usePlanStore();

  const built = useMemo(() => {
    if (!activePlan) return null;
    try {
      return buildPlan(activePlan, products);
    } catch {
      return null;
    }
  }, [activePlan, products]);

  if (!activePlan) {
    return (
      <>
        <AppHeader title="Race plan" breadcrumbs={["Output", "Race plan"]} />
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

  if (!built) {
    return (
      <>
        <AppHeader
          title="Race plan"
          subtitle={activePlan.goal.raceName}
          breadcrumbs={["Output", "Race plan"]}
        />
        <EmptyState
          title="Not enough info"
          body="Add a course and runner profile to generate the race plan."
          action={
            <Btn variant="primary" onClick={() => router.push("/plan/course")}>
              Open editor
            </Btn>
          }
        />
      </>
    );
  }

  const totalGain = activePlan.course.loopElevationGainM * activePlan.goal.loopCount;

  const tableHeader: import("react").CSSProperties = {
    textAlign: "left",
    padding: "8px 12px",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--fg-tertiary)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 500,
  };

  return (
    <>
      <AppHeader
        title="Race plan"
        subtitle={activePlan.goal.raceName}
        breadcrumbs={["Output", "Race plan"]}
        actions={
          <Btn variant="ghost" size="md" onClick={() => window.print()}>
            <Icon name="print" size={12} />
            Print
          </Btn>
        }
      />
      <div className="app-scroll" style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "24px 28px 80px", maxWidth: 1200, margin: "0 auto" }}>
          {/* Hero header */}
          <Card
            style={{
              marginBottom: 18,
              padding: 0,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                padding: "26px 28px 24px",
                backgroundImage: "url(/design/topo-texture.svg)",
                backgroundSize: "400px",
                backgroundColor: "var(--bg-elevated)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 18,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--accent)",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Race plan · {fmtRaceDate(activePlan.goal.raceDate)}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 44,
                      color: "var(--fg-primary)",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      lineHeight: 1,
                    }}
                  >
                    {activePlan.goal.raceName}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--fg-secondary)",
                      marginTop: 8,
                      letterSpacing: "0.04em",
                    }}
                  >
                    Start {activePlan.goal.startTime} · {activePlan.goal.loopCount} ×{" "}
                    {(activePlan.course.loopDistanceM / 1000).toFixed(1)} km loop ·{" "}
                    {Math.round(totalGain)} m climb
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--fg-tertiary)",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    Goal time
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 64,
                      color: "var(--accent)",
                      letterSpacing: "0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {formatDurationHM(activePlan.goal.goalFinishTimeSec)}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--fg-secondary)",
                      marginTop: 4,
                    }}
                  >
                    {formatPace(built.baselinePaceSecPerKm)} /km flat-equivalent
                  </div>
                </div>
              </div>
            </div>
            {built.warnings.length > 0 && (
              <div
                style={{
                  padding: "12px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  borderTop: "1px solid var(--border)",
                }}
              >
                {built.warnings.slice(0, 3).map((w, i) => (
                  <Alert key={i} variant="warning">
                    {w}
                  </Alert>
                ))}
              </div>
            )}
          </Card>

          {/* Splits */}
          <Card style={{ marginBottom: 16 }} padding={0}>
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Icon name="activity" size={14} color="var(--accent)" />
              <h5 style={{ margin: 0 }}>Splits & pacing</h5>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border-strong)",
                      background: "var(--bg-inset)",
                    }}
                  >
                    {[
                      "Loop",
                      "Segment",
                      "Dist (km)",
                      "+/− m",
                      "Split",
                      "Cumulative",
                      "Time of day",
                    ].map((h) => (
                      <th key={h} style={tableHeader}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {built.loops.map((loop) => (
                    <Fragment key={loop.spanId}>
                      {loop.segments.map((seg, i) => (
                        <tr
                          key={`${loop.spanId}-${i}`}
                          style={{
                            borderBottom: "1px solid var(--border)",
                            background: i === 0 ? "var(--bg-elevated)" : undefined,
                          }}
                        >
                          <td
                            style={{
                              padding: "10px 12px",
                              color: "var(--accent)",
                              fontFamily: "var(--font-display)",
                              fontSize: 16,
                              letterSpacing: "0.04em",
                            }}
                          >
                            {i === 0 ? `L${loop.loopNumber}` : ""}
                          </td>
                          <td style={{ padding: "10px 12px", color: "var(--fg-primary)" }}>
                            <span style={{ color: "var(--fg-secondary)" }}>{seg.fromAidName}</span>
                            <span style={{ color: "var(--fg-tertiary)", margin: "0 6px" }}>→</span>
                            <span>{seg.toAidName}</span>
                          </td>
                          <td style={{ padding: "10px 12px", color: "var(--fg-secondary)" }}>
                            {(seg.distanceM / 1000).toFixed(1)}
                          </td>
                          <td style={{ padding: "10px 12px", color: "var(--fg-secondary)" }}>
                            <span style={{ color: "var(--topo-green)" }}>
                              +{Math.round(seg.gainM)}
                            </span>
                            <span style={{ color: "var(--fg-tertiary)" }}> · </span>
                            <span style={{ color: "var(--topo-slate)" }}>
                              −{Math.round(seg.lossM)}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", color: "var(--fg-primary)" }}>
                            {formatDuration(seg.segmentSec)}
                          </td>
                          <td style={{ padding: "10px 12px", color: "var(--fg-secondary)" }}>
                            {formatDurationHM(seg.cumulativeSec)}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              color: "var(--accent)",
                              fontWeight: 500,
                            }}
                          >
                            {seg.timeOfDay}
                          </td>
                        </tr>
                      ))}
                      <tr
                        style={{
                          borderBottom: "2px solid var(--border-strong)",
                          background: "var(--bg-inset)",
                        }}
                      >
                        <td
                          colSpan={4}
                          style={{
                            padding: "8px 12px",
                            textAlign: "right",
                            color: "var(--fg-tertiary)",
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                          }}
                        >
                          Loop {loop.loopNumber} done
                        </td>
                        <td style={{ padding: "8px 12px", color: "var(--fg-primary)" }}>
                          {formatDurationHM(loop.loopTimeSec)}
                        </td>
                        <td style={{ padding: "8px 12px", color: "var(--fg-secondary)" }}>
                          {formatDurationHM(loop.cumulativeTimeSec)}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            color: "var(--accent)",
                            fontWeight: 600,
                          }}
                        >
                          {loop.finishTimeOfDay}
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Loadouts at a glance */}
          <Card padding={0}>
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Icon name="package" size={14} color="var(--accent)" />
              <h5 style={{ margin: 0 }}>Fuel loadouts</h5>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(built.loops.length, 5)}, 1fr)`,
                gap: 0,
              }}
            >
              {built.loops.map((loop, idx) => {
                const ld = loop.loadout;
                return (
                  <div
                    key={loop.spanId}
                    className="break-inside-avoid"
                    style={{
                      padding: "16px 14px",
                      borderRight:
                        idx < built.loops.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          background: "var(--accent)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--font-display)",
                          fontSize: 12,
                        }}
                      >
                        {loop.loopNumber}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          color: "var(--fg-tertiary)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        Loop {loop.loopNumber}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        marginBottom: 12,
                      }}
                    >
                      {ld.items.length === 0 && (
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--fg-tertiary)",
                          }}
                        >
                          Nothing planned
                        </div>
                      )}
                      {ld.items.map((item, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 6,
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--fg-secondary)",
                          }}
                        >
                          <span style={{ color: "var(--fg-primary)" }}>{item.product.name}</span>
                          <span style={{ color: "var(--accent)", fontWeight: 500 }}>
                            ×{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        borderTop: "1px solid var(--border)",
                        paddingTop: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        color: "var(--fg-tertiary)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Carbs</span>
                        <span
                          style={{
                            color:
                              ld.status.carbs === "ok"
                                ? "var(--topo-green)"
                                : "var(--topo-ochre)",
                          }}
                        >
                          {Math.round(ld.totals.carbsG)}/{Math.round(ld.targets.carbsG)}g
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Sodium</span>
                        <span
                          style={{
                            color:
                              ld.status.sodium === "ok"
                                ? "var(--topo-green)"
                                : "var(--topo-ochre)",
                          }}
                        >
                          {Math.round(ld.totals.sodiumMg)}/{Math.round(ld.targets.sodiumMg)}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Fluid</span>
                        <span
                          style={{
                            color:
                              ld.status.fluid === "ok"
                                ? "var(--topo-green)"
                                : "var(--topo-ochre)",
                          }}
                        >
                          {Math.round(ld.totals.fluidMl)}mL/{Math.round(ld.targets.fluidMl)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
