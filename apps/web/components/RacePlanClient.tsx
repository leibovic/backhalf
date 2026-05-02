"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePlanStore } from "@/stores/planStore";
import { buildPlan } from "planner-core";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SplitsTable } from "@/components/SplitsTable";
import { PackContents } from "@/components/PackContents";
import { formatDuration, formatPace, formatDistance, formatFluid } from "@/lib/format";

export function RacePlanClient() {
  const router = useRouter();
  const { activePlan, initFromStorage } = usePlanStore();

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const planResult = useMemo(() => {
    if (!activePlan) return null;
    try {
      return buildPlan(activePlan);
    } catch {
      return null;
    }
  }, [activePlan]);

  if (!activePlan) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">No plan selected.</p>
          <Button onClick={() => router.push("/")}>Go to Plans</Button>
        </div>
      </div>
    );
  }

  const canCompute =
    activePlan.course.segments.length > 0 && activePlan.goal.goalFinishTimeSec > 0;

  return (
    <div className="min-h-screen bg-background">
      <NavBar raceName={activePlan.goal.raceName} />

      <div className="max-w-5xl mx-auto px-4 py-6 print:py-2 print:px-0">
        {/* Header — visible in print */}
        <div className="mb-6 print:mb-3">
          <div className="flex items-center justify-between print:hidden">
            <h1 className="text-xl font-semibold">{activePlan.goal.raceName}</h1>
            <Button variant="outline" onClick={() => window.print()}>
              Print
            </Button>
          </div>
          <div className="hidden print:block">
            <h1 className="text-2xl font-bold">{activePlan.goal.raceName}</h1>
          </div>

          {canCompute && planResult && (
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">
                  {formatDistance(activePlan.course.loopDistanceM * activePlan.goal.loopCount)}
                </span>{" "}
                total
              </span>
              <span>
                <span className="font-medium text-foreground">
                  {activePlan.goal.loopCount}
                </span>{" "}
                {activePlan.goal.loopCount === 1 ? "loop" : "loops"}
              </span>
              <span>
                Start{" "}
                <span className="font-medium text-foreground">{activePlan.goal.startTime}</span>
              </span>
              <span>
                Goal{" "}
                <span className="font-medium text-foreground">
                  {formatDuration(activePlan.goal.goalFinishTimeSec)}
                </span>
              </span>
              <span>
                Baseline pace{" "}
                <span className="font-medium text-foreground">
                  {formatPace(planResult.baselinePaceSecPerKm)}
                </span>
              </span>
            </div>
          )}
        </div>

        {!canCompute && (
          <Alert className="mb-6">
            <AlertDescription>
              Complete your course setup (add aid stations and segments) and set a goal finish time
              to see your race plan.
            </AlertDescription>
          </Alert>
        )}

        {planResult?.warnings && planResult.warnings.length > 0 && (
          <div className="space-y-2 mb-6">
            {planResult.warnings.map((w, i) => (
              <Alert key={i} variant="destructive">
                <AlertDescription>{w}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {canCompute && planResult && (
          <div className="space-y-8 print:space-y-4">
            {/* Hourly targets summary */}
            <section>
              <h2 className="text-base font-semibold mb-3">Hourly Targets</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="border rounded-lg p-3">
                  <div className="text-lg font-bold">
                    {formatFluid(activePlan.runner.fluidMlPerHour)}
                  </div>
                  <div className="text-xs text-muted-foreground">Fluid / hr</div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-lg font-bold">
                    {activePlan.runner.carbsGPerHour}g
                  </div>
                  <div className="text-xs text-muted-foreground">Carbs / hr</div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-lg font-bold">
                    {activePlan.runner.sodiumMgPerHour}mg
                  </div>
                  <div className="text-xs text-muted-foreground">Sodium / hr</div>
                </div>
              </div>
            </section>

            {/* Splits */}
            <section>
              <h2 className="text-base font-semibold mb-3">Splits</h2>
              <SplitsTable loops={planResult.loops} loopCount={activePlan.goal.loopCount} />
            </section>

            {/* Per-loop pack contents */}
            <section>
              <h2 className="text-base font-semibold mb-3">Pack Contents</h2>
              <PackContents loops={planResult.loops} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
