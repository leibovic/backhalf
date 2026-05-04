"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { computePace, type AidStation, type Segment } from "planner-core";
import { usePlanStore } from "@/stores/planStore";
import { parseGpx } from "@/lib/gpx";
import { AppHeader } from "@/components/design/Shell";
import {
  Alert,
  Btn,
  Card,
  Checkbox,
  Field,
  Input,
  NumberInput,
  SectionHeader,
  Stat,
} from "@/components/design/Primitives";
import { Icon } from "@/components/design/Icon";

function formatPace(secPerKm: number): string {
  if (!isFinite(secPerKm)) return "—";
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CoursePageClient() {
  const router = useRouter();
  const { activePlan, updateCourse, updateGoal, updateRunner } = usePlanStore();
  const [gpxError, setGpxError] = useState<string | null>(null);
  const [gpxLoadedName, setGpxLoadedName] = useState<string | null>(null);

  const paceResult = useMemo(() => {
    if (!activePlan) return null;
    try {
      return computePace(activePlan.course, activePlan.runner, activePlan.goal);
    } catch {
      return null;
    }
  }, [activePlan]);

  const profileData = useMemo(() => {
    if (!activePlan) return null;
    const { course } = activePlan;
    if (course.aidStations.length < 2) return null;
    const sorted = [...course.aidStations].sort(
      (a, b) => a.distanceMOnLoop - b.distanceMOnLoop
    );
    const pts = sorted.map((a) => ({ d: a.distanceMOnLoop, e: a.elevationM }));
    pts.push({ d: course.loopDistanceM, e: sorted[0]?.elevationM ?? 0 });
    const maxD = Math.max(...pts.map((p) => p.d), 1);
    const minE = Math.min(...pts.map((p) => p.e));
    const maxE = Math.max(...pts.map((p) => p.e));
    const eRange = Math.max(maxE - minE, 1);
    return {
      pts: pts.map((p) => ({
        x: (p.d / maxD) * 100,
        y: 100 - ((p.e - minE) / eRange) * 100,
      })),
      sortedAids: sorted,
    };
  }, [activePlan]);

  if (!activePlan) {
    return (
      <>
        <AppHeader title="Course" breadcrumbs={["Plan", "Course"]} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "var(--fg-secondary)" }}>
            <p style={{ marginBottom: 16 }}>No race plan selected.</p>
            <Btn variant="primary" onClick={() => router.push("/")}>
              Go to Races
            </Btn>
          </div>
        </div>
      </>
    );
  }

  const { course, goal, runner } = activePlan;
  const totalDist = course.loopDistanceM * goal.loopCount;
  const totalGain = course.loopElevationGainM * goal.loopCount;

  const goalH = Math.floor(goal.goalFinishTimeSec / 3600);
  const goalM = Math.floor((goal.goalFinishTimeSec % 3600) / 60);
  const setGoalHM = (h: number, m: number) =>
    updateGoal({ ...goal, goalFinishTimeSec: (h || 0) * 3600 + (m || 0) * 60 });

  const updateAid = (idx: number, patch: Partial<AidStation>) => {
    const next = course.aidStations.map((a, i) => (i === idx ? { ...a, ...patch } : a));
    updateCourse({ ...course, aidStations: next });
  };

  const updateSeg = (idx: number, patch: Partial<Segment>) => {
    const next = course.segments.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    const loopDist = next.reduce((s, x) => s + (x.distanceM || 0), 0);
    const loopGain = next.reduce((s, x) => s + (x.gainM || 0), 0);
    const loopLoss = next.reduce((s, x) => s + (x.lossM || 0), 0);
    updateCourse({
      ...course,
      segments: next,
      loopDistanceM: loopDist || course.loopDistanceM,
      loopElevationGainM: loopGain || course.loopElevationGainM,
      loopElevationLossM: loopLoss || course.loopElevationLossM,
    });
  };

  function handleGpxUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseGpx(text, course.id, course.name);
      if (result.error) {
        setGpxError(result.error);
        setGpxLoadedName(null);
        return;
      }
      setGpxError(null);
      setGpxLoadedName(file.name);
      updateCourse({
        ...course,
        loopDistanceM: result.course.loopDistanceM,
        loopElevationGainM: result.course.loopElevationGainM,
        loopElevationLossM: result.course.loopElevationLossM,
      });
    };
    reader.readAsText(file);
  }

  function addAidStation() {
    const station: AidStation = {
      id: `aid-${Date.now()}`,
      name: "Aid Station",
      distanceMOnLoop: Math.round(course.loopDistanceM / 2),
      elevationM: 0,
      crewAccess: false,
      dropBagAccess: false,
      onCourseProductIds: [],
    };
    updateCourse({ ...course, aidStations: [...course.aidStations, station] });
  }

  function removeAidStation(idx: number) {
    const removed = course.aidStations[idx];
    if (!removed) return;
    const aidStations = course.aidStations.filter((_, i) => i !== idx);
    const segments = course.segments.filter(
      (s) => s.fromAidId !== removed.id && s.toAidId !== removed.id
    );
    updateCourse({ ...course, aidStations, segments });
  }

  const tableHeader: import("react").CSSProperties = {
    textAlign: "left",
    padding: "8px 10px",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    color: "var(--fg-tertiary)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontWeight: 500,
  };

  return (
    <>
      <AppHeader
        title="Course"
        subtitle={goal.raceName}
        breadcrumbs={["Plan", "Course"]}
      />
      <div className="app-scroll" style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "24px 28px 60px", maxWidth: 1200, margin: "0 auto" }}>
          <SectionHeader
            title="Course"
            subtitle="Upload a GPX, set up your aid stations and segments, and dial in your goal time."
          />

          {/* GPX upload — at the top */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Icon name="upload" size={14} color="var(--accent)" />
              <h5 style={{ margin: 0 }}>GPX file</h5>
            </div>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 12,
                color: "var(--fg-secondary)",
                marginBottom: 14,
                lineHeight: 1.6,
              }}
            >
              Upload a GPX file to auto-fill loop distance and elevation gain/loss. You can
              still edit the values manually below.
            </p>
            <Input type="file" onChange={handleGpxUpload} />
            {gpxLoadedName && !gpxError && (
              <div style={{ marginTop: 10 }}>
                <Alert>Loaded {gpxLoadedName}.</Alert>
              </div>
            )}
            {gpxError && (
              <div style={{ marginTop: 10 }}>
                <Alert variant="danger">{gpxError}</Alert>
              </div>
            )}
          </Card>

          {/* Race + Course details side by side */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              alignItems: "start",
              marginBottom: 16,
            }}
          >
            {/* Race info */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="flag" size={14} color="var(--accent)" />
                <h5 style={{ margin: 0 }}>Race</h5>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Race name">
                  <Input
                    value={goal.raceName}
                    onChange={(e) => updateGoal({ ...goal, raceName: e.target.value })}
                  />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Race date">
                    <Input
                      type="date"
                      value={goal.raceDate}
                      onChange={(e) => updateGoal({ ...goal, raceDate: e.target.value })}
                    />
                  </Field>
                  <Field label="Start time">
                    <Input
                      type="time"
                      value={goal.startTime}
                      onChange={(e) => updateGoal({ ...goal, startTime: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Loop count" hint="Number of times you complete the loop course.">
                  <NumberInput
                    value={goal.loopCount}
                    min={1}
                    step={1}
                    onChange={(v) => updateGoal({ ...goal, loopCount: Math.max(1, v || 1) })}
                    suffix="loops"
                  />
                </Field>
              </div>
            </Card>

            {/* Course details */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="pin" size={14} color="var(--accent)" />
                <h5 style={{ margin: 0 }}>Course details</h5>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Field label="Course name">
                  <Input
                    value={course.name}
                    onChange={(e) => updateCourse({ ...course, name: e.target.value })}
                  />
                </Field>
                <Field label="Loop distance">
                  <NumberInput
                    value={+(course.loopDistanceM / 1000).toFixed(2)}
                    step={0.1}
                    onChange={(v) => updateCourse({ ...course, loopDistanceM: v * 1000 })}
                    suffix="km"
                  />
                </Field>
                <Field label="Elevation gain / loss per loop">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <NumberInput
                      value={Math.round(course.loopElevationGainM)}
                      step={5}
                      onChange={(v) => updateCourse({ ...course, loopElevationGainM: v })}
                      suffix="+m"
                    />
                    <NumberInput
                      value={Math.round(course.loopElevationLossM)}
                      step={5}
                      onChange={(v) => updateCourse({ ...course, loopElevationLossM: v })}
                      suffix="-m"
                    />
                  </div>
                </Field>
              </div>
            </Card>
          </div>

          {/* Profile */}
          <Card style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="mountain" size={14} color="var(--accent)" />
                <h5 style={{ margin: 0 }}>Loop profile</h5>
              </div>
              <div style={{ display: "flex", gap: 18 }}>
                <Stat label="Distance" value={(course.loopDistanceM / 1000).toFixed(1)} unit="km" />
                <Stat
                  label="Gain"
                  value={Math.round(course.loopElevationGainM)}
                  unit="m"
                  color="var(--topo-green)"
                />
                <Stat
                  label="Loss"
                  value={Math.round(course.loopElevationLossM)}
                  unit="m"
                  color="var(--topo-slate)"
                />
                <Stat label="Aid stations" value={course.aidStations.length} />
              </div>
            </div>

            {profileData ? (
              <div
                style={{
                  background: "var(--bg-inset)",
                  border: "1px solid var(--border)",
                  padding: "16px 14px 30px",
                  position: "relative",
                  height: 220,
                }}
              >
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  style={{ width: "100%", height: "100%", display: "block" }}
                >
                  <defs>
                    <linearGradient id="profileFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    fill="url(#profileFill)"
                    points={`0,100 ${profileData.pts.map((p) => `${p.x},${p.y}`).join(" ")} 100,100`}
                  />
                  <polyline
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="0.4"
                    vectorEffect="non-scaling-stroke"
                    points={profileData.pts.map((p) => `${p.x},${p.y}`).join(" ")}
                  />
                  {profileData.pts.slice(0, -1).map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r="0.7"
                      fill="var(--bg-base)"
                      stroke="var(--accent)"
                      strokeWidth="0.4"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </svg>
                <div style={{ position: "absolute", inset: "16px 14px 30px", pointerEvents: "none" }}>
                  {profileData.pts.slice(0, -1).map((p, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        transform: "translate(-50%, -130%)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        color: "var(--fg-secondary)",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {profileData.sortedAids[i]?.name ?? ""}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 14,
                    bottom: 8,
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "var(--fg-tertiary)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  0 km
                </div>
                <div
                  style={{
                    position: "absolute",
                    right: 14,
                    bottom: 8,
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    color: "var(--fg-tertiary)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {(course.loopDistanceM / 1000).toFixed(1)} km
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: 30,
                  textAlign: "center",
                  color: "var(--fg-tertiary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              >
                Add at least two aid stations to see the profile.
              </div>
            )}
          </Card>

          {/* Aid stations */}
          <Card style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="pin" size={14} color="var(--accent)" />
                <h5 style={{ margin: 0 }}>Aid stations</h5>
              </div>
              <Btn variant="ghost" size="sm" onClick={addAidStation}>
                <Icon name="plus" size={11} />
                Add station
              </Btn>
            </div>
            {course.aidStations.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--fg-tertiary)",
                  padding: "16px 0",
                }}
              >
                No aid stations yet. Add one to define your course segments.
              </p>
            ) : (
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
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["#", "Name", "Loop km", "Elev", "Crew", "Drop bag", ""].map((h) => (
                        <th key={h} style={tableHeader}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {course.aidStations.map((a, idx) => (
                      <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td
                          style={{
                            padding: "10px",
                            color: "var(--accent)",
                            fontFamily: "var(--font-display)",
                            fontSize: 16,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <Input
                            value={a.name}
                            onChange={(e) => updateAid(idx, { name: e.target.value })}
                            style={{
                              background: "transparent",
                              border: "1px solid transparent",
                              padding: "4px 6px",
                            }}
                          />
                        </td>
                        <td style={{ padding: "8px 10px", width: 130 }}>
                          <NumberInput
                            value={+(a.distanceMOnLoop / 1000).toFixed(2)}
                            step={0.1}
                            min={0}
                            onChange={(v) => updateAid(idx, { distanceMOnLoop: v * 1000 })}
                            suffix="km"
                          />
                        </td>
                        <td style={{ padding: "8px 10px", width: 110 }}>
                          <NumberInput
                            value={Math.round(a.elevationM)}
                            step={1}
                            onChange={(v) => updateAid(idx, { elevationM: v })}
                            suffix="m"
                          />
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <Checkbox
                            checked={a.crewAccess}
                            onChange={(v) => updateAid(idx, { crewAccess: v })}
                          />
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <Checkbox
                            checked={a.dropBagAccess}
                            onChange={(v) => updateAid(idx, { dropBagAccess: v })}
                          />
                        </td>
                        <td style={{ padding: "8px 10px", width: 40 }}>
                          <Btn
                            variant="bare"
                            size="sm"
                            onClick={() => removeAidStation(idx)}
                            title="Remove"
                          >
                            <Icon name="trash" size={11} color="var(--fg-tertiary)" />
                          </Btn>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Segments */}
          {course.segments.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Icon name="activity" size={14} color="var(--accent)" />
                <h5 style={{ margin: 0 }}>Segments between stations</h5>
              </div>
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
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["From → To", "Distance", "Gain", "Loss"].map((h) => (
                        <th key={h} style={tableHeader}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {course.segments.map((s, idx) => {
                      const from =
                        course.aidStations.find((a) => a.id === s.fromAidId)?.name ?? s.fromAidId;
                      const to =
                        course.aidStations.find((a) => a.id === s.toAidId)?.name ?? s.toAidId;
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "10px", color: "var(--fg-primary)" }}>
                            <span style={{ color: "var(--fg-secondary)" }}>{from}</span>
                            <span style={{ color: "var(--fg-tertiary)", margin: "0 8px" }}>→</span>
                            <span>{to}</span>
                          </td>
                          <td style={{ padding: "8px 10px", width: 140 }}>
                            <NumberInput
                              value={+(s.distanceM / 1000).toFixed(2)}
                              step={0.1}
                              min={0}
                              onChange={(v) => updateSeg(idx, { distanceM: v * 1000 })}
                              suffix="km"
                            />
                          </td>
                          <td style={{ padding: "8px 10px", width: 130 }}>
                            <NumberInput
                              value={Math.round(s.gainM)}
                              step={1}
                              min={0}
                              onChange={(v) => updateSeg(idx, { gainM: v })}
                              suffix="+m"
                            />
                          </td>
                          <td style={{ padding: "8px 10px", width: 130 }}>
                            <NumberInput
                              value={Math.round(s.lossM)}
                              step={1}
                              min={0}
                              onChange={(v) => updateSeg(idx, { lossM: v })}
                              suffix="-m"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Goal time + pace model */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              alignItems: "start",
            }}
          >
            {/* Goal time */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="activity" size={14} color="var(--accent)" />
                <h5 style={{ margin: 0 }}>Goal finish time</h5>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Hours">
                  <NumberInput
                    value={goalH}
                    min={0}
                    max={48}
                    step={1}
                    onChange={(v) => setGoalHM(v, goalM)}
                    suffix="h"
                  />
                </Field>
                <Field label="Minutes">
                  <NumberInput
                    value={goalM}
                    min={0}
                    max={59}
                    step={1}
                    onChange={(v) => setGoalHM(goalH, v)}
                    suffix="m"
                  />
                </Field>
              </div>

              <div
                style={{
                  marginTop: 18,
                  padding: "14px 0 0",
                  borderTop: "1px solid var(--border)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 10,
                }}
              >
                <Stat label="Total" value={(totalDist / 1000).toFixed(1)} unit="km" />
                <Stat label="Climb" value={Math.round(totalGain)} unit="m" />
                <Stat
                  label="Flat pace"
                  accent
                  value={paceResult ? formatPace(paceResult.baselinePaceSecPerKm) : "—"}
                  unit="/km"
                />
              </div>
              {paceResult && paceResult.warnings.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <Alert variant="warning">{paceResult.warnings[0]}</Alert>
                </div>
              )}
            </Card>

            {/* Climb / descent cost */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Icon name="mountain" size={14} color="var(--accent)" />
                <h5 style={{ margin: 0 }}>Climb / descent cost</h5>
              </div>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  color: "var(--fg-secondary)",
                  marginBottom: 14,
                  lineHeight: 1.6,
                }}
              >
                How much each meter of vertical changes your pace. Climbing adds time; descending
                takes a little back.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Climb cost" hint="1 flat road · 2 rolling · 4 steep · 6 power-hike">
                  <NumberInput
                    value={runner.secPerMeterClimb}
                    step={0.5}
                    min={0}
                    onChange={(v) => updateRunner({ ...runner, secPerMeterClimb: v || 0 })}
                    suffix="s/m"
                  />
                </Field>
                <Field label="Descent gain" hint="0 technical · 1 runnable · 2 smooth fast">
                  <NumberInput
                    value={runner.secPerMeterDescent}
                    step={0.5}
                    min={0}
                    onChange={(v) => updateRunner({ ...runner, secPerMeterDescent: v || 0 })}
                    suffix="s/m"
                  />
                </Field>
              </div>
            </Card>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => router.push("/plan/fuel")}>
              Plan fuel
              <Icon name="chevronRight" size={11} />
            </Btn>
            <Btn variant="primary" onClick={() => router.push("/plan/race-plan")}>
              See race plan
              <Icon name="chevronRight" size={11} color="#fff" />
            </Btn>
          </div>
        </div>
      </div>
    </>
  );
}
