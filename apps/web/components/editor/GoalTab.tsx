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
  return ((h ?? 0) * 3600) + ((m ?? 0) * 60);
}

export function GoalTab() {
  const { activePlan, updateGoal } = usePlanStore();
  if (!activePlan) return null;
  const { goal } = activePlan;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Race Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Race Name</Label>
              <Input
                value={goal.raceName}
                onChange={(e) => updateGoal({ ...goal, raceName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Race Date</Label>
              <Input
                type="date"
                value={goal.raceDate}
                onChange={(e) => updateGoal({ ...goal, raceDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={goal.startTime}
                onChange={(e) => updateGoal({ ...goal, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Number of Loops</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={goal.loopCount}
                onChange={(e) =>
                  updateGoal({ ...goal, loopCount: parseInt(e.target.value) || 1 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goal Finish Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Goal Finish Time (HH:MM)</Label>
            <Input
              type="time"
              step="60"
              value={secToHHMM(goal.goalFinishTimeSec)}
              onChange={(e) => updateGoal({ ...goal, goalFinishTimeSec: hhmmToSec(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">
              Total elapsed time from start to finish (e.g. 09:55 for a sub-10h goal)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
