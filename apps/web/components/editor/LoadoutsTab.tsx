"use client";

import { useMemo } from "react";
import {
  computePace,
  loopSpanId,
  suggestLoadout,
  validateLoadout,
  type LoadoutValidation,
  type PackItem,
  type Product,
  type TargetStatus,
} from "planner-core";
import { usePlanStore } from "@/stores/planStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDuration, formatFluid } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<TargetStatus, { label: string; classes: string }> = {
  deficit: { label: "Low", classes: "bg-red-100 text-red-800 border-red-300" },
  ok: { label: "OK", classes: "bg-green-100 text-green-800 border-green-300" },
  surplus: { label: "Over", classes: "bg-amber-100 text-amber-800 border-amber-300" },
};

export function LoadoutsTab() {
  const { activePlan, setLoadout } = usePlanStore();

  const planResult = useMemo(() => {
    if (!activePlan) return null;
    if (activePlan.course.segments.length === 0 || activePlan.goal.goalFinishTimeSec <= 0) {
      return null;
    }
    return computePace(activePlan.course, activePlan.runner, activePlan.goal);
  }, [activePlan]);

  if (!activePlan) return null;

  if (!planResult) {
    return (
      <Alert>
        <AlertDescription>
          Finish setting up your course (aid stations + segments) and a goal finish time first —
          then you can plan loadouts loop-by-loop.
        </AlertDescription>
      </Alert>
    );
  }

  if (activePlan.products.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Add nutrition products to your library before planning loadouts.{" "}
          <a href="/products" className="underline font-medium">
            Open Products library →
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  const loopTimeSec = planResult.loopTimeSec;
  const loops = Array.from({ length: activePlan.goal.loopCount }, (_, i) => i + 1);

  function handleSuggest(loopNumber: number) {
    if (!activePlan) return;
    const items = suggestLoadout(loopTimeSec, activePlan.runner, activePlan.products);
    setLoadout(loopSpanId(loopNumber), items);
  }

  function handleCopyFromPrevious(loopNumber: number) {
    if (!activePlan || loopNumber <= 1) return;
    const previousItems = activePlan.loadouts[loopSpanId(loopNumber - 1)] ?? [];
    setLoadout(loopSpanId(loopNumber), [...previousItems]);
  }

  function handleClear(loopNumber: number) {
    setLoadout(loopSpanId(loopNumber), []);
  }

  function handleSetItem(loopNumber: number, productId: string, quantity: number) {
    if (!activePlan) return;
    const spanId = loopSpanId(loopNumber);
    const current = activePlan.loadouts[spanId] ?? [];
    const filtered = current.filter((it) => it.productId !== productId);
    const next: PackItem[] = quantity > 0 ? [...filtered, { productId, quantity }] : filtered;
    setLoadout(spanId, next);
  }

  function handleAddProduct(loopNumber: number, productId: string) {
    if (!activePlan || !productId) return;
    const spanId = loopSpanId(loopNumber);
    const current = activePlan.loadouts[spanId] ?? [];
    if (current.some((it) => it.productId === productId)) return;
    setLoadout(spanId, [...current, { productId, quantity: 1 }]);
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription className="text-sm">
          Plan what you&apos;ll carry out of each crew/drop-bag aid station for each loop. The
          numbers update live as you add items — green means you&apos;re on target.
        </AlertDescription>
      </Alert>

      {loops.map((loopNumber) => {
        const spanId = loopSpanId(loopNumber);
        const items = activePlan.loadouts[spanId] ?? [];
        const validation = validateLoadout(
          spanId,
          loopNumber,
          loopTimeSec,
          items,
          activePlan.products,
          activePlan.runner
        );
        return (
          <LoopLoadoutCard
            key={spanId}
            loopNumber={loopNumber}
            loopTimeSec={loopTimeSec}
            validation={validation}
            allProducts={activePlan.products}
            onSuggest={() => handleSuggest(loopNumber)}
            onCopyPrevious={loopNumber > 1 ? () => handleCopyFromPrevious(loopNumber) : undefined}
            onClear={() => handleClear(loopNumber)}
            onSetItem={(productId, qty) => handleSetItem(loopNumber, productId, qty)}
            onAddProduct={(productId) => handleAddProduct(loopNumber, productId)}
          />
        );
      })}
    </div>
  );
}

interface LoopLoadoutCardProps {
  loopNumber: number;
  loopTimeSec: number;
  validation: LoadoutValidation;
  allProducts: Product[];
  onSuggest: () => void;
  onCopyPrevious?: () => void;
  onClear: () => void;
  onSetItem: (productId: string, quantity: number) => void;
  onAddProduct: (productId: string) => void;
}

function LoopLoadoutCard({
  loopNumber,
  loopTimeSec,
  validation,
  allProducts,
  onSuggest,
  onCopyPrevious,
  onClear,
  onSetItem,
  onAddProduct,
}: LoopLoadoutCardProps) {
  const usedIds = new Set(validation.items.map((i) => i.product.id));
  const availableToAdd = allProducts.filter((p) => !usedIds.has(p.id));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base">Loop {loopNumber}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Estimated duration {formatDuration(loopTimeSec)}
            </p>
          </div>
          <div className="flex gap-2">
            {onCopyPrevious && (
              <Button variant="outline" size="sm" onClick={onCopyPrevious}>
                Copy from Loop {loopNumber - 1}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onSuggest}>
              Auto-suggest
            </Button>
            {validation.items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={onClear}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Targets vs totals */}
        <TargetGrid validation={validation} />

        {/* Item list */}
        <div className="space-y-2">
          {validation.items.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No items planned. Add products below or click Auto-suggest.
            </p>
          )}
          {validation.items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center gap-3 border rounded-md px-3 py-2"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.product.servingDescription} ·{" "}
                  {item.product.servingFluidMl > 0 && `${item.product.servingFluidMl}mL · `}
                  {item.product.carbsG}g carbs · {item.product.sodiumMg}mg Na
                  {item.product.caffeineMg > 0 && ` · ${item.product.caffeineMg}mg caf`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onSetItem(item.product.id, item.quantity - 1)}
                  aria-label="decrease"
                >
                  −
                </Button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onSetItem(item.product.id, item.quantity + 1)}
                  aria-label="increase"
                >
                  +
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add product picker */}
        {availableToAdd.length > 0 && (
          <div className="flex gap-2">
            <Select
              onValueChange={(v) => {
                if (v) onAddProduct(v);
              }}
              value=""
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Add a product…" />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <div className="space-y-1.5">
            {validation.warnings.map((w, i) => (
              <Alert
                key={i}
                variant={
                  w.startsWith("Pack over capacity") || validation.status.capacity === "over"
                    ? "destructive"
                    : "default"
                }
                className="py-2"
              >
                <AlertDescription className="text-xs">{w}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TargetGrid({ validation }: { validation: LoadoutValidation }) {
  const { totals, targets, status, packCapacityMl } = validation;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
      <Stat
        label="Fluid"
        actual={formatFluid(totals.fluidMl)}
        target={`of ${formatFluid(targets.fluidMl)}`}
        status={status.fluid}
        sub={
          status.capacity === "over"
            ? `over ${packCapacityMl}mL pack!`
            : `pack ${packCapacityMl}mL`
        }
        subRed={status.capacity === "over"}
      />
      <Stat
        label="Carbs"
        actual={`${Math.round(totals.carbsG)}g`}
        target={`of ${Math.round(targets.carbsG)}g`}
        status={status.carbs}
      />
      <Stat
        label="Sodium"
        actual={`${Math.round(totals.sodiumMg)}mg`}
        target={`of ${Math.round(targets.sodiumMg)}mg`}
        status={status.sodium}
      />
      <Stat
        label="Caffeine"
        actual={`${Math.round(totals.caffeineMg)}mg`}
        target=""
        status="ok"
      />
    </div>
  );
}

function Stat({
  label,
  actual,
  target,
  status,
  sub,
  subRed,
}: {
  label: string;
  actual: string;
  target: string;
  status: TargetStatus;
  sub?: string;
  subRed?: boolean;
}) {
  const meta = STATUS_BADGE[status];
  return (
    <div className="border rounded-lg p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {target && (
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4", meta.classes)}>
            {meta.label}
          </Badge>
        )}
      </div>
      <div className="text-lg font-bold leading-tight">{actual}</div>
      {target && <div className="text-[10px] text-muted-foreground">{target}</div>}
      {sub && (
        <div className={cn("text-[10px] mt-0.5", subRed ? "text-red-700" : "text-muted-foreground")}>
          {sub}
        </div>
      )}
    </div>
  );
}
