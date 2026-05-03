"use client";

import type { LoopSplit, TargetStatus } from "planner-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDuration, formatFluid } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PackContentsProps {
  loops: LoopSplit[];
}

const STATUS_LABEL: Record<TargetStatus, string> = {
  deficit: "Low",
  ok: "OK",
  surplus: "Over",
};
const STATUS_CLASS: Record<TargetStatus, string> = {
  deficit: "bg-red-100 text-red-800 border-red-300",
  ok: "bg-green-100 text-green-800 border-green-300",
  surplus: "bg-amber-100 text-amber-800 border-amber-300",
};

export function PackContents({ loops }: PackContentsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {loops.map((loop) => (
        <LoadoutCard key={loop.spanId} loop={loop} />
      ))}
    </div>
  );
}

function LoadoutCard({ loop }: { loop: LoopSplit }) {
  const { loadout } = loop;
  const overCapacity = loadout.status.capacity === "over";

  return (
    <Card className="break-inside-avoid">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Loop {loop.loopNumber}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {formatDuration(loop.loopTimeSec)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Items */}
        <div className="space-y-1">
          {loadout.items.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No items planned for this loop.
            </p>
          ) : (
            loadout.items.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between text-sm">
                <span className="truncate pr-2">{item.product.name}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  ×{item.quantity}
                </Badge>
              </div>
            ))
          )}
        </div>

        {/* Validation: target vs actual per nutrient */}
        <div className="border-t pt-2 space-y-1">
          <NutrientRow
            label="Fluid"
            actual={formatFluid(loadout.totals.fluidMl)}
            target={formatFluid(loadout.targets.fluidMl)}
            status={loadout.status.fluid}
            capacityWarning={
              overCapacity ? `over ${loadout.packCapacityMl}mL pack` : undefined
            }
          />
          <NutrientRow
            label="Carbs"
            actual={`${Math.round(loadout.totals.carbsG)}g`}
            target={`${Math.round(loadout.targets.carbsG)}g`}
            status={loadout.status.carbs}
          />
          <NutrientRow
            label="Sodium"
            actual={`${Math.round(loadout.totals.sodiumMg)}mg`}
            target={`${Math.round(loadout.targets.sodiumMg)}mg`}
            status={loadout.status.sodium}
          />
          {loadout.totals.caffeineMg > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Caffeine</span>
              <span className="font-medium">{Math.round(loadout.totals.caffeineMg)}mg</span>
            </div>
          )}
        </div>

        {loadout.warnings.length > 0 && (
          <div className="space-y-1">
            {loadout.warnings.map((w, i) => (
              <Alert
                key={i}
                variant={overCapacity ? "destructive" : "default"}
                className="py-1.5"
              >
                <AlertDescription className="text-[11px]">{w}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NutrientRow({
  label,
  actual,
  target,
  status,
  capacityWarning,
}: {
  label: string;
  actual: string;
  target: string;
  status: TargetStatus;
  capacityWarning?: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium tabular-nums">{actual}</span>
        <span className="text-muted-foreground">of {target}</span>
        <Badge
          variant="outline"
          className={cn("text-[10px] px-1 py-0 h-4", STATUS_CLASS[status])}
        >
          {STATUS_LABEL[status]}
        </Badge>
        {capacityWarning && (
          <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
            {capacityWarning}
          </Badge>
        )}
      </div>
    </div>
  );
}
