"use client";

import type { Course, AidStation, Segment } from "planner-core";

export interface ElevationPoint {
  distanceM: number;
  elevationM: number;
}

export interface ParsedGpx {
  course: Course;
  elevationProfile: ElevationPoint[];
  error?: string;
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseGpx(xmlText: string, courseId: string, courseName: string): ParsedGpx {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    return {
      course: emptyCourse(courseId, courseName),
      elevationProfile: [],
      error: "Invalid GPX file",
    };
  }

  const trkpts = Array.from(doc.querySelectorAll("trkpt"));
  if (trkpts.length === 0) {
    return {
      course: emptyCourse(courseId, courseName),
      elevationProfile: [],
      error: "No track points found in GPX file",
    };
  }

  let totalDistanceM = 0;
  let totalGainM = 0;
  let totalLossM = 0;
  const elevationProfile: ElevationPoint[] = [];

  let prevLat = 0;
  let prevLon = 0;
  let prevEle = 0;

  for (let i = 0; i < trkpts.length; i++) {
    const pt = trkpts[i];
    if (!pt) continue;
    const lat = parseFloat(pt.getAttribute("lat") ?? "0");
    const lon = parseFloat(pt.getAttribute("lon") ?? "0");
    const eleEl = pt.querySelector("ele");
    const ele = eleEl ? parseFloat(eleEl.textContent ?? "0") : 0;

    if (i > 0) {
      const dist = haversineM(prevLat, prevLon, lat, lon);
      totalDistanceM += dist;
      const diff = ele - prevEle;
      if (diff > 0) totalGainM += diff;
      else totalLossM += -diff;
    }

    // Sample elevation profile at most 500 points for performance
    if (i === 0 || i === trkpts.length - 1 || i % Math.max(1, Math.floor(trkpts.length / 500)) === 0) {
      elevationProfile.push({ distanceM: totalDistanceM, elevationM: ele });
    }

    prevLat = lat;
    prevLon = lon;
    prevEle = ele;
  }

  // Build a single start/finish aid station and a single segment
  const startEle = parseFloat(
    trkpts[0]?.querySelector("ele")?.textContent ?? "0"
  );

  const startAid: AidStation = {
    id: "start-finish",
    name: "Start / Finish",
    distanceMOnLoop: 0,
    elevationM: startEle,
    crewAccess: true,
    dropBagAccess: true,
    onCourseProductIds: [],
  };

  const segment: Segment = {
    fromAidId: "start-finish",
    toAidId: "start-finish",
    distanceM: totalDistanceM,
    gainM: totalGainM,
    lossM: totalLossM,
  };

  const course: Course = {
    id: courseId,
    name: courseName,
    loopDistanceM: totalDistanceM,
    loopElevationGainM: totalGainM,
    loopElevationLossM: totalLossM,
    aidStations: [startAid],
    segments: [segment],
  };

  return { course, elevationProfile };
}

function emptyCourse(id: string, name: string): Course {
  return {
    id,
    name,
    loopDistanceM: 0,
    loopElevationGainM: 0,
    loopElevationLossM: 0,
    aidStations: [],
    segments: [],
  };
}
