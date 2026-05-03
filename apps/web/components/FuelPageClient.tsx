"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  buildPlan,
  loopSpanId,
  suggestLoadout,
  type PackItem,
  type TargetStatus,
} from "planner-core";
import { usePlanStore } from "@/stores/planStore";
import { AppHeader } from "@/components/design/Shell";
import { Alert, Btn, Card, EmptyState, SectionHeader } from "@/components/design/Primitives";
import { Icon } from "@/components/design/Icon";

function formatDurationHM(sec: number): string {
  if (!isFinite(sec) || sec < 0) return "—";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

const STATUS_COLOR: Record<TargetStatus, string> = {
  ok: "var(--topo-green)",
  deficit: "var(--topo-ochre)",
  surplus: "var(--topo-ochre)",
};

export function FuelPageClient() {
  const router = useRouter();
  const { activePlan, setLoadout } = usePlanStore();

  const builtPlan = useMemo(() => {
    if (!activePlan) return null;
    try {
      return buildPlan(activePlan);
    } catch {
      return null;
    }
  }, [activePlan]);

  if (!activePlan) {
    return (
      <>
        <AppHeader title="Fuel" breadcrumbs={["Plan", "Fuel"]} />
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

  function setQty(spanId: string, productId: string, qty: number) {
    if (!activePlan) return;
    const existing = activePlan.loadouts[spanId] ?? [];
    const map = new Map(existing.map((i) => [i.productId, i.quantity]));
    if (qty <= 0) map.delete(productId);
    else map.set(productId, qty);
    const next: PackItem[] = Array.from(map.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));
    setLoadout(spanId, next);
  }

  function autoSuggest(spanId: string, durationSec: number) {
    if (!activePlan) return;
    const next = suggestLoadout(durationSec, activePlan.runner, activePlan.products);
    setLoadout(spanId, next);
  }

  return (
    <>
      <AppHeader
        title="Fuel"
        subtitle={activePlan.goal.raceName}
        breadcrumbs={["Plan", "Fuel"]}
      />
      <div className="app-scroll" style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "24px 28px 60px", maxWidth: 1100, margin: "0 auto" }}>
          <SectionHeader
            title="Fuel by loop"
            subtitle="Pack what you'll carry through each loop. Targets adapt to loop time and your hourly rates."
          />

          {!builtPlan ? (
            <EmptyState
              title="Set up race first"
              body="Add a course and goal time on the editor before planning fuel."
              action={
                <Btn variant="primary" onClick={() => router.push("/plan/editor")}>
                  Go to editor
                </Btn>
              }
            />
          ) : activePlan.products.length === 0 ? (
            <EmptyState
              title="No products"
              body="Add nutrition products to your library before planning fuel."
              action={
                <Btn variant="primary" onClick={() => router.push("/products")}>
                  Open products
                </Btn>
              }
            />
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {builtPlan.loops.map((loop) => {
                  const ld = loop.loadout;
                  const items = activePlan.loadouts[loopSpanId(loop.loopNumber)] ?? [];
                  return (
                    <Card key={loop.spanId} padding={0}>
                      {/* Header */}
                      <div
                        style={{
                          padding: "14px 18px",
                          borderBottom: "1px solid var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              background: "var(--accent)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "var(--font-display)",
                              fontSize: 18,
                              letterSpacing: "0.04em",
                            }}
                          >
                            {loop.loopNumber}
                          </div>
                          <div>
                            <div
                              style={{
                                fontFamily: "var(--font-display)",
                                fontSize: 18,
                                color: "var(--fg-primary)",
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                lineHeight: 1,
                              }}
                            >
                              Loop {loop.loopNumber}
                            </div>
                            <div
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                                color: "var(--fg-tertiary)",
                                marginTop: 4,
                                letterSpacing: "0.04em",
                              }}
                            >
                              {formatDurationHM(loop.loopTimeSec)} estimated · cumulative{" "}
                              {formatDurationHM(loop.cumulativeTimeSec)}
                            </div>
                          </div>
                        </div>
                        <Btn
                          variant="ghost"
                          size="sm"
                          onClick={() => autoSuggest(loop.spanId, loop.loopTimeSec)}
                        >
                          <Icon name="sparkle" size={11} />
                          Auto-fill
                        </Btn>
                      </div>

                      {/* Targets bar — 3 nutrient gauges (no pack-used per chat feedback) */}
                      <div
                        style={{
                          padding: "14px 18px",
                          borderBottom: "1px solid var(--border)",
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 18,
                        }}
                      >
                        <NutrientGauge
                          label="Carbs"
                          actual={ld.totals.carbsG}
                          target={ld.targets.carbsG}
                          unit="g"
                          status={ld.status.carbs}
                        />
                        <NutrientGauge
                          label="Sodium"
                          actual={ld.totals.sodiumMg}
                          target={ld.targets.sodiumMg}
                          unit="mg"
                          status={ld.status.sodium}
                        />
                        <NutrientGauge
                          label="Fluid"
                          actual={ld.totals.fluidMl}
                          target={ld.targets.fluidMl}
                          unit="mL"
                          status={ld.status.fluid}
                          warning={
                            ld.status.capacity === "over"
                              ? `over ${ld.packCapacityMl}mL pack`
                              : undefined
                          }
                        />
                      </div>

                      {/* Items grid */}
                      <div style={{ padding: "14px 18px" }}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                            gap: 8,
                          }}
                        >
                          {activePlan.products
                            .filter((p) => p.type !== "water")
                            .map((p) => {
                              const item = items.find((i) => i.productId === p.id);
                              const qty = item?.quantity ?? 0;
                              return (
                                <div
                                  key={p.id}
                                  style={{
                                    background:
                                      qty > 0 ? "var(--accent-subtle)" : "var(--bg-elevated)",
                                    border: `1px solid ${qty > 0 ? "var(--accent)" : "var(--border)"}`,
                                    padding: "10px 12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 10,
                                    borderRadius: 2,
                                  }}
                                >
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div
                                      style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: 12,
                                        color: "var(--fg-primary)",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {p.name}
                                    </div>
                                    <div
                                      style={{
                                        fontFamily: "var(--font-mono)",
                                        fontSize: 9,
                                        color: "var(--fg-tertiary)",
                                        marginTop: 2,
                                        letterSpacing: "0.06em",
                                      }}
                                    >
                                      {p.carbsG > 0 && `${p.carbsG}gC`}
                                      {p.carbsG > 0 && p.sodiumMg > 0 && " · "}
                                      {p.sodiumMg > 0 && `${p.sodiumMg}mgNa`}
                                      {p.servingFluidMl > 0 && ` · ${p.servingFluidMl}mL`}
                                      {p.caffeineMg > 0 && ` · ${p.caffeineMg}mg☕`}
                                    </div>
                                  </div>
                                  <QtyStepper
                                    value={qty}
                                    onChange={(v) => setQty(loop.spanId, p.id, v)}
                                  />
                                </div>
                              );
                            })}
                        </div>

                        {ld.warnings.length > 0 && (
                          <div
                            style={{
                              marginTop: 12,
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {ld.warnings.map((w, i) => (
                              <Alert
                                key={i}
                                variant={w.includes("over capacity") ? "danger" : "warning"}
                              >
                                {w}
                              </Alert>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
                <Btn variant="primary" onClick={() => router.push("/plan/race-plan")}>
                  See race plan
                  <Icon name="chevronRight" size={11} color="#fff" />
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Nutrient gauge bar ──
function NutrientGauge({
  label,
  actual,
  target,
  unit,
  status,
  warning,
}: {
  label: string;
  actual: number;
  target: number;
  unit: string;
  status: TargetStatus;
  warning?: string;
}) {
  const pct = target > 0 ? Math.min(150, (actual / target) * 100) : 0;
  const color = warning ? "var(--danger)" : STATUS_COLOR[status];
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--fg-tertiary)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-secondary)",
          }}
        >
          <span style={{ color: "var(--fg-primary)" }}>{Math.round(actual)}</span>
          <span style={{ color: "var(--fg-tertiary)" }}>
            {" "}
            / {Math.round(target)} {unit}
          </span>
        </div>
      </div>
      <div
        style={{
          height: 6,
          background: "var(--bg-inset)",
          border: "1px solid var(--border)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${Math.min(100, pct)}%`,
            background: color,
            transition: "width 200ms ease-out",
          }}
        />
        {pct > 100 && (
          <div
            style={{
              position: "absolute",
              left: "100%",
              top: -1,
              bottom: -1,
              width: `${Math.min(50, pct - 100)}%`,
              background: "var(--danger)",
              opacity: 0.6,
            }}
          />
        )}
      </div>
      {warning && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "var(--danger)",
            marginTop: 4,
            letterSpacing: "0.06em",
          }}
        >
          {warning}
        </div>
      )}
    </div>
  );
}

function QtyStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        border: "1px solid var(--border)",
        background: "var(--bg-base)",
      }}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        style={{
          width: 22,
          height: 24,
          background: "transparent",
          border: "none",
          color: "var(--fg-secondary)",
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          fontSize: 14,
        }}
      >
        −
      </button>
      <div
        style={{
          width: 24,
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: value > 0 ? "var(--accent)" : "var(--fg-tertiary)",
          fontWeight: 500,
        }}
      >
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        style={{
          width: 22,
          height: 24,
          background: "transparent",
          border: "none",
          color: "var(--fg-secondary)",
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          fontSize: 14,
        }}
      >
        +
      </button>
    </div>
  );
}
