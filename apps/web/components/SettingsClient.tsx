"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePlanStore } from "@/stores/planStore";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportPlans, importPlans, clearAllData } from "@/lib/storage";

export function SettingsClient() {
  const router = useRouter();
  const { initFromStorage } = usePlanStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

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
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold mb-6">Settings</h1>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Plans are stored in your browser&apos;s local storage. Export a backup to
                  keep them safe or transfer to another device.
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleExport}>Export JSON</Button>
                  <Button variant="outline" onClick={handleImportClick}>
                    Import JSON
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportFile}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Permanently delete all plans from local storage.
              </p>
              <Button variant="destructive" onClick={handleClearAll}>
                Clear All Data
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Backhalf v1 — Ultra Race Planner. Plans are stored locally in your browser.
                No accounts, no server, no data leaves your device.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
