import React, { useState, useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { Users, TrendingUp, Calendar } from "lucide-react";
import { MerchantStore } from "../types";

export type FollowerTimeframe = "7d" | "30d" | "90d" | "all";

interface StoreFollowersTrendChartProps {
  currentFollowersCount?: number;
  followers?: NonNullable<MerchantStore["followersList"]>;
  timeframe?: FollowerTimeframe;
  onTimeframeChange?: (tf: FollowerTimeframe) => void;
  darkMode?: boolean;
}

interface DataPoint {
  date: Date;
  count: number;
  dailyIncrement: number;
}

export default function StoreFollowersTrendChart({
  currentFollowersCount = 0,
  followers = [],
  timeframe: externalTimeframe,
  onTimeframeChange,
  darkMode = false,
}: StoreFollowersTrendChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [internalTimeframe, setInternalTimeframe] = useState<FollowerTimeframe>("30d");
  const timeframe = externalTimeframe ?? internalTimeframe;

  const handleTimeframeSelect = (tf: FollowerTimeframe) => {
    setInternalTimeframe(tf);
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    }
  };

  const [metricType, setMetricType] = useState<"cumulative" | "daily">("cumulative");
  const [dimensions, setDimensions] = useState({ width: 640, height: 240 });
  const [hoveredData, setHoveredData] = useState<DataPoint | null>(null);

  const approvedFollowers = useMemo(
    () => followers.filter((f) => f.status === "approved"),
    [followers]
  );

  // Build real historical timeline strictly from approvedFollowers timestamps
  const filteredData: DataPoint[] = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Parse valid timestamps for all approved followers
    const timestamps = approvedFollowers
      .map((f) => {
        if (typeof f.followedAt === "number" && !Number.isNaN(f.followedAt)) {
          return f.followedAt;
        }
        const parsed = new Date(f.dateFollowed).getTime();
        return Number.isNaN(parsed) ? todayEnd.getTime() : parsed;
      })
      .sort((a, b) => a - b);

    let daysCount = 30;
    if (timeframe === "7d") daysCount = 7;
    else if (timeframe === "30d") daysCount = 30;
    else if (timeframe === "90d") daysCount = 90;
    else if (timeframe === "all") {
      if (timestamps.length > 0) {
        const earliest = timestamps[0];
        const diffDays = Math.ceil((todayEnd.getTime() - earliest) / (1000 * 60 * 60 * 24));
        daysCount = Math.max(14, Math.min(365, diffDays + 2));
      } else {
        daysCount = 30;
      }
    }

    const points: DataPoint[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const dayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i,
        0,
        0,
        0,
        0
      );
      const dayEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i,
        23,
        59,
        59,
        999
      );

      const cumulativeUpToDay = timestamps.filter((ts) => ts <= dayEnd.getTime()).length;
      const gainedOnDay = timestamps.filter(
        (ts) => ts >= dayStart.getTime() && ts <= dayEnd.getTime()
      ).length;

      points.push({
        date: dayStart,
        count: cumulativeUpToDay,
        dailyIncrement: gainedOnDay,
      });
    }

    // Ensure final point matches actual approved count
    if (points.length > 0 && approvedFollowers.length > 0) {
      points[points.length - 1].count = Math.max(
        points[points.length - 1].count,
        approvedFollowers.length
      );
    }

    return points;
  }, [approvedFollowers, timeframe]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      setDimensions({
        width: Math.max(280, width),
        height: 230,
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // D3 chart rendering when followers exist
  useEffect(() => {
    if (!svgRef.current || filteredData.length === 0 || approvedFollowers.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;

    const margin = { top: 18, right: 24, bottom: 32, left: 40 };
    const innerWidth = Math.max(100, width - margin.left - margin.right);
    const innerHeight = Math.max(80, height - margin.top - margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const dates = filteredData.map((d) => d.date);
    const dateExtent = d3.extent(dates) as [Date, Date];
    const xScale = d3.scaleTime().domain(dateExtent).range([0, innerWidth]);

    const yValue = (d: DataPoint) =>
      metricType === "cumulative" ? d.count : d.dailyIncrement;
    const rawMax = d3.max(filteredData, yValue) || 0;
    const yMax = Math.max(4, rawMax);
    const yMin = 0;

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax * 1.15])
      .nice()
      .range([innerHeight, 0]);

    const gradientId = `followers-growth-grad-${timeframe}-${metricType}`;
    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    const strokeColor = metricType === "cumulative" ? "#2563eb" : "#059669";

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", strokeColor)
      .attr("stop-opacity", darkMode ? 0.32 : 0.22);

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", strokeColor)
      .attr("stop-opacity", 0.0);

    const gridColor = darkMode ? "#1e293b" : "#f1f5f9";
    const textColor = darkMode ? "#94a3b8" : "#64748b";

    const yGrid = d3
      .axisLeft(yScale)
      .tickSize(-innerWidth)
      .tickFormat(() => "")
      .ticks(4);

    g.append("g")
      .call(yGrid)
      .call((grp) => grp.select(".domain").remove())
      .selectAll("line")
      .attr("stroke", gridColor)
      .attr("stroke-dasharray", "3,3");

    const formatTime = d3.timeFormat(timeframe === "7d" ? "%a %b %d" : "%b %d");
    const xAxis = d3
      .axisBottom<Date>(xScale)
      .ticks(timeframe === "7d" ? 7 : 6)
      .tickFormat(formatTime);

    const xAxisGroup = g
      .append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(xAxis);

    xAxisGroup
      .select(".domain")
      .attr("stroke", darkMode ? "#334155" : "#e2e8f0")
      .attr("stroke-width", 1);

    xAxisGroup
      .selectAll("text")
      .attr("fill", textColor)
      .attr("font-size", "10px")
      .attr("font-family", "Inter, sans-serif")
      .attr("dy", "10px");

    xAxisGroup.selectAll("line").attr("stroke", darkMode ? "#334155" : "#cbd5e1");

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((val) => (Number.isInteger(val) ? String(val) : ""));

    const yAxisGroup = g.append("g").call(yAxis);
    yAxisGroup.select(".domain").remove();
    yAxisGroup
      .selectAll("text")
      .attr("fill", textColor)
      .attr("font-size", "10px")
      .attr("font-family", "monospace")
      .attr("dx", "-4px");
    yAxisGroup.selectAll("line").remove();

    const areaGenerator = d3
      .area<DataPoint>()
      .x((d) => xScale(d.date))
      .y0(innerHeight)
      .y1((d) => yScale(yValue(d)))
      .curve(d3.curveMonotoneX);

    const lineGenerator = d3
      .line<DataPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(yValue(d)))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(filteredData)
      .attr("d", areaGenerator)
      .attr("fill", `url(#${gradientId})`);

    g.append("path")
      .datum(filteredData)
      .attr("d", lineGenerator)
      .attr("fill", "none")
      .attr("stroke", strokeColor)
      .attr("stroke-width", 2.5)
      .attr("stroke-linecap", "round");

    const focusGroup = g.append("g").style("display", "none");

    const verticalLine = focusGroup
      .append("line")
      .attr("stroke", strokeColor)
      .attr("stroke-opacity", 0.45)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("y1", 0)
      .attr("y2", innerHeight);

    const hoverCircleOuter = focusGroup
      .append("circle")
      .attr("r", 6.5)
      .attr("fill", strokeColor)
      .attr("fill-opacity", 0.2);

    const hoverCircleInner = focusGroup
      .append("circle")
      .attr("r", 4)
      .attr("fill", strokeColor)
      .attr("stroke", darkMode ? "#0f172a" : "#ffffff")
      .attr("stroke-width", 2);

    svg
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("mouseover", () => focusGroup.style("display", null))
      .on("mouseout", () => {
        focusGroup.style("display", "none");
        setHoveredData(null);
      })
      .on("mousemove", function (event) {
        const mouseX = d3.pointer(event)[0];
        const dateAtMouse = xScale.invert(mouseX);

        const bisectDate = d3.bisector((d: DataPoint) => d.date).left;
        const index = bisectDate(filteredData, dateAtMouse, 1);
        const d0 = filteredData[index - 1];
        const d1 = filteredData[index];

        if (!d0) return;
        const d =
          !d1 ||
          dateAtMouse.getTime() - d0.date.getTime() <
            d1.date.getTime() - dateAtMouse.getTime()
            ? d0
            : d1;

        const xPos = xScale(d.date);
        const yPos = yScale(yValue(d));

        focusGroup.style("display", null);
        verticalLine.attr("x1", xPos).attr("x2", xPos);
        hoverCircleOuter.attr("cx", xPos).attr("cy", yPos);
        hoverCircleInner.attr("cx", xPos).attr("cy", yPos);

        setHoveredData(d);
      });
  }, [filteredData, dimensions, metricType, timeframe, approvedFollowers.length, darkMode]);

  const timeframeLabelMap: Record<FollowerTimeframe, string> = {
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    "90d": "Last 90 Days",
    all: "All Time",
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col self-stretch"
      id="followers-trend-chart-container"
    >
      {/* Header Bar */}
      <div className="px-4 py-3.5 border-b border-stone-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-50/60 dark:bg-slate-900/60 text-left">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: "var(--yume-theme-header-color, #0b2447)" }}
          >
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white tracking-tight">
              Follower Growth Over Time
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">
              {timeframeLabelMap[timeframe]} • Real-time store audience progression
            </p>
          </div>
        </div>

        {/* Metric Mode & Timeframe Switchers */}
        <div className="flex flex-wrap items-center gap-2 select-none">
          <div className="flex bg-stone-100 dark:bg-slate-800 p-0.5 rounded-lg border border-stone-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setMetricType("cumulative")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                metricType === "cumulative"
                  ? "text-white shadow-2xs"
                  : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
              }`}
              style={
                metricType === "cumulative"
                  ? { backgroundColor: "var(--yume-theme-header-color, #0b2447)" }
                  : undefined
              }
            >
              Total Followers
            </button>
            <button
              type="button"
              onClick={() => setMetricType("daily")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                metricType === "daily"
                  ? "text-white shadow-2xs"
                  : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
              }`}
              style={
                metricType === "daily"
                  ? { backgroundColor: "var(--yume-theme-header-color, #0b2447)" }
                  : undefined
              }
            >
              New Followers
            </button>
          </div>

          <div className="flex bg-stone-100 dark:bg-slate-800 p-0.5 rounded-lg border border-stone-200/80 dark:border-slate-700">
            {(
              [
                { id: "7d", label: "7D" },
                { id: "30d", label: "30D" },
                { id: "90d", label: "90D" },
                { id: "all", label: "All" },
              ] as const
            ).map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => handleTimeframeSelect(tf.id)}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  timeframe === tf.id
                    ? "text-white shadow-2xs"
                    : "text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white"
                }`}
                style={
                  timeframe === tf.id
                    ? { backgroundColor: "var(--yume-theme-header-color, #0b2447)" }
                    : undefined
                }
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas or Clean Empty State */}
      <div
        className="p-4 flex-1 flex flex-col justify-center relative min-h-[230px]"
        ref={containerRef}
      >
        {approvedFollowers.length === 0 && currentFollowersCount === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4">
            <div className="w-11 h-11 rounded-2xl bg-stone-100 dark:bg-slate-800 border border-stone-200/80 dark:border-slate-700 flex items-center justify-center text-stone-400 dark:text-slate-500 mb-3">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-stone-800 dark:text-slate-200">
              No Follower Growth Data Yet
            </p>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 max-w-md mt-1 leading-relaxed">
              Follower growth statistics and historical curves will appear here automatically as shoppers and merchants follow your store page.
            </p>
          </div>
        ) : (
          <>
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="mx-auto block overflow-visible select-none"
            />

            {hoveredData ? (
              <div className="absolute top-3 right-4 bg-stone-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white border border-stone-700 dark:border-slate-700 px-3 py-2 rounded-xl text-left shadow-md flex flex-col gap-0.5 pointer-events-none z-10">
                <span className="text-[9.5px] text-stone-300 dark:text-slate-300 font-bold uppercase tracking-wide font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-400" />
                  {hoveredData.date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-sm font-black font-mono">
                    {metricType === "cumulative"
                      ? hoveredData.count
                      : `+${hoveredData.dailyIncrement}`}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-300">
                    {metricType === "cumulative" ? "Total Followers" : "New Followers"}
                  </span>
                </div>
                {metricType === "cumulative" && hoveredData.dailyIncrement > 0 && (
                  <span className="text-[9.5px] text-emerald-400 font-semibold leading-none mt-0.5">
                    +{hoveredData.dailyIncrement} gained on this day
                  </span>
                )}
              </div>
            ) : (
              <div className="absolute bottom-3 right-4 pointer-events-none select-none opacity-60 flex items-center gap-1.5 text-[10px] font-medium text-stone-400 dark:text-slate-500">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Hover chart to inspect daily follower counts
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
