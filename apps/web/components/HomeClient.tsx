"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlanStore } from "@/stores/planStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "@/lib/format";
import { samplePlan } from "@/lib/sample-plan";
import type { Plan } from "planner-core";

export function HomeClient() {
  const router = useRouter();
  const { plans, activePlanId, initFromStorage, createPlan, deletePlan, setActivePlan } =
    usePlanStore();

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  const planList = Object.values(plans).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  function handleNewPlan() {
    const now = new Date().toISOString();
    const id = `plan-${Date.now()}`;
    const plan: Plan = {
      id,
      course: {
        id: `course-${Date.now()}`,
        name: "My Course",
        loopDistanceM: 0,
        loopElevationGainM: 0,
        loopElevationLossM: 0,
        aidStations: [],
        segments: [],
      },
      runner: {
        id: "runner",
        name: "Runner",
        secPerMeterClimb: 6,
        secPerMeterDescent: 2,
        fluidMlPerHour: 600,
        sodiumMgPerHour: 700,
        carbsGPerHour: 80,
        packCapacityMl: 1500,
      },
      goal: {
        raceId: id,
        raceName: "My Race",
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
    createPlan(plan);
    router.push("/plan/editor");
  }

  function handleLoadExample() {
    const now = new Date().toISOString();
    const plan = {
      ...samplePlan,
      createdAt: now,
      updatedAt: now,
    };
    createPlan(plan);
    router.push("/plan/editor");
  }

  function handleOpen(id: string) {
    setActivePlan(id);
    router.push("/plan/editor");
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm("Delete this plan?")) {
      deletePlan(id);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Backhalf</h1>
            <p className="text-sm text-muted-foreground">Ultra Race Planner</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/settings")}>
              Settings
            </Button>
            <Button size="sm" onClick={handleNewPlan}>
              New Plan
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {planList.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-lg font-semibold mb-2">No plans yet</h2>
            <p className="text-muted-foreground mb-6">
              Create a new plan or load the Sulphur Springs 100K example to get started.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleNewPlan}>New Plan</Button>
              <Button variant="outline" onClick={handleLoadExample}>
                Try Sulphur Springs 100K
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Your Plans</h2>
              <Button variant="outline" size="sm" onClick={handleLoadExample}>
                Load Example
              </Button>
            </div>
            <div className="grid gap-3">
              {planList.map((plan) => (
                <Card
                  key={plan.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleOpen(plan.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{plan.goal.raceName}</CardTitle>
                      <div className="flex items-center gap-2">
                        {plan.id === activePlanId && (
                          <Badge variant="secondary">Active</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive h-7 px-2"
                          onClick={(e) => handleDelete(plan.id, e)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{plan.course.name}</span>
                      <span>{formatDistance(plan.course.loopDistanceM * plan.goal.loopCount)}</span>
                      {plan.goal.raceDate && <span>{plan.goal.raceDate}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
