"use client";

import { usePlanStore } from "@/stores/planStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RunnerTab() {
  const { activePlan, updateRunner } = usePlanStore();
  if (!activePlan) return null;
  const { runner } = activePlan;

  function set(key: keyof typeof runner, value: string) {
    const num = parseFloat(value);
    updateRunner({ ...runner, [key]: isNaN(num) ? runner[key] : num });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Runner Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={runner.name}
              onChange={(e) => updateRunner({ ...runner, name: e.target.value })}
            />
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
                onChange={(e) => set("secPerMeterClimb", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Default 6 (trail running)</p>
            </div>
            <div className="space-y-1.5">
              <Label>Descent Benefit (sec/meter loss)</Label>
              <Input
                type="number"
                step="0.5"
                value={runner.secPerMeterDescent}
                onChange={(e) => set("secPerMeterDescent", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Default 2 (capped at 70% of flat time)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hourly Targets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Fluid (mL/hr)</Label>
              <Input
                type="number"
                step="50"
                value={runner.fluidMlPerHour}
                onChange={(e) => set("fluidMlPerHour", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sodium (mg/hr)</Label>
              <Input
                type="number"
                step="50"
                value={runner.sodiumMgPerHour}
                onChange={(e) => set("sodiumMgPerHour", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Carbs (g/hr)</Label>
              <Input
                type="number"
                step="5"
                value={runner.carbsGPerHour}
                onChange={(e) => set("carbsGPerHour", e.target.value)}
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
          <div className="space-y-1.5">
            <Label>Pack Fluid Capacity (mL per loop)</Label>
            <Input
              type="number"
              step="100"
              value={runner.packCapacityMl}
              onChange={(e) => set("packCapacityMl", e.target.value)}
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
