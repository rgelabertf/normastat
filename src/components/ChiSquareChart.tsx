import React, { useMemo, useState } from "react";
import { BarChart3, Info } from "lucide-react";
import {
  runChiSquareGOF,
  chiSquareDensity,
  chiSquareCriticalValue,
  stdNormalCDF,
} from "../utils/stats";

interface ChiSquareChartProps {
  sortedData: number[];
  mean: number;
  sd: number;
  binsCount: number;
}

export const ChiSquareChart: React.FC<ChiSquareChartProps> = ({
  sortedData,
  mean,
  sd,
  binsCount,
}) => {
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);

  const chiResult = useMemo(
    () => runChiSquareGOF(sortedData, mean, sd, binsCount),
    [sortedData, mean, sd, binsCount]
  );

  const canCompute = useMemo(() => {
    const n = sortedData.length;
    if (n < 8) return false;
    if (sd === 0) return false;
    return sortedData[n - 1] - sortedData[0] !== 0;
  }, [sortedData, sd]);

  const bins = useMemo(() => {
    const n = sortedData.length;
    const k = binsCount;
    const min = sortedData[0] ?? 0;
    const max = sortedData[n - 1] ?? 1;
    const range = max - min;
    const binWidth = range === 0 ? 1 : range / k;

    const observed: number[] = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      let idx = Math.floor((sortedData[i] - min) / binWidth);
      if (idx >= k) idx = k - 1;
      if (idx < 0) idx = 0;
      observed[idx]++;
    }

    const expected: number[] = [];
    const contributions: number[] = [];
    for (let i = 0; i < k; i++) {
      const lower = min + i * binWidth;
      const upper = lower + binWidth;
      const prob = stdNormalCDF((upper - mean) / sd) - stdNormalCDF((lower - mean) / sd);
      const expFreq = Math.max(prob * n, 0.01);
      expected.push(expFreq);
      contributions.push(Math.pow(observed[i] - expFreq, 2) / expFreq);
    }

    return { k, min, binWidth, observed, expected, contributions };
  }, [sortedData, mean, sd, binsCount]);

  const df = Math.max(1, binsCount - 3);
  const critical = useMemo(() => chiSquareCriticalValue(0.95, df), [df]);

  const curve = useMemo(() => {
    if (!canCompute) return { points: [] as { x: number; y: number }[], maxY: 1, xMax: 1, stat: 0 };
    const stat = chiResult.statisticValue;
    const xMax = Math.max(1, stat, critical) * 1.5;
    const points: { x: number; y: number }[] = [];
    const N = 200;
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * xMax;
      points.push({ x, y: chiSquareDensity(x, df) });
    }
    const maxY = Math.max(...points.map((p) => p.y)) * 1.15;
    return { points, maxY, xMax, stat };
  }, [canCompute, chiResult.statisticValue, critical, df]);

  const verdictColor = chiResult.isNormal ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400";
  const verdictBadge = chiResult.isNormal ? "Normal" : "No Normal";

  // Panel A: Observed vs Expected bars
  const barW = 440;
  const barH = 300;
  const bLeft = 42;
  const bRight = 12;
  const bTop = 16;
  const bBottom = 34;
  const bChartW = barW - bLeft - bRight;
  const bChartH = barH - bTop - bBottom;
  const maxFreq = Math.max(...bins.observed, ...bins.expected, 1);
  const slot = bChartW / bins.k;
  const barWidth = Math.max(2, Math.min(34, slot * 0.6));
  const barCenter = (i: number) => bLeft + i * slot + slot / 2;
  const barTop = (freq: number) => bTop + bChartH - (freq / maxFreq) * bChartH;
  const barHeight = (freq: number) => Math.max(0, (freq / maxFreq) * bChartH);

  // Panel B: Chi-square distribution curve
  const cW = 440;
  const cH = 300;
  const cLeft = 45;
  const cRight = 15;
  const cTop = 16;
  const cBottom = 34;
  const cChartW = cW - cLeft - cRight;
  const cChartH = cH - cTop - cBottom;
  const toX = (x: number) => cLeft + (x / curve.xMax) * cChartW;
  const toY = (y: number) => cTop + cChartH - (y / curve.maxY) * cChartH;
  const curvePath = curve.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.x).toFixed(1)} ${toY(p.y).toFixed(1)}`)
    .join(" ");
  const shaded = curve.points
    .filter((p) => p.x >= critical)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.x).toFixed(1)} ${toY(p.y).toFixed(1)}`)
    .join(" ");
  const shadedClosed = shaded
    ? `${shaded} L ${toX(curve.xMax).toFixed(1)} ${(cTop + cChartH).toFixed(1)} L ${toX(critical).toFixed(1)} ${(cTop + cChartH).toFixed(1)} Z`
    : "";
  const statX = toX(curve.stat);
  const critX = toX(critical);

  const statLabelAnchor = statX < cLeft + 45 ? "start" : statX > cLeft + cChartW - 45 ? "end" : "middle";
  const statLabelX = statLabelAnchor === "start" ? statX + 4 : statLabelAnchor === "end" ? statX - 4 : statX;

  return (
    <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-xl p-6 shadow-sm space-y-5">
      <div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-500" />
          Prueba Chi-cuadrado (χ²) de Bondad de Ajuste
        </h3>
        <p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">
          Compara las frecuencias observadas en cada intervalo contra las esperadas bajo una distribución normal.
        </p>
      </div>

      {!canCompute ? (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl flex items-center gap-3 text-xs text-amber-700 dark:text-amber-400">
          <Info className="w-4 h-4 shrink-0" />
          <span>{chiResult.interpretation}</span>
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Panel A */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-gray-500 mb-3">
                Frecuencias Observadas vs Esperadas
              </h4>
              <svg viewBox={`0 0 ${barW} ${barH}`} className="w-full h-auto select-none">
                {/* Baseline */}
                <line
                  x1={bLeft}
                  y1={bTop + bChartH}
                  x2={barW - bRight}
                  y2={bTop + bChartH}
                  className="stroke-zinc-300 dark:stroke-[#30363D]"
                  strokeWidth="1.5"
                />

                {/* Bars */}
                {bins.observed.map((obs, i) => {
                  const exp = bins.expected[i];
                  const cx = barCenter(i);
                  const isHovered = hoveredBin === i;
                  return (
                    <g
                      key={`be-${i}`}
                      onMouseEnter={() => setHoveredBin(i)}
                      onMouseLeave={() => setHoveredBin(null)}
                      style={{ cursor: "pointer" }}
                    >
                      <rect
                        x={cx - barWidth / 2}
                        y={barTop(obs)}
                        width={barWidth}
                        height={barHeight(obs)}
                        rx="2"
                        className={
                          isHovered
                            ? "fill-blue-500 stroke-blue-600"
                            : "fill-blue-500/40 stroke-blue-500/70"
                        }
                        strokeWidth="1"
                      />
                      <rect
                        x={cx - barWidth / 2}
                        y={barTop(exp)}
                        width={barWidth}
                        height={barHeight(exp)}
                        rx="2"
                        className="fill-none stroke-green-500 dark:stroke-green-400"
                        strokeWidth="1.5"
                        strokeDasharray="4,2"
                      />
                      {/* Bin number */}
                      <text
                        x={cx}
                        y={bTop + bChartH + 14}
                        textAnchor="middle"
                        className="fill-zinc-400 dark:fill-gray-500 font-mono text-[8px]"
                      >
                        {i + 1}
                      </text>

                      {/* Contribution tooltip */}
                      {isHovered && (
                        <g transform={`translate(${cx - 30}, ${Math.max(bTop, barTop(obs) - 26)})`}>
                          <rect width="60" height="20" rx="4" className="fill-zinc-800/90 dark:fill-zinc-800/90" />
                          <text x="30" y="14" textAnchor="middle" className="fill-white text-[9px] font-mono font-bold">
                            (O-E)²/E {bins.contributions[i].toFixed(2)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* Y axis ticks */}
                {[0, 0.5, 1].map((f) => (
                  <g key={`yt-${f}`}>
                    <line
                      x1={bLeft}
                      y1={barTop(maxFreq * f)}
                      x2={barW - bRight}
                      y2={barTop(maxFreq * f)}
                      className="stroke-zinc-200 dark:stroke-[#30363D]"
                      strokeWidth="0.75"
                      strokeDasharray={f === 0 ? "none" : "2,3"}
                    />
                    <text
                      x={bLeft - 6}
                      y={barTop(maxFreq * f) + 3}
                      textAnchor="end"
                      className="fill-zinc-400 dark:fill-gray-500 font-mono text-[8px]"
                    >
                      {Math.round(maxFreq * f)}
                    </text>
                  </g>
                ))}

                {/* Legend */}
                <g transform={`translate(${bLeft + 8}, ${bTop + 8})`}>
                  <rect width="12" height="8" rx="2" className="fill-blue-500/40 stroke-blue-500/70" strokeWidth="1" />
                  <text x="16" y="9" className="fill-zinc-500 dark:fill-gray-400 text-[8px]">Observado</text>
                  <rect x="78" y="0" width="12" height="8" rx="2" className="fill-none stroke-green-500" strokeWidth="1.5" strokeDasharray="2,1" />
                  <text x="94" y="9" className="fill-green-600 dark:fill-green-400 text-[8px]">Esperado (Normal)</text>
                </g>

                <text
                  x={bLeft + bChartW / 2}
                  y={barH - 6}
                  textAnchor="middle"
                  className="fill-zinc-400 dark:fill-gray-500 text-[8px]"
                >
                  Intervalo (Bin) — pasa el cursor para ver la contribución al χ²
                </text>
              </svg>
            </div>

            {/* Panel B */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-gray-500 mb-3">
                Distribución χ² con región crítica (gl = {df})
              </h4>
              <svg viewBox={`0 0 ${cW} ${cH}`} className="w-full h-auto select-none">
                {/* Baseline */}
                <line
                  x1={cLeft}
                  y1={cTop + cChartH}
                  x2={cW - cRight}
                  y2={cTop + cChartH}
                  className="stroke-zinc-300 dark:stroke-[#30363D]"
                  strokeWidth="1.5"
                />

                {/* Shaded rejection region */}
                {shadedClosed && (
                  <path d={shadedClosed} className="fill-amber-500/25 dark:fill-amber-500/20" />
                )}

                {/* Curve */}
                <path d={curvePath} fill="none" className="stroke-blue-500 dark:stroke-blue-400" strokeWidth="2.5" />

                {/* Critical value line */}
                <line
                  x1={critX}
                  y1={cTop}
                  x2={critX}
                  y2={cTop + cChartH}
                  className="stroke-zinc-500 dark:stroke-gray-400"
                  strokeWidth="1.5"
                  strokeDasharray="5,3"
                />
                <text
                  x={Math.min(critX + 4, cW - cRight - 2)}
                  y={cTop + 14}
                  className="fill-zinc-500 dark:fill-gray-400 text-[9px] font-bold"
                  textAnchor={critX > cW - cRight - 70 ? "end" : "start"}
                >
                  χ² crit = {critical.toFixed(2)}
                </text>

                {/* Rejection region label */}
                {curve.stat > critical && (
                  <text
                    x={(critX + toX(curve.xMax)) / 2}
                    y={cTop + cChartH * 0.55}
                    textAnchor="middle"
                    className="fill-amber-600 dark:fill-amber-400 text-[9px] font-bold"
                  >
                    Región de rechazo (α = 0.05)
                  </text>
                )}

                {/* Statistic line */}
                <line
                  x1={statX}
                  y1={cTop}
                  x2={statX}
                  y2={cTop + cChartH}
                  className={chiResult.isNormal ? "stroke-emerald-500" : "stroke-amber-500"}
                  strokeWidth="2.5"
                />
                <text
                  x={statLabelX}
                  y={cTop + cChartH - 8}
                  textAnchor={statLabelAnchor}
                  className={`${chiResult.isNormal ? "fill-emerald-500" : "fill-amber-500"} text-[9px] font-bold font-mono`}
                >
                  χ² = {curve.stat.toFixed(2)}
                </text>

                {/* X axis ticks */}
                {[0, critical, curve.xMax].map((xv, i) => (
                  <g key={`xt-${i}`}>
                    <line
                      x1={toX(xv)}
                      y1={cTop + cChartH}
                      x2={toX(xv)}
                      y2={cTop + cChartH + 5}
                      className="stroke-zinc-300 dark:stroke-[#30363D]"
                      strokeWidth="1"
                    />
                    <text
                      x={toX(xv)}
                      y={cTop + cChartH + 18}
                      textAnchor="middle"
                      className="fill-zinc-400 dark:fill-gray-500 font-mono text-[8px]"
                    >
                      {xv.toFixed(1)}
                    </text>
                  </g>
                ))}

                {/* Y axis label */}
                <text
                  transform={`translate(12, ${cTop + cChartH / 2}) rotate(-90)`}
                  textAnchor="middle"
                  className="fill-zinc-400 dark:fill-gray-500 text-[8px]"
                >
                  Densidad χ²
                </text>

                <text
                  x={cLeft + cChartW / 2}
                  y={cH - 6}
                  textAnchor="middle"
                  className="fill-zinc-400 dark:fill-gray-500 text-[8px]"
                >
                  Valor del estadístico χ² — el área a la derecha del crítico es la zona de rechazo
                </text>
              </svg>
            </div>
          </div>

          {/* Summary strip */}
          <div className="border-t border-zinc-100 dark:border-[#30363D] pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">Muestra (n)</span>
                <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{sortedData.length}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">Intervalos (k)</span>
                <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{bins.k}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">Grados de libertad</span>
                <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{df}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">Estadístico χ²</span>
                <span className={`block text-sm font-black font-mono mt-1 ${verdictColor}`}>{chiResult.statisticValue.toFixed(4)}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">χ² crítico (α=0.05)</span>
                <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{critical.toFixed(4)}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">p-valor</span>
                <span className={`block text-sm font-black font-mono mt-1 ${verdictColor}`}>
                  {chiResult.pValue < 0.0001 ? "< 0.0001" : chiResult.pValue.toFixed(4)}
                </span>
              </div>
            </div>

            <div className={`mt-3 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-xs ${
              chiResult.isNormal
                ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/40 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400"
                : "bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/40 dark:border-amber-900/30 text-amber-800 dark:text-amber-400"
            }`}>
              <span className="font-bold">{chiResult.isNormal ? "✓" : "✗"} Veredicto χ²: {verdictBadge}</span>
              <span className="text-[11px]">{chiResult.interpretation}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
