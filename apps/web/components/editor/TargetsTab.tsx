"use client";

import { usePlanStore } from "@/stores/planStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function secToHHMM(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hhmmToSec(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 3600 + (m ?? 0) * 60;
}

export function TargetsTab() {
  const { activePlan, updateRunner, updateGoal } = usePlanStore();
  if (!activePlan) return null;
  const { runner, goal } = activePlan;

  function setRunnerNum<K extends keyof typeof runner>(key: K, value: string) {
    const num = parseFloat(value);
    updateRunner({ ...runner, [key]: isNaN(num) ? runner[key] : num });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Goal Finish Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-w-xs">
            <Label>Goal Finish Time (HH:MM)</Label>
            <Input
              type="time"
              step="60"
              value={secToHHMM(goal.goalFinishTimeSec)}
              onChange={(e) =>
                updateGoal({ ...goal, goalFinishTimeSec: hhmmToSec(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              Total elapsed time from start to finish (e.g. 09:55 for a sub-10h goal)
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

      <Card>
        <CardHeader>
          <CardTitle>Pace Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Climb Cost (sec/meter gain)</Label>
              <Input
                type="number"
                step="0.5"
                value={runner.secPerMeterClimb}
                onChange={(e) => setRunnerNum("secPerMeterClimb", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Default 6 (trail running)</p>
            </div>
            <div className="space-y-1.5">
              <Label>Descent Benefit (sec/meter loss)</Label>
              <Input
                type="number"
                step="0.5"
                value={runner.secPerMeterDescent}
                onChange={(e) => setRunnerNum("secPerMeterDescent", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Default 2 (capped at 70% of flat time)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
