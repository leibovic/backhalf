"use client";

import type { LoopSplit } from "planner-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDuration, formatFluid } from "@/lib/format";

interface PackContentsProps {
  loops: LoopSplit[];
}

export function PackContents({ loops }: PackContentsProps) {
  // If all loops have identical loadouts, show once; otherwise show per loop
  const allSame = loops.every(
    (l) => JSON.stringify(l.loadout.items) === JSON.stringify(loops[0]?.loadout.items)
  );

  if (allSame && loops.length > 0 && loops[0]) {
    return (
      <div className="space-y-3">
        <LoadoutCard
          loopLabel={`All ${loops.length} loops`}
          loadout={loops[0].loadout}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {loops.map((loop) => (
        <LoadoutCard
          key={loop.loopNumber}
          loopLabel={`Loop ${loop.loopNumber}`}
          loadout={loop.loadout}
        />
      ))}
    </div>
  );
}

function LoadoutCard({
  loopLabel,
  loadout,
}: {
  loopLabel: string;
  loadout: LoopSplit["loadout"];
}) {
  return (
    <Card className="break-inside-avoid">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{loopLabel}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {formatDuration(loadout.loopDurationSec)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          {loadout.items.map((item) => (
            <div key={item.product.id} className="flex items-center justify-between text-sm">
              <span>{item.product.name}</span>
              <Badge variant="outline" className="text-xs">
                ×{item.quantity}
              </Badge>
            </div>
          ))}
          {loadout.items.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No products in library — add products to see loadout.
            </p>
          )}
        </div>

        <div className="border-t pt-2 grid grid-cols-3 gap-1 text-xs text-center">
          <div>
            <div className="font-medium">{formatFluid(loadout.totalFluidMl)}</div>
            <div className="text-muted-foreground">
              of {formatFluid(loadout.targetFluidMl)}
            </div>
          </div>
          <div>
            <div className="font-medium">{Math.round(loadout.totalCarbsG)}g</div>
            <div className="text-muted-foreground">
              of {Math.round(loadout.targetCarbsG)}g carbs
            </div>
          </div>
          <div>
            <div className="font-medium">{Math.round(loadout.totalSodiumMg)}mg</div>
            <div className="text-muted-foreground">
              of {Math.round(loadout.targetSodiumMg)}mg Na
            </div>
          </div>
        </div>

        {loadout.totalCaffeineMg > 0 && (
          <p className="text-xs text-muted-foreground">
            {loadout.totalCaffeineMg}mg caffeine
          </p>
        )}

        {loadout.warnings.map((w, i) => (
          <Alert key={i} variant="destructive" className="py-2">
            <AlertDescription className="text-xs">{w}</AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
