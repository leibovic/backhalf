"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanStore } from "@/stores/planStore";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Product } from "planner-core";

const PRODUCT_TYPES: Product["type"][] = [
  "drink_mix",
  "gel",
  "bar",
  "candy",
  "water",
  "real_food",
];

const TYPE_LABELS: Record<Product["type"], string> = {
  drink_mix: "Drink Mix",
  gel: "Gel",
  bar: "Bar",
  candy: "Candy",
  water: "Water",
  real_food: "Real Food",
};

function emptyProduct(): Product {
  return {
    id: `product-${Date.now()}`,
    name: "",
    type: "gel",
    servingDescription: "1 serving",
    servingFluidMl: 0,
    carbsG: 0,
    sodiumMg: 0,
    caffeineMg: 0,
  };
}

export function ProductsClient() {
  const router = useRouter();
  const { activePlan, initFromStorage, addProduct, updateProduct, removeProduct } =
    usePlanStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Product>(emptyProduct());

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  if (!activePlan) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">No plan selected.</p>
          <Button onClick={() => router.push("/")}>Go to Plans</Button>
        </div>
      </div>
    );
  }

  function openNew() {
    const p = emptyProduct();
    setDraft(p);
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setDraft({ ...product });
    setEditing(product);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!draft.name.trim()) return;
    if (editing) {
      updateProduct(draft);
    } else {
      addProduct(draft);
    }
    setDialogOpen(false);
  }

  function setField<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar raceName={activePlan.goal.raceName} />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Products Library</h1>
          <Button onClick={openNew}>Add Product</Button>
        </div>

        {activePlan.products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="mb-4">No products yet. Add the nutrition products you carry.</p>
            <Button onClick={openNew}>Add Product</Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activePlan.products.map((product) => (
              <Card key={product.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm">{product.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {product.servingDescription}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {TYPE_LABELS[product.type]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                    {product.servingFluidMl > 0 && (
                      <span>{product.servingFluidMl} mL</span>
                    )}
                    <span>{product.carbsG}g carbs</span>
                    <span>{product.sodiumMg}mg sodium</span>
                    {product.caffeineMg > 0 && (
                      <span>{product.caffeineMg}mg caffeine</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(product)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Remove "${product.name}"?`)) removeProduct(product.id);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={draft.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. SiS Beta Fuel Gel"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={draft.type}
                  onValueChange={(v) => setField("type", v as Product["type"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Serving Description</Label>
                <Input
                  value={draft.servingDescription}
                  onChange={(e) => setField("servingDescription", e.target.value)}
                  placeholder="1 gel"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fluid (mL)</Label>
                <Input
                  type="number"
                  min="0"
                  value={draft.servingFluidMl}
                  onChange={(e) =>
                    setField("servingFluidMl", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Carbs (g)</Label>
                <Input
                  type="number"
                  min="0"
                  value={draft.carbsG}
                  onChange={(e) => setField("carbsG", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sodium (mg)</Label>
                <Input
                  type="number"
                  min="0"
                  value={draft.sodiumMg}
                  onChange={(e) => setField("sodiumMg", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Caffeine (mg)</Label>
                <Input
                  type="number"
                  min="0"
                  value={draft.caffeineMg}
                  onChange={(e) =>
                    setField("caffeineMg", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!draft.name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
