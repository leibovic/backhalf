"use client";

import React from "react";
import type { LoopSplit } from "planner-core";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDuration, formatDistance } from "@/lib/format";

interface SplitsTableProps {
  loops: LoopSplit[];
  loopCount: number;
}

export function SplitsTable({ loops, loopCount }: SplitsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Loop</TableHead>
            <TableHead>Segment</TableHead>
            <TableHead className="text-right">Dist</TableHead>
            <TableHead className="text-right">+Gain</TableHead>
            <TableHead className="text-right">-Loss</TableHead>
            <TableHead className="text-right">Split</TableHead>
            <TableHead className="text-right">Elapsed</TableHead>
            <TableHead className="text-right">Time of Day</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loops.map((loop) => (
            <React.Fragment key={loop.loopNumber}>
              {loop.segments.map((seg, si) => (
                <TableRow key={`${loop.loopNumber}-${si}`}>
                  {si === 0 && (
                    <TableCell
                      rowSpan={loop.segments.length}
                      className="font-medium align-top pt-3"
                    >
                      {loopCount > 1 ? `L${loop.loopNumber}` : ""}
                    </TableCell>
                  )}
                  <TableCell className="max-w-[200px]">
                    <span className="text-xs text-muted-foreground">{seg.fromAidName}</span>
                    <br />
                    <span className="font-medium text-sm">{seg.toAidName}</span>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {formatDistance(seg.distanceM)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-green-700">
                    +{Math.round(seg.gainM)}m
                  </TableCell>
                  <TableCell className="text-right text-sm text-red-700">
                    -{Math.round(seg.lossM)}m
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatDuration(seg.segmentSec)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatDuration(seg.cumulativeSec)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    {seg.timeOfDay}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-medium">
                <TableCell />
                <TableCell className="text-xs text-muted-foreground">
                  Loop {loop.loopNumber} finish
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell className="text-right font-mono text-sm">
                  {formatDuration(loop.loopTimeSec)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatDuration(loop.cumulativeTimeSec)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-bold">
                  {loop.finishTimeOfDay}
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
