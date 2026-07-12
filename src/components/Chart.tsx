import React, { useMemo, useState, useRef } from "react";
import { Bin } from "../types";
import { getNormalDensity, getKDEDensity, calculateBandwidth } from "../utils/stats";
import { BarChart2, Eye, EyeOff } from "lucide-react";
import { Tooltip } from "./Tooltip";

interface ChartProps {
  data: number[];
  sortedData: number[];
  mean: number;
  sd: number;
  binsCount: number;
  setBinsCount: (count: number) => void;
}

export const Chart: React.FC<ChartProps> = ({
  data,
  sortedData,
  mean,
  sd,
  binsCount,
  setBinsCount,
}) => {
  const [showNormalCurve, setShowNormalCurve] = useState(true);
  const [showKDECurve, setShowKDECurve] = useState(true);
  const [showHistogram, setShowHistogram] = useState(true);
  const [hoveredBin, setHoveredBin] = useState<Bin | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Chart Dimensions
  const svgWidth = 800;
  const svgHeight = 450;
  const paddingLeft = 65;
  const paddingRight = 40;
  const paddingTop = 45;
  const paddingBottom = 55;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const minVal = sortedData[0] ?? 0;
  const maxVal = sortedData[sortedData.length - 1] ?? 1;
  const dataRange = maxVal - minVal === 0 ? 1 : maxVal - minVal;

  // Compute bins
  const bins: Bin[] = useMemo(() => {
    if (sortedData.length === 0) return [];
    
    const binWidth = dataRange / binsCount;
    const computed: Bin[] = Array.from({ length: binsCount }, (_, i) => ({
      index: i,
      x0: minVal + i * binWidth,
      x1: minVal + (i + 1) * binWidth,
      count: 0,
      density: 0,
    }));

    for (let i = 0; i < sortedData.length; i++) {
      const val = sortedData[i];
      let binIdx = Math.floor((val - minVal) / binWidth);
      if (binIdx >= binsCount) binIdx = binsCount - 1;
      if (binIdx < 0) binIdx = 0;
      computed[binIdx].count++;
    }

    const n = sortedData.length;
    for (let i = 0; i < binsCount; i++) {
      computed[i].density = computed[i].count / (n * binWidth);
    }

    return computed;
  }, [sortedData, binsCount, minVal, dataRange]);

  // Bandwidth for KDE
  const kdeBandwidth = useMemo(() => {
    return calculateBandwidth(sortedData, sd);
  }, [sortedData, sd]);

  // Sample curves
  const numCurvePoints = 150;
  const curvesData = useMemo(() => {
    if (sortedData.length === 0) return { normalCurve: [], kdeCurve: [], maxDensity: 0 };

    // Pad range slightly to let curves taper off beautifully at the edges
    const pad = dataRange * 0.1;
    const startX = minVal - pad;
    const endX = maxVal + pad;
    const step = (endX - startX) / (numCurvePoints - 1);

    const normalPoints: { x: number; y: number }[] = [];
    const kdePoints: { x: number; y: number }[] = [];
    let maxDensity = 0;

    // First find max density in bins
    bins.forEach((b) => {
      if (b.density > maxDensity) maxDensity = b.density;
    });

    for (let i = 0; i < numCurvePoints; i++) {
      const x = startX + i * step;
      const normalY = getNormalDensity(x, mean, sd);
      const kdeY = getKDEDensity(x, sortedData, kdeBandwidth);

      normalPoints.push({ x, y: normalY });
      kdePoints.push({ x, y: kdeY });

      if (normalY > maxDensity) maxDensity = normalY;
      if (kdeY > maxDensity) maxDensity = kdeY;
    }

    // Add 15% top padding
    maxDensity = maxDensity === 0 ? 1 : maxDensity * 1.15;

    return {
      normalCurve: normalPoints,
      kdeCurve: kdePoints,
      maxDensity,
    };
  }, [sortedData, minVal, maxVal, dataRange, mean, sd, bins, kdeBandwidth]);

  const { normalCurve, kdeCurve, maxDensity } = curvesData;

  // Map Data to SVG Pixels
  const getSvgCoords = (x: number, y: number) => {
    // scale X
    const svgX = paddingLeft + ((x - minVal) / dataRange) * chartWidth;
    // scale Y (inverted in SVG coords)
    const svgY = paddingTop + chartHeight - (y / maxDensity) * chartHeight;
    return { x: svgX, y: svgY };
  };

  // Build normal path
  const normalPathD = useMemo(() => {
    if (normalCurve.length === 0) return "";
    return normalCurve
      .map((p, i) => {
        const { x, y } = getSvgCoords(p.x, p.y);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [normalCurve, minVal, dataRange, maxDensity]);

  // Build KDE path
  const kdePathD = useMemo(() => {
    if (kdeCurve.length === 0) return "";
    return kdeCurve
      .map((p, i) => {
        const { x, y } = getSvgCoords(p.x, p.y);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [kdeCurve, minVal, dataRange, maxDensity]);

  // Y axis ticks (Density)
  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      ticks.push((maxDensity * i) / count);
    }
    return ticks;
  }, [maxDensity]);

  // X axis ticks (Values)
  const xTicks = useMemo(() => {
    if (sortedData.length === 0) return [];
    const ticks = [];
    const count = 6;
    const step = dataRange / (count - 1);
    for (let i = 0; i < count; i++) {
      ticks.push(minVal + i * step);
    }
    return ticks;
  }, [sortedData, minVal, dataRange]);

  // Mouse Interaction handlers for tooltips
  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>, bin: Bin) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setHoveredBin(bin);
    setTooltipPos({ x, y: y - 10 });
  };

  const handleMouseLeave = () => {
    setHoveredBin(null);
    setTooltipPos(null);
  };

  return (
    <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            Distribución de Frecuencias y Curvas de Densidad
          </h3>
          <p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">
            Comparativa visual de tus datos con la distribución normal teórica y la curva KDE real.
          </p>
        </div>
        
        {/* Toggle curves controls */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setShowHistogram(!showHistogram)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
              showHistogram
                ? "bg-zinc-100 dark:bg-[#21262D] border-zinc-300 dark:border-[#30363D] text-zinc-800 dark:text-white"
                : "border-zinc-200 dark:border-[#30363D] text-zinc-400 dark:text-gray-500"
            }`}
          >
            {showHistogram ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Histograma</span>
          </button>
          
          <button
            onClick={() => setShowNormalCurve(!showNormalCurve)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
              showNormalCurve
                ? "bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-900/30 text-orange-700 dark:text-orange-400"
                : "border-zinc-200 dark:border-[#30363D] text-zinc-400 dark:text-gray-500"
            }`}
          >
            {showNormalCurve ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Curva Teórica Normal</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowKDECurve(!showKDECurve)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                showKDECurve
                  ? "bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "border-zinc-200 dark:border-[#30363D] text-zinc-400 dark:text-gray-500"
              }`}
            >
              {showKDECurve ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>KDE Empírica</span>
            </button>
            <Tooltip
              title="KDE Empírica (Kernel Density Estimation)"
              description="La Estimación de Densidad por Kernel es un método no paramétrico para estimar la función de densidad de probabilidad de una variable aleatoria de forma suave y continua."
              details={[
                "Suaviza las frecuencias usando una función de kernel gaussiano sobre cada punto de datos.",
                "Evita la arbitrariedad de elegir un número de intervalos (bins) fijo en el histograma.",
                "El ancho de banda se optimiza automáticamente de forma robusta con la regla de Silverman."
              ]}
              align="right"
            />
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          {/* Gridlines */}
          {yTicks.map((tick, i) => {
            const { y } = getSvgCoords(minVal, tick);
            return (
              <g key={`grid-${i}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  className="stroke-zinc-150 dark:stroke-[#30363D]"
                  strokeWidth="1"
                  strokeDasharray={i === 0 ? "none" : "3,3"}
                />
                {/* Y Axis Labels */}
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-zinc-400 dark:fill-gray-500 font-mono text-[10px]"
                >
                  {tick.toFixed(4)}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels & Ticks */}
          {xTicks.map((tick, i) => {
            const { x } = getSvgCoords(tick, 0);
            return (
              <g key={`x-tick-${i}`}>
                <line
                  x1={x}
                  y1={svgHeight - paddingBottom}
                  x2={x}
                  y2={svgHeight - paddingBottom + 5}
                  className="stroke-zinc-300 dark:stroke-[#30363D]"
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y={svgHeight - paddingBottom + 20}
                  textAnchor="middle"
                  className="fill-zinc-400 dark:fill-gray-500 font-mono text-[10px]"
                >
                  {tick.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </text>
              </g>
            );
          })}

          {/* Histogram Bars */}
          {showHistogram &&
            bins.map((bin) => {
              const startCoords = getSvgCoords(bin.x0, bin.density);
              const endCoords = getSvgCoords(bin.x1, 0);
              const barWidth = Math.max(1, endCoords.x - startCoords.x - 1);
              const barHeight = Math.max(0, endCoords.y - startCoords.y);

              const isHovered = hoveredBin?.index === bin.index;

              return (
                <rect
                  key={`bar-${bin.index}`}
                  x={startCoords.x}
                  y={startCoords.y}
                  width={barWidth}
                  height={barHeight}
                  className={`transition duration-150 cursor-pointer ${
                    isHovered
                      ? "fill-blue-500 dark:fill-blue-500 stroke-blue-600"
                      : "fill-blue-100/70 dark:fill-blue-500/20 stroke-blue-300/60 dark:stroke-blue-500/40"
                  }`}
                  strokeWidth="1"
                  onMouseMove={(e) => handleMouseMove(e, bin)}
                  onMouseLeave={handleMouseLeave}
                />
              );
            })}

          {/* Theoretical Normal Curve Path */}
          {showNormalCurve && normalPathD && (
            <path
              d={normalPathD}
              fill="none"
              className="stroke-orange-500 dark:stroke-orange-400 animate-dash"
              strokeWidth="2.5"
              strokeDasharray="5,2"
            />
          )}

          {/* Empirical KDE Curve Path */}
          {showKDECurve && kdePathD && (
            <path
              d={kdePathD}
              fill="none"
              className="stroke-blue-500 dark:stroke-blue-400"
              strokeWidth="2.5"
            />
          )}

          {/* Legend Overlay */}
          <g transform={`translate(${svgWidth - paddingRight - 180}, ${paddingTop + 10})`}>
            {/* Background for legend */}
            <rect
              width="170"
              height={
                (showHistogram ? 22 : 0) +
                (showNormalCurve ? 22 : 0) +
                (showKDECurve ? 22 : 0) +
                12
              }
              rx="6"
              className="fill-zinc-50/90 dark:fill-[#0D1117]/80 stroke-zinc-200 dark:stroke-[#30363D]"
              strokeWidth="1"
            />
            <g transform="translate(12, 12)">
              {showHistogram && (
                <g>
                  <rect width="14" height="10" rx="2" className="fill-blue-200 dark:fill-blue-950/40 stroke-blue-400" />
                  <text x="24" y="9" className="fill-zinc-600 dark:fill-gray-300 text-[10px] font-medium">
                    Histograma (Densidad)
                  </text>
                </g>
              )}
              {showNormalCurve && (
                <g transform={`translate(0, ${showHistogram ? 22 : 0})`}>
                  <line x1="0" y1="5" x2="16" y2="5" className="stroke-orange-500" strokeWidth="2.5" strokeDasharray="4,2" />
                  <text x="24" y="9" className="fill-zinc-600 dark:fill-gray-300 text-[10px] font-medium">
                    Distribución Normal Teórica
                  </text>
                </g>
              )}
              {showKDECurve && (
                <g transform={`translate(0, ${(showHistogram ? 22 : 0) + (showNormalCurve ? 22 : 0)})`}>
                  <line x1="0" y1="5" x2="16" y2="5" className="stroke-blue-500" strokeWidth="2.5" />
                  <text x="24" y="9" className="fill-zinc-600 dark:fill-gray-300 text-[10px] font-medium">
                    Densidad KDE Empírica
                  </text>
                </g>
              )}
            </g>
          </g>

          {/* Axes */}
          {/* X Axis */}
          <line
            x1={paddingLeft}
            y1={svgHeight - paddingBottom}
            x2={svgWidth - paddingRight}
            y2={svgHeight - paddingBottom}
            className="stroke-zinc-300 dark:stroke-[#30363D]"
            strokeWidth="1.5"
          />
          {/* Y Axis */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={svgHeight - paddingBottom}
            className="stroke-zinc-300 dark:stroke-[#30363D]"
            strokeWidth="1.5"
          />

          {/* Axis Labels */}
          <text
            x={paddingLeft + chartWidth / 2}
            y={svgHeight - 12}
            textAnchor="middle"
            className="fill-zinc-500 dark:fill-gray-400 font-medium text-xs"
          >
            Intervalos de Valores
          </text>

          <text
            transform={`translate(15, ${paddingTop + chartHeight / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-zinc-500 dark:fill-gray-400 font-medium text-xs"
          >
            Densidad de Probabilidad
          </text>
        </svg>

        {/* Interactive Tooltip using absolute divs on top of SVG */}
        {tooltipPos && hoveredBin && (
          <div
            className="absolute z-10 pointer-events-none bg-zinc-950 dark:bg-[#161B22] text-white rounded-lg p-3 shadow-xl text-xs border border-zinc-800 dark:border-[#30363D] transition-all duration-75"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-semibold text-zinc-300 border-b border-zinc-800 dark:border-[#30363D] pb-1.5 mb-1.5">
              Intervalo [{hoveredBin.x0.toFixed(2)}, {hoveredBin.x1.toFixed(2)}]
            </div>
            <div className="space-y-1">
              <div className="flex justify-between gap-6">
                <span className="text-zinc-400 dark:text-gray-400">Frecuencia absoluta:</span>
                <span className="font-mono font-bold text-blue-300">{hoveredBin.count}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-zinc-400 dark:text-gray-400">Densidad observada:</span>
                <span className="font-mono text-blue-300">{hoveredBin.density.toFixed(4)}</span>
              </div>
              <div className="flex justify-between gap-6">
                <span className="text-zinc-400 dark:text-gray-400">Normal esperada:</span>
                <span className="font-mono text-orange-400">
                  {getNormalDensity((hoveredBin.x0 + hoveredBin.x1) / 2, mean, sd).toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Bins Slider */}
      <div className="mt-6 pt-5 border-t border-zinc-150 dark:border-[#30363D] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-500 dark:text-gray-400 uppercase tracking-wider">
            Número de Intervalos (Bins):
          </span>
          <span className="px-2.5 py-1 text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded">
            {binsCount}
          </span>
        </div>
        <div className="w-full md:max-w-md flex items-center gap-4">
          <span className="text-xs text-zinc-400 font-mono">5</span>
          <input
            id="bins-slider"
            type="range"
            min="5"
            max="50"
            step="1"
            value={binsCount}
            onChange={(e) => setBinsCount(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-zinc-200 dark:bg-[#30363D] rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
          />
          <span className="text-xs text-zinc-400 font-mono">50</span>
        </div>
      </div>
    </div>
  );
};
