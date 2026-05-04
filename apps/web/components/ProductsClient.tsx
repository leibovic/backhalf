"use client";

import type { Product } from "planner-core";
import { usePlanStore } from "@/stores/planStore";
import { AppHeader } from "@/components/design/Shell";
import {
  Btn,
  Card,
  Input,
  NumberInput,
  SectionHeader,
} from "@/components/design/Primitives";
import { Icon } from "@/components/design/Icon";

const PRODUCT_TYPES: Product["type"][] = [
  "gel",
  "drink_mix",
  "bar",
  "candy",
  "tablet",
  "water",
  "real_food",
];

const TYPE_LABELS: Record<Product["type"], string> = {
  drink_mix: "drink mix",
  gel: "gel",
  bar: "bar",
  candy: "candy",
  water: "water",
  tablet: "tablet",
  real_food: "real food",
};

export function ProductsClient() {
  const { products, addProduct, updateProduct, removeProduct } = usePlanStore();

  function handleAdd() {
    const id = `custom-${Date.now()}`;
    addProduct({
      id,
      name: "New product",
      type: "gel",
      servingDescription: "1 serving",
      servingFluidMl: 0,
      carbsG: 25,
      sodiumMg: 0,
      caffeineMg: 0,
    });
  }

  const tableHeader: import("react").CSSProperties = {
    textAlign: "left",
    padding: "10px 12px",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--fg-tertiary)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 500,
  };

  const selectStyle: import("react").CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    background: "var(--bg-inset)",
    color: "var(--fg-primary)",
    border: "1px solid var(--border)",
    borderRadius: 2,
    padding: "6px 8px",
    outline: "none",
    width: "100%",
  };

  return (
    <>
      <AppHeader
        title="Products"
        subtitle="Shared across all your race plans"
        breadcrumbs={["Library", "Products"]}
      />
      <div className="app-scroll" style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "24px 28px 60px", maxWidth: 1200, margin: "0 auto" }}>
          <SectionHeader
            title="Product library"
            subtitle="Real fuel from the real world. Used across all your race plans."
            right={
              <Btn variant="primary" onClick={handleAdd}>
                <Icon name="plus" size={13} color="#fff" />
                Add product
              </Btn>
            }
          />

          <Card padding={0}>
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border-strong)",
                      background: "var(--bg-inset)",
                    }}
                  >
                    {[
                      "Product",
                      "Type",
                      "Serving",
                      "Fluid (mL)",
                      "Carbs (g)",
                      "Sodium (mg)",
                      "Caffeine (mg)",
                      "",
                    ].map((h) => (
                      <th key={h} style={tableHeader}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 12px", minWidth: 200 }}>
                        <Input
                          value={p.name}
                          onChange={(e) => updateProduct({ ...p, name: e.target.value })}
                          style={{
                            background: "transparent",
                            border: "1px solid transparent",
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <select
                          value={p.type}
                          onChange={(e) =>
                            updateProduct({ ...p, type: e.target.value as Product["type"] })
                          }
                          style={selectStyle}
                        >
                          {PRODUCT_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "8px 12px", minWidth: 140 }}>
                        <Input
                          value={p.servingDescription}
                          onChange={(e) =>
                            updateProduct({ ...p, servingDescription: e.target.value })
                          }
                          style={{
                            background: "transparent",
                            border: "1px solid transparent",
                          }}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", width: 100 }}>
                        <NumberInput
                          value={p.servingFluidMl}
                          step={50}
                          min={0}
                          onChange={(v) => updateProduct({ ...p, servingFluidMl: v })}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", width: 100 }}>
                        <NumberInput
                          value={p.carbsG}
                          step={1}
                          min={0}
                          onChange={(v) => updateProduct({ ...p, carbsG: v })}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", width: 100 }}>
                        <NumberInput
                          value={p.sodiumMg}
                          step={10}
                          min={0}
                          onChange={(v) => updateProduct({ ...p, sodiumMg: v })}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", width: 100 }}>
                        <NumberInput
                          value={p.caffeineMg}
                          step={5}
                          min={0}
                          onChange={(v) => updateProduct({ ...p, caffeineMg: v })}
                        />
                      </td>
                      <td style={{ padding: "8px 12px", width: 50 }}>
                        <Btn
                          variant="bare"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Remove "${p.name}"?`)) removeProduct(p.id);
                          }}
                          title="Delete"
                        >
                          <Icon name="trash" size={11} color="var(--fg-tertiary)" />
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
