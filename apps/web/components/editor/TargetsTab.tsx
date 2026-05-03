"use client";

import { usePlanStore } from "@/stores/planStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TargetsTab() {
  const { activePlan, updateRunner, updateGoal } = usePlanStore();
  if (!activePlan) return null;
  const { runner, goal } = activePlan;

  function setRunnerNum<K extends keyof typeof runner>(key: K, value: string) {
    const num = parseFloat(value);
    updateRunner({ ...runner, [key]: isNaN(num) ? runner[key] : num });
  }

  const goalHours = Math.floor(goal.goalFinishTimeSec / 3600);
  const goalMinutes = Math.floor((goal.goalFinishTimeSec % 3600) / 60);

  function setGoalDuration(hours: number, minutes: number) {
    const safeH = Math.max(0, Math.min(99, isNaN(hours) ? 0 : hours));
    const safeM = Math.max(0, Math.min(59, isNaN(minutes) ? 0 : minutes));
    updateGoal({ ...goal, goalFinishTimeSec: safeH * 3600 + safeM * 60 });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Goal Finish Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-w-xs">
            <Label>Total elapsed time from start to finish</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="99"
                value={goalHours}
                onChange={(e) => setGoalDuration(parseInt(e.target.value), goalMinutes)}
                className="w-20"
                aria-label="Hours"
              />
              <span className="text-sm text-muted-foreground">hr</span>
              <Input
                type="number"
                min="0"
                max="59"
                value={goalMinutes}
                onChange={(e) => setGoalDuration(goalHours, parseInt(e.target.value))}
                className="w-20"
                aria-label="Minutes"
              />
              <span className="text-sm text-muted-foreground">min</span>
            </div>
            <p className="text-xs text-muted-foreground">
              e.g. 9 hr 55 min for a sub-10h goal
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hourly Fueling Targets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Fluid (mL/hr)</Label>
              <Input
                type="number"
                step="50"
                value={runner.fluidMlPerHour}
                onChange={(e) => setRunnerNum("fluidMlPerHour", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Carbs (g/hr)</Label>
              <Input
                type="number"
                step="5"
                value={runner.carbsGPerHour}
                onChange={(e) => setRunnerNum("carbsGPerHour", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sodium (mg/hr)</Label>
              <Input
                type="number"
                step="50"
                value={runner.sodiumMgPerHour}
                onChange={(e) => setRunnerNum("sodiumMgPerHour", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pack Capacity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-w-xs">
            <Label>Pack Fluid Capacity (mL per loop)</Label>
            <Input
              type="number"
              step="100"
              value={runner.packCapacityMl}
              onChange={(e) => setRunnerNum("packCapacityMl", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Total fluid your pack/vest can carry (bottles + bladder)
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
