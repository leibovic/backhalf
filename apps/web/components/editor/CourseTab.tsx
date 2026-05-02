"use client";

import { useState, useCallback } from "react";
import { usePlanStore } from "@/stores/planStore";
import { parseGpx, type ElevationPoint } from "@/lib/gpx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ElevationChart } from "@/components/ElevationChart";
import { formatDistance, formatElevation } from "@/lib/format";
import type { AidStation, Segment } from "planner-core";

function newAidStation(distanceMOnLoop: number): AidStation {
  return {
    id: `aid-${Date.now()}`,
    name: "Aid Station",
    distanceMOnLoop,
    elevationM: 0,
    crewAccess: false,
    dropBagAccess: false,
    onCourseProductIds: [],
  };
}

export function CourseTab() {
  const { activePlan, updateCourse, addAidStation, updateAidStation, removeAidStation, updateSegments } =
    usePlanStore();
  const [elevProfile, setElevProfile] = useState<ElevationPoint[]>([]);
  const [gpxError, setGpxError] = useState<string | null>(null);

  if (!activePlan) return null;
  const { course } = activePlan;

  function handleGpxUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseGpx(text, course.id, course.name);
      if (result.error) {
        setGpxError(result.error);
        return;
      }
      setGpxError(null);
      setElevProfile(result.elevationProfile);
      // Preserve existing aid stations/segments, just update totals
      updateCourse({
        ...result.course,
        name: course.name,
        aidStations: course.aidStations,
        segments: course.segments,
      });
    };
    reader.readAsText(file);
  }

  function handleAddAidStation() {
    const station = newAidStation(Math.round(course.loopDistanceM / 2));
    addAidStation(station);
    // Rebuild segments
    rebuildSegments([...course.aidStations, station]);
  }

  function handleUpdateStation(updated: AidStation) {
    updateAidStation(updated);
    rebuildSegments(
      course.aidStations.map((a) => (a.id === updated.id ? updated : a))
    );
  }

  function handleRemoveStation(id: string) {
    const remaining = course.aidStations.filter((a) => a.id !== id);
    removeAidStation(id);
    rebuildSegments(remaining);
  }

  function rebuildSegments(stations: AidStation[]) {
    if (stations.length < 2) {
      updateSegments([]);
      return;
    }
    const sorted = [...stations].sort((a, b) => a.distanceMOnLoop - b.distanceMOnLoop);
    const segs: Segment[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const from = sorted[i]!;
      const to = sorted[(i + 1) % sorted.length]!;
      const distM =
        i < sorted.length - 1
          ? to.distanceMOnLoop - from.distanceMOnLoop
          : course.loopDistanceM - from.distanceMOnLoop + (to.distanceMOnLoop || 0);

      // Find existing segment to preserve gain/loss overrides
      const existing = course.segments.find(
        (s) => s.fromAidId === from.id && s.toAidId === to.id
      );
      segs.push(
        existing
          ? { ...existing, distanceM: distM }
          : {
              fromAidId: from.id,
              toAidId: to.id,
              distanceM: distM,
              gainM: 0,
              lossM: 0,
            }
      );
    }
    updateSegments(segs);
  }

  return (
    <div className="space-y-6">
      {/* Course basics */}
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Course Name</Label>
              <Input
                value={course.name}
                onChange={(e) => updateCourse({ ...course, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Loop Distance (km)</Label>
              <Input
                type="number"
                step="0.1"
                value={(course.loopDistanceM / 1000).toFixed(1)}
                onChange={(e) =>
                  updateCourse({ ...course, loopDistanceM: parseFloat(e.target.value) * 1000 || 0 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Elevation Gain per Loop (m)</Label>
              <Input
                type="number"
                step="1"
                value={Math.round(course.loopElevationGainM)}
                onChange={(e) =>
                  updateCourse({ ...course, loopElevationGainM: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Elevation Loss per Loop (m)</Label>
              <Input
                type="number"
                step="1"
                value={Math.round(course.loopElevationLossM)}
                onChange={(e) =>
                  updateCourse({ ...course, loopElevationLossM: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GPX Upload */}
      <Card>
        <CardHeader>
          <CardTitle>GPX File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Upload GPX to auto-fill distance and elevation</Label>
            <Input type="file" accept=".gpx" onChange={handleGpxUpload} />
          </div>
          {gpxError && (
            <Alert variant="destructive">
              <AlertDescription>{gpxError}</AlertDescription>
            </Alert>
          )}
          {elevProfile.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                {formatDistance(course.loopDistanceM)} &bull; +{formatElevation(course.loopElevationGainM)} / -{formatElevation(course.loopElevationLossM)}
              </p>
              <ElevationChart data={elevProfile} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aid Stations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Aid Stations</CardTitle>
          <Button size="sm" onClick={handleAddAidStation}>
            Add Station
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {course.aidStations.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No aid stations yet. Add one to define your course segments.
            </p>
          )}
          {course.aidStations.map((station) => (
            <AidStationRow
              key={station.id}
              station={station}
              onUpdate={handleUpdateStation}
              onRemove={() => handleRemoveStation(station.id)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Segments */}
      {course.segments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {course.segments.map((seg, i) => (
                <SegmentRow
                  key={`${seg.fromAidId}-${seg.toAidId}-${i}`}
                  seg={seg}
                  aidNames={{
                    [seg.fromAidId]: course.aidStations.find((a) => a.id === seg.fromAidId)?.name ?? seg.fromAidId,
                    [seg.toAidId]: course.aidStations.find((a) => a.id === seg.toAidId)?.name ?? seg.toAidId,
                  }}
                  onUpdate={(updated) => {
                    const segments = course.segments.map((s, j) => (j === i ? updated : s));
                    updateSegments(segments);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AidStationRow({
  station,
  onUpdate,
  onRemove,
}: {
  station: AidStation;
  onUpdate: (s: AidStation) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{station.name || "Unnamed"}</span>
        <Button variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="space-y-1 col-span-2 sm:col-span-1">
          <Label className="text-xs">Name</Label>
          <Input
            value={station.name}
            onChange={(e) => onUpdate({ ...station, name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Distance from Start (km)</Label>
          <Input
            type="number"
            step="0.1"
            value={(station.distanceMOnLoop / 1000).toFixed(2)}
            onChange={(e) =>
              onUpdate({ ...station, distanceMOnLoop: parseFloat(e.target.value) * 1000 || 0 })
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Elevation (m)</Label>
          <Input
            type="number"
            value={Math.round(station.elevationM)}
            onChange={(e) =>
              onUpdate({ ...station, elevationM: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`crew-${station.id}`}
            checked={station.crewAccess}
            onCheckedChange={(v) => onUpdate({ ...station, crewAccess: !!v })}
          />
          <Label htmlFor={`crew-${station.id}`} className="text-sm font-normal">
            Crew access
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`drop-${station.id}`}
            checked={station.dropBagAccess}
            onCheckedChange={(v) => onUpdate({ ...station, dropBagAccess: !!v })}
          />
          <Label htmlFor={`drop-${station.id}`} className="text-sm font-normal">
            Drop bag
          </Label>
        </div>
      </div>
    </div>
  );
}

function SegmentRow({
  seg,
  aidNames,
  onUpdate,
}: {
  seg: Segment;
  aidNames: Record<string, string>;
  onUpdate: (s: Segment) => void;
}) {
  return (
    <div className="border rounded-lg p-3">
      <p className="text-sm font-medium mb-2">
        {aidNames[seg.fromAidId]} → {aidNames[seg.toAidId]}
      </p>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Distance (km)</Label>
          <Input
            type="number"
            step="0.1"
            value={(seg.distanceM / 1000).toFixed(2)}
            onChange={(e) => onUpdate({ ...seg, distanceM: parseFloat(e.target.value) * 1000 || 0 })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Gain (m)</Label>
          <Input
            type="number"
            value={Math.round(seg.gainM)}
            onChange={(e) => onUpdate({ ...seg, gainM: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Loss (m)</Label>
          <Input
            type="number"
            value={Math.round(seg.lossM)}
            onChange={(e) => onUpdate({ ...seg, lossM: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>
    </div>
  );
}
