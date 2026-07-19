import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Applicant, Loan } from "../types";
import { ShieldAlert, TrendingUp, BarChart3, HelpCircle, Download, FileSpreadsheet } from "lucide-react";
import { showToast } from "../utils/toast";

interface D3RegionalRiskProps {
  applicants: Applicant[];
  loans: Loan[];
}

// Trend dataset (Repayment percentages over time by region) pulled to module scope for dual use (render + export)
const TRENDS_DATA = [
  { month: "Jan", Anantapur: 92, Medak: 88, Sangareddy: 95, Khammam: 85 },
  { month: "Feb", Anantapur: 94, Medak: 89, Sangareddy: 96, Khammam: 87 },
  { month: "Mar", Anantapur: 93, Medak: 91, Sangareddy: 98, Khammam: 86 },
  { month: "Apr", Anantapur: 95, Medak: 90, Sangareddy: 97, Khammam: 89 },
  { month: "May", Anantapur: 97, Medak: 94, Sangareddy: 99, Khammam: 91 },
  { month: "Jun", Anantapur: 98, Medak: 95, Sangareddy: 98, Khammam: 93 },
  { month: "Jul", Anantapur: 100, Medak: 97, Sangareddy: 100, Khammam: 95 }
];

const REGIONS = ["Anantapur", "Medak", "Sangareddy", "Khammam"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

export default function D3RegionalRisk({ applicants, loans }: D3RegionalRiskProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<SVGSVGElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 600, height: 320 });
  const [hoveredBar, setHoveredBar] = useState<{ region: string; key: string; value: number } | null>(null);
  const [hoveredTrend, setHoveredTrend] = useState<{ month: string; region: string; rate: number } | null>(null);

  // Set up resize observer to keep charts responsive
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width } = entries[0].contentRect;
      // Cap minimum width to 320 and maximum height proportionally
      setDimensions({
        width: Math.max(width, 320),
        height: 320
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Export functions to trigger CSV file generation dynamically
  const handleExportRiskCSV = () => {
    const locations = Array.from(new Set(applicants.map(a => a.location || "Other")));
    const riskData = locations.map(loc => {
      const appIds = applicants.filter(a => a.location === loc).map(a => a.id);
      const locLoans = loans.filter(l => appIds.includes(l.applicantId));
      
      const low = locLoans.filter(l => l.riskBucket === "LOW").length;
      const med = locLoans.filter(l => l.riskBucket === "MEDIUM").length;
      const high = locLoans.filter(l => l.riskBucket === "HIGH").length;
      const total = low + med + high;

      return {
        region: loc,
        low,
        med,
        high,
        total
      };
    });

    const csvRows = [
      ["Region/Location", "Low Risk Loans (Count)", "Medium Risk Loans (Count)", "High Risk Loans (Count)", "Total Active Loans"].join(",")
    ];

    riskData.forEach(d => {
      csvRows.push(`"${d.region.replace(/"/g, '""')}",${d.low},${d.med},${d.high},${d.total}`);
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = `Kisan_Credit_Regional_Risk_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`📊 Regional Risk Distribution metrics exported successfully as "${filename}".`, "success");
  };

  const handleExportTrendsCSV = () => {
    const csvRows = [
      ["Month", "Anantapur Repayment Rate (%)", "Medak Repayment Rate (%)", "Sangareddy Repayment Rate (%)", "Khammam Repayment Rate (%)"].join(",")
    ];

    TRENDS_DATA.forEach(d => {
      csvRows.push(`${d.month},${d.Anantapur},${d.Medak},${d.Sangareddy},${d.Khammam}`);
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = `Kisan_Credit_Repayment_Trends_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`📈 Historical Repayment Trends data compiled and exported as "${filename}".`, "success");
  };

  // 1. D3 Grouped Bar Chart: Regional Risk Distribution
  useEffect(() => {
    if (!barRef.current || !applicants.length || !loans.length) return;

    const svg = d3.select(barRef.current);
    svg.selectAll("*").remove(); // Clear previous drawing

    const margin = { top: 30, right: 120, bottom: 40, left: 45 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Prepare data: Count LOW, MEDIUM, HIGH risk loans in each location
    const locations = Array.from(new Set(applicants.map(a => a.location || "Other")));
    const riskData = locations.map(loc => {
      const appIds = applicants.filter(a => a.location === loc).map(a => a.id);
      const locLoans = loans.filter(l => appIds.includes(l.applicantId));
      
      return {
        region: loc.split(" ")[0], // short name
        LOW: locLoans.filter(l => l.riskBucket === "LOW").length,
        MEDIUM: locLoans.filter(l => l.riskBucket === "MEDIUM").length,
        HIGH: locLoans.filter(l => l.riskBucket === "HIGH").length
      };
    });

    const keys = ["LOW", "MEDIUM", "HIGH"];

    // Scales
    const x0 = d3.scaleBand()
      .domain(riskData.map(d => d.region))
      .rangeRound([0, width])
      .paddingInner(0.2);

    const x1 = d3.scaleBand()
      .domain(keys)
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);

    const maxVal = d3.max(riskData, d => d3.max(keys, key => d[key as "LOW" | "MEDIUM" | "HIGH"])) || 1;
    const y = d3.scaleLinear()
      .domain([0, Math.max(maxVal + 1, 5)])
      .nice()
      .rangeRound([height, 0]);

    const color = d3.scaleOrdinal<string>()
      .domain(keys)
      .range(["#10b981", "#f59e0b", "#f43f5e"]); // Tailwind emerald-500, amber-500, rose-500

    // Grid lines
    g.append("g")
      .attr("class", "grid-lines")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1)
      .attr("opacity", 0.4)
      .selectAll("line")
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d));

    // X Axis
    g.append("g")
      .attr("class", "axis-x")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0).tickSizeOuter(0))
      .attr("color", "#64748b")
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .style("font-size", "10px");

    // Y Axis
    g.append("g")
      .attr("class", "axis-y")
      .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0))
      .attr("color", "#64748b")
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .style("font-size", "10px");

    // Bar drawing
    g.append("g")
      .selectAll("g")
      .data(riskData)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${x0(d.region)},0)`)
      .selectAll("rect")
      .data(d => keys.map(key => ({ key, value: d[key as "LOW" | "MEDIUM" | "HIGH"], region: d.region })))
      .enter()
      .append("rect")
      .attr("x", d => x1(d.key) || 0)
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => color(d.key))
      .attr("rx", 3)
      .attr("cursor", "pointer")
      .attr("opacity", 0.95)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 1).attr("stroke", "#ffffff").attr("stroke-width", 1);
        setHoveredBar({ region: d.region, key: d.key, value: d.value });
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.95).attr("stroke", "none");
        setHoveredBar(null);
      });

    // Chart Title/Label
    svg.append("text")
      .attr("x", margin.left)
      .attr("y", 18)
      .attr("fill", "#ffffff")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .text("Regional Risk Distribution (D3)");

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${dimensions.width - 110}, ${margin.top})`);

    keys.forEach((key, idx) => {
      const legG = legend.append("g")
        .attr("transform", `translate(0, ${idx * 20})`);

      legG.append("rect")
        .attr("width", 11)
        .attr("height", 11)
        .attr("fill", color(key))
        .attr("rx", 2);

      legG.append("text")
        .attr("x", 16)
        .attr("y", 10)
        .attr("fill", "#94a3b8")
        .style("font-size", "10px")
        .style("font-family", "monospace")
        .text(`${key} Risk`);
    });

  }, [dimensions, applicants, loans]);

  // 2. D3 Multi-Line Chart: Repayment Trends
  useEffect(() => {
    if (!lineRef.current) return;

    const svg = d3.select(lineRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 120, bottom: 40, left: 45 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scalePoint()
      .domain(MONTHS)
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([80, 100])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal<string>()
      .domain(REGIONS)
      .range(["#10b981", "#3b82f6", "#a855f7", "#ec4899"]); // emerald, blue, purple, pink

    // Horizontal Grid Lines
    g.append("g")
      .attr("class", "grid-lines")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1)
      .attr("opacity", 0.4)
      .selectAll("line")
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d));

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .attr("color", "#64748b")
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .style("font-size", "10px");

    // Y Axis
    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
      .attr("color", "#64748b")
      .selectAll("text")
      .attr("fill", "#94a3b8")
      .style("font-size", "10px");

    // Draw lines & point circles
    REGIONS.forEach((region) => {
      const lineGenerator = d3.line<any>()
        .x(d => x(d.month) || 0)
        .y(d => y(d[region]))
        .curve(d3.curveMonotoneX);

      // Path
      g.append("path")
        .datum(TRENDS_DATA)
        .attr("fill", "none")
        .attr("stroke", color(region))
        .attr("stroke-width", 2.5)
        .attr("d", lineGenerator)
        .attr("opacity", 0.85);

      // Tooltip dots
      g.selectAll(`.dot-${region}`)
        .data(TRENDS_DATA)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.month) || 0)
        .attr("cy", d => y(d[region]))
        .attr("r", 4)
        .attr("fill", color(region))
        .attr("stroke", "#0f172a")
        .attr("stroke-width", 1.5)
        .attr("cursor", "pointer")
        .on("mouseover", function (event, d) {
          d3.select(this).attr("r", 6);
          setHoveredTrend({ month: d.month, region, rate: d[region] });
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", 4);
          setHoveredTrend(null);
        });
    });

    // Chart Title/Label
    svg.append("text")
      .attr("x", margin.left)
      .attr("y", 18)
      .attr("fill", "#ffffff")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .text("Historical Regional Repayment Rates (D3 Line)");

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${dimensions.width - 110}, ${margin.top})`);

    REGIONS.forEach((region, idx) => {
      const legG = legend.append("g")
        .attr("transform", `translate(0, ${idx * 20})`);

      legG.append("circle")
        .attr("cx", 6)
        .attr("cy", 6)
        .attr("r", 5)
        .attr("fill", color(region));

      legG.append("text")
        .attr("x", 16)
        .attr("y", 10)
        .attr("fill", "#94a3b8")
        .style("font-size", "10px")
        .text(`${region}`);
    });

  }, [dimensions]);

  return (
    <div id="d3-analytics-root" className="grid grid-cols-1 lg:grid-cols-2 gap-6" ref={containerRef}>
      
      {/* 1. Risk bar chart */}
      <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col relative">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-850">
          <div className="flex items-center gap-2 text-slate-200">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">D3 Risk Distribution</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportRiskCSV}
              className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 rounded-md hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1 active:scale-95 shadow-sm"
              title="Export Regional Risk Metrics as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Interactive Hover</span>
          </div>
        </div>

        <div className="relative flex-1 min-h-[320px]">
          <svg 
            ref={barRef} 
            width={dimensions.width} 
            height={dimensions.height} 
            className="w-full h-full block" 
          />
          
          {/* Tooltip display */}
          {hoveredBar && (
            <div className="absolute top-2 right-4 bg-slate-900/95 border border-slate-750 px-3 py-1.5 rounded-lg shadow-lg pointer-events-none text-left z-10 transition-all">
              <div className="text-[11px] font-bold text-white uppercase">{hoveredBar.region} Region</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  hoveredBar.key === "LOW" ? "bg-emerald-500" : hoveredBar.key === "MEDIUM" ? "bg-amber-500" : "bg-rose-500"
                }`} />
                <span className="text-[10px] text-slate-300 font-mono">
                  {hoveredBar.key} risk: <strong className="text-white">{hoveredBar.value} active loans</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Repayment trend chart */}
      <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col relative">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-850">
          <div className="flex items-center gap-2 text-slate-200">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-semibold uppercase tracking-wider font-mono">D3 Repayment Trends</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTrendsCSV}
              className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-600/15 text-emerald-400 border border-emerald-500/20 rounded-md hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1 active:scale-95 shadow-sm"
              title="Export Repayment Rates as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Continuous tracking</span>
          </div>
        </div>

        <div className="relative flex-1 min-h-[320px]">
          <svg 
            ref={lineRef} 
            width={dimensions.width} 
            height={dimensions.height} 
            className="w-full h-full block" 
          />
          
          {/* Trend Tooltip display */}
          {hoveredTrend && (
            <div className="absolute top-2 right-4 bg-slate-900/95 border border-slate-750 px-3 py-1.5 rounded-lg shadow-lg pointer-events-none text-left z-10 transition-all">
              <div className="text-[11px] font-bold text-white uppercase">{hoveredTrend.region} Region</div>
              <div className="text-[10px] text-slate-300 font-mono mt-1">
                Month: <strong className="text-white">{hoveredTrend.month}</strong>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                Repayment rate: <strong className="text-white">{hoveredTrend.rate}%</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

