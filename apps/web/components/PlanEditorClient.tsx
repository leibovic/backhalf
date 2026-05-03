"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlanStore } from "@/stores/planStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NavBar } from "@/components/NavBar";
import { CourseTab } from "@/components/editor/CourseTab";
import { TargetsTab } from "@/components/editor/TargetsTab";
import { LoadoutsTab } from "@/components/editor/LoadoutsTab";
import { Button } from "@/components/ui/button";

export function PlanEditorClient() {
  const router = useRouter();
  const { activePlan, initFromStorage } = usePlanStore();

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  if (!activePlan) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">No plan selected.</p>
          <Button onClick={() => router.push("/")}>Go to Plans</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar raceName={activePlan.goal.raceName} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Plan Editor</h1>
          <Button onClick={() => router.push("/plan/race-plan")}>
            View Race Plan
          </Button>
        </div>
        <Tabs defaultValue="course">
          <TabsList className="mb-6">
            <TabsTrigger value="course">Course</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
            <TabsTrigger value="fuel">Fuel</TabsTrigger>
          </TabsList>
          <TabsContent value="course">
            <CourseTab />
          </TabsContent>
          <TabsContent value="targets">
            <TargetsTab />
          </TabsContent>
          <TabsContent value="fuel">
            <LoadoutsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
