"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { usePlanStore } from "@/stores/planStore";
import { exportPlans, importPlans, clearAllData } from "@/lib/storage";
import { AppHeader } from "@/components/design/Shell";
import { Btn, Card, SectionHeader } from "@/components/design/Primitives";
import { Icon } from "@/components/design/Icon";

export function SettingsClient() {
  const router = useRouter();
  const { initFromStorage } = usePlanStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    exportPlans();
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importPlans(ev.target?.result as string);
        initFromStorage();
        router.push("/");
      } catch {
        alert("Invalid backup file.");
      }
    };
    reader.readAsText(file);
  }

  function handleClearAll() {
    if (confirm("This will delete all plans. Are you sure?")) {
      clearAllData();
      initFromStorage();
      router.push("/");
    }
  }

  return (
    <>
      <AppHeader title="Settings" breadcrumbs={["Settings"]} />
      <div className="app-scroll" style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "24px 28px 60px", maxWidth: 700, margin: "0 auto" }}>
          <SectionHeader title="Settings" subtitle="Manage your stored data." />

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Icon name="download" size={14} color="var(--accent)" />
                <h5 style={{ margin: 0 }}>Backup & restore</h5>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  color: "var(--fg-secondary)",
                  marginBottom: 14,
                  lineHeight: 1.6,
                }}
              >
                Plans are stored in your browser&apos;s local storage. Export a backup to keep
                them safe or transfer between devices.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn variant="primary" onClick={handleExport}>
                  <Icon name="download" size={12} color="#fff" />
                  Export JSON
                </Btn>
                <Btn variant="ghost" onClick={handleImportClick}>
                  <Icon name="upload" size={12} />
                  Import JSON
                </Btn>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={handleImportFile}
                />
              </div>
            </Card>

            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Icon name="trash" size={14} color="var(--danger)" />
                <h5 style={{ margin: 0, color: "var(--danger)" }}>Danger zone</h5>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  color: "var(--fg-secondary)",
                  marginBottom: 14,
                  lineHeight: 1.6,
                }}
              >
                Permanently delete all plans from local storage. There&apos;s no undo.
              </p>
              <Btn variant="danger" onClick={handleClearAll}>
                Clear all data
              </Btn>
            </Card>
          </div>

          <div
            style={{
              marginTop: 22,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-tertiary)",
              letterSpacing: "0.04em",
            }}
          >
            Backhalf v0.1 · all data lives in your browser · pace model: flat-equivalent +
            per-meter elevation cost.
          </div>
        </div>
      </div>
    </>
  );
}
