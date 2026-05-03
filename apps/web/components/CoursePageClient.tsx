"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import type { AidStation, Segment } from "planner-core";
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

export function CoursePageClient() {
  const router = useRouter();
  const { activePlan, updateCourse } = usePlanStore();
  const [gpxError, setGpxError] = useState<string | null>(null);

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

  const { course } = activePlan;

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
        return;
      }
      setGpxError(null);
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
        subtitle={activePlan.goal.raceName}
        breadcrumbs={["Plan", "Course"]}
      />
      <div className="app-scroll" style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "24px 28px 60px", maxWidth: 1200, margin: "0 auto" }}>
          <SectionHeader
            title="Course"
            subtitle={`${course.name} · ${(course.loopDistanceM / 1000).toFixed(1)} km per loop`}
          />

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

          {/* GPX upload */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Icon name="upload" size={14} color="var(--accent)" />
              <h5 style={{ margin: 0 }}>Course details</h5>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Course name">
                <Input
                  value={course.name}
                  onChange={(e) => updateCourse({ ...course, name: e.target.value })}
                />
              </Field>
              <Field label="Upload GPX (auto-fills distance & elevation)">
                <Input type="file" onChange={handleGpxUpload} />
              </Field>
              <Field label="Loop distance (km)">
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
            {gpxError && (
              <div style={{ marginTop: 12 }}>
                <Alert variant="danger">{gpxError}</Alert>
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
            <Card>
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
        </div>
      </div>
    </>
  );
}
