import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Move,
  BarChart3,
  ArrowRight,
  Lightbulb,
  Sigma,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { runChiSquareGOF, getSummaryStatistics } from "../utils/stats";

const DEMO_DATA = [
  168.4, 173.1, 169.5, 175.2, 165.1, 172.3, 178.6, 160.2,
  171.1, 166.7, 174.4, 170.1, 179.3, 164.8, 172.9, 167.2,
  176.5, 169.1, 161.4, 175.8
];

interface StepDef {
  id: number;
  title: string;
  subtitle: string;
  explanation: string;
}

const STEPS: StepDef[] = [
  {
    id: 0,
    title: "¿Qué mide Chi-cuadrado?",
    subtitle: "La diferencia entre lo que observas y lo que esperarías",
    explanation: "La prueba Chi-cuadrado de bondad de ajuste compara las frecuencias observadas en cada 'bin' (intervalo) con las frecuencias que esperaríamos si los datos fueran normales. Si la suma de diferencias es grande, los datos no son normales."
  },
  {
    id: 1,
    title: "Paso 1: Crear los bins",
    subtitle: "Dividir los datos en intervalos (Regla de Sturges)",
    explanation: "Primero dividimos el rango de datos en k intervalos del mismo tamaño. Usamos la regla de Sturges: k = ⌈log₂(n) + 1⌉. Para n = 20, tenemos k = 6 bins. Cada bin agrupará los datos que caen en ese intervalo."
  },
  {
    id: 2,
    title: "Paso 2: Observado vs. Esperado",
    subtitle: "Contar frecuencias y comparar con la normal",
    explanation: "En cada bin contamos cuántos datos observamos (O). Luego calculamos cuántos esperaríamos (E) si la distribución fuera normal, usando la CDF normal con la media y desviación de la muestra."
  },
  {
    id: 3,
    title: "Paso 3: Contribución por bin",
    subtitle: "Cada bin aporta (O - E)² / E al χ² total",
    explanation: "Para cada bin calculamos (O - E)² / E. Esta es la 'contribución' de ese bin al estadístico Chi-cuadrado. Sumando todas las contribuciones obtenemos χ². Los bins con mayor diferencia aportan más."
  },
  {
    id: 4,
    title: "Paso 4: Grados de libertad y p-valor",
    subtitle: "gl = k - 3 y la decisión final",
    explanation: "Los grados de libertad son k - 3 (perdemos 1 por el total y 2 por estimar μ y σ de los datos). Comparamos χ² con la distribución Chi-cuadrado con gl grados de libertad. Si p > 0.05, los datos son normales."
  }
];

function computeChiSquare(sortedData: number[]) {
  const { mean, sd } = getSummaryStatistics(sortedData);
  const result = runChiSquareGOF(sortedData, mean, sd);
  const n = sortedData.length;

  // Recompute bins for visualization
  const k = Math.max(4, Math.ceil(1 + Math.log2(n)));
  const min = sortedData[0];
  const max = sortedData[n - 1];
  const binWidth = (max - min) / k;
  const observed: number[] = new Array(k).fill(0);
  for (let i = 0; i < n; i++) {
    let idx = Math.floor((sortedData[i] - min) / binWidth);
    if (idx >= k) idx = k - 1;
    observed[idx]++;
  }
  const expected: number[] = [];
  const contributions: number[] = [];
  for (let i = 0; i < k; i++) {
    const lower = min + i * binWidth;
    const upper = lower + binWidth;
    const { stdNormalCDF } = require("../utils/stats");
    const cdfLower = stdNormalCDF((lower - mean) / sd);
    const cdfUpper = stdNormalCDF((upper - mean) / sd);
    const expFreq = Math.max((cdfUpper - cdfLower) * n, 0.01);
    expected.push(expFreq);
    contributions.push(Math.pow(observed[i] - expFreq, 2) / expFreq);
  }

  return {
    ...result, n, k, observed, expected, contributions, binWidth,
    min, max, mean, sd
  };
}

const ANIMATION_DURATION = 0.6;

export const ChiSquareTutorial: React.FC = () => {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoTimer, setAutoTimer] = useState<number | null>(null);
  const [playSortAnim, setPlaySortAnim] = useState(false);
  const [hoveredBin, setHoveredBin] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const sortedData = useMemo(() => {
    return [...DEMO_DATA].sort((a, b) => a - b);
  }, []);

  const stats = useMemo(() => getSummaryStatistics(sortedData), [sortedData]);
  const chiResult = useMemo(() => runChiSquareGOF(sortedData, stats.mean, stats.sd), [sortedData, stats]);

  // Compute bin data for visualization
  const bins = useMemo(() => {
    const k = Math.max(4, Math.ceil(1 + Math.log2(sortedData.length)));
    const min = sortedData[0];
    const max = sortedData[sortedData.length - 1];
    const binWidth = (max - min) / k;
    const observed: number[] = new Array(k).fill(0);
    for (let i = 0; i < sortedData.length; i++) {
      let idx = Math.floor((sortedData[i] - min) / binWidth);
      if (idx >= k) idx = k - 1;
      observed[idx]++;
    }
    const expected: number[] = [];
    const contributions: number[] = [];
    for (let i = 0; i < k; i++) {
      const lower = min + i * binWidth;
      const upper = lower + binWidth;
      const cdfLower = (() => {
        const z = (lower - stats.mean) / stats.sd;
        const t = 1 / (1 + 0.2316419 * Math.abs(z));
        const d = 0.39894228 * Math.exp(-z * z / 2);
        const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.3302744))));
        return z >= 0 ? 1 - p : p;
      })();
      const cdfUpper = (() => {
        const z = (upper - stats.mean) / stats.sd;
        const t = 1 / (1 + 0.2316419 * Math.abs(z));
        const d = 0.39894228 * Math.exp(-z * z / 2);
        const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.3302744))));
        return z >= 0 ? 1 - p : p;
      })();
      const expFreq = Math.max((cdfUpper - cdfLower) * sortedData.length, 0.01);
      expected.push(expFreq);
      contributions.push(Math.pow(observed[i] - expFreq, 2) / expFreq);
    }
    const totalChi = contributions.reduce((a, b) => a + b, 0);
    return { k, min, max, binWidth, observed, expected, contributions, totalChi };
  }, [sortedData, stats]);

  const nextStep = useCallback(() => {
    if (step < 4) {
      setPlaySortAnim(false);
      setStep(s => s + 1);
    }
  }, [step]);

  const prevStep = useCallback(() => {
    if (step > 0) {
      setPlaySortAnim(false);
      setStep(s => s - 1);
    }
  }, [step]);

  useEffect(() => {
    if (autoPlay) {
      const t = window.setInterval(() => {
        setStep(s => {
          if (s >= 4) {
            setAutoPlay(false);
            return s;
          }
          setPlaySortAnim(false);
          return s + 1;
        });
      }, 6000);
      setAutoTimer(t);
      return () => window.clearInterval(t);
    } else {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        setAutoTimer(null);
      }
    }
  }, [autoPlay]);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay(p => !p);
  }, []);

  const svgWidth = 700;
  const svgHeight = 380;
  const padLeft = 60;
  const padRight = 40;
  const padTop = 40;
  const padBottom = 50;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const maxFreq = Math.max(...bins.observed, ...bins.expected);
  const barScale = maxFreq > 0 ? (chartH - 30) / maxFreq : 1;
  const barWidth = Math.min(40, (chartW - 20) / bins.k);

  const toBarX = (i: number) => padLeft + 10 + i * (barWidth + 4);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              Tutorial Interactivo: Chi-cuadrado (χ²)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">
              Aprende cómo la prueba de bondad de ajuste evalúa la normalidad
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAutoPlay}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                autoPlay
                  ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-800 text-green-700 dark:text-green-400"
                  : "bg-white dark:bg-[#0D1117] border-zinc-200 dark:border-[#30363D] text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-[#21262D]"
              }`}
            >
              {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{autoPlay ? "Pausar" : "Auto-Play"}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 mb-2 overflow-x-auto scrollbar-hide">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setStep(s.id); setPlaySortAnim(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer whitespace-nowrap ${
                step === s.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : step > s.id
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400"
                    : "bg-white dark:bg-[#0D1117] border-zinc-200 dark:border-[#30363D] text-zinc-500 dark:text-gray-400"
              }`}
            >
              {step > s.id ? <span className="text-xs">✓</span> : <span>{s.id + 1}</span>}
              <span className="hidden sm:inline">{s.title.replace("Paso ", "")}</span>
            </button>
          ))}
        </div>

        <div className="bg-zinc-50 dark:bg-[#0D1117] border border-zinc-200 dark:border-[#30363D] rounded-xl p-4 mb-4">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-sm font-bold text-zinc-800 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              {STEPS[step].title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-gray-400 mt-1 leading-relaxed">
              {STEPS[step].explanation}
            </p>
          </motion.div>
        </div>

        <div className="relative w-full">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            {/* Step 0: Concept visualization - histogram with normal curve */}
            {step === 0 && (
              <g>
                <rect x={padLeft} y={padTop} width={chartW} height={chartH} rx="8" className="fill-zinc-900/5 dark:fill-white/5 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />

                {/* Simple histogram */}
                {bins.observed.map((obs, i) => {
                  const x = toBarX(i);
                  const h = obs * barScale;
                  return (
                    <g key={`obs-${i}`}>
                      <rect x={x} y={padTop + chartH - h - 15} width={barWidth} height={h} rx="3" className="fill-blue-500/40 stroke-blue-500/60" strokeWidth="1" />
                    </g>
                  );
                })}

                {/* Normal curve overlay */}
                {(function() {
                  const points: { x: number; y: number }[] = [];
                  for (let i = 0; i <= 60; i++) {
                    const t = bins.min + (i / 60) * (bins.max - bins.min);
                    const z = (t - stats.mean) / stats.sd;
                    const d = 0.39894228 * Math.exp(-z * z / 2);
                    const y = padTop + chartH - 15 - (d / 0.4) * (chartH * 0.7);
                    const x = padLeft + 10 + (i / 60) * (chartW - 20);
                    points.push({ x, y });
                  }
                  return (
                    <polyline
                      points={points.map(p => `${p.x},${p.y}`).join(" ")}
                      className="fill-none stroke-green-500"
                      strokeWidth="2"
                    />
                  );
                })()}

                {/* Labels */}
                <text x={padLeft + chartW / 2} y={padTop + 18} textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[9px] font-medium">
                  Histograma con curva normal superpuesta
                </text>
                <text x={padLeft + chartW / 2} y={svgHeight - 8} textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[9px] font-medium">
                  ¿Las barras azules siguen la curva verde?
                </text>
              </g>
            )}

            {/* Step 1: Sturges rule - bins creation */}
            {step === 1 && (
              <g>
                <rect x={padLeft} y={padTop} width={chartW} height={chartH} rx="8" className="fill-zinc-900/5 dark:fill-white/5 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />

                {/* Data points with bin dividers */}
                {sortedData.map((val, i) => {
                  const x = padLeft + 10 + ((val - bins.min) / (bins.max - bins.min)) * (chartW - 20);
                  return (
                    <motion.circle
                      key={`dp-${i}`}
                      initial={{ opacity: 0, r: 0 }}
                      animate={{ cx: x, cy: padTop + chartH / 2 + 10, opacity: 1, r: 5 }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className="fill-blue-500/80 stroke-blue-700 dark:stroke-blue-400"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Bin divider lines */}
                {Array.from({ length: bins.k + 1 }, (_, i) => {
                  const x = padLeft + 10 + (i / bins.k) * (chartW - 20);
                  return (
                    <line key={`div-${i}`}
                      x1={x} y1={padTop + 25} x2={x} y2={padTop + chartH - 5}
                      className="stroke-amber-500/60" strokeWidth="1.5" strokeDasharray="4,3"
                    />
                  );
                })}

                {/* Bin labels */}
                {Array.from({ length: bins.k }, (_, i) => {
                  const x = padLeft + 10 + (i / bins.k) * (chartW - 20) + (chartW - 20) / (bins.k * 2);
                  return (
                    <text key={`bl-${i}`} x={x} y={padTop + chartH - 10} textAnchor="middle" className="fill-zinc-400 text-[8px] font-mono">
                      Bin {i + 1}
                    </text>
                  );
                })}

                {/* Sturges formula */}
                <g transform={`translate(${padLeft + chartW / 2 - 150}, ${padTop + 55})`}>
                  <rect width="300" height="55" rx="6" className="fill-white/90 dark:fill-[#161B22]/90 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                  <text x="150" y="18" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300 text-[11px] font-bold">Regla de Sturges</text>
                  <text x="150" y="38" textAnchor="middle" className="fill-blue-600 dark:fill-blue-400 text-[13px] font-bold font-mono">k = ⌈log₂(n) + 1⌉</text>
                  <text x="150" y="50" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[9px]">
                    n = {sortedData.length} → k = {bins.k} bins
                  </text>
                </g>

                <text x={padLeft + chartW / 2} y={padTop + 18} textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[9px] font-medium">
                  Los puntos se agrupan en {bins.k} intervalos del mismo tamaño
                </text>
              </g>
            )}

            {/* Step 2: Observed vs Expected - bar chart */}
            {step === 2 && (
              <g>
                <rect x={padLeft} y={padTop} width={chartW} height={chartH} rx="8" className="fill-zinc-900/5 dark:fill-white/5 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />

                {bins.observed.map((obs, i) => {
                  const exp = bins.expected[i];
                  const x = toBarX(i);
                  const hObs = obs * barScale;
                  const hExp = exp * barScale;
                  return (
                    <g key={`be-${i}`}>
                      {/* Observed bar (filled) */}
                      <rect x={x} y={padTop + chartH - hObs - 15} width={barWidth} height={hObs} rx="3" className="fill-blue-500/40 stroke-blue-500/60" strokeWidth="1" />
                      {/* Expected outline */}
                      <rect x={x} y={padTop + chartH - hExp - 15} width={barWidth} height={hExp} rx="3" className="fill-none stroke-green-500" strokeWidth="2" strokeDasharray="4,2" />
                      {/* Bin number */}
                      <text x={x + barWidth / 2} y={padTop + chartH - 3} textAnchor="middle" className="fill-zinc-400 text-[8px] font-mono">{i + 1}</text>
                    </g>
                  );
                })}

                {/* Legend */}
                <g transform={`translate(${padLeft + 20}, ${padTop + 20})`}>
                  <rect x="0" y="0" width="16" height="10" rx="2" className="fill-blue-500/40 stroke-blue-500/60" strokeWidth="1" />
                  <text x="20" y="9" className="fill-zinc-300 text-[8px]">Observado (O)</text>
                  <rect x="100" y="0" width="16" height="10" rx="2" className="fill-none stroke-green-500" strokeWidth="2" strokeDasharray="2,1" />
                  <text x="120" y="9" className="fill-green-500 text-[8px]">Esperado (E) — normal</text>
                </g>
              </g>
            )}

            {/* Step 3: Contribution per bin */}
            {step === 3 && (
              <g>
                <rect x={padLeft} y={padTop} width={chartW} height={chartH} rx="8" className="fill-zinc-900/5 dark:fill-white/5 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />

                {bins.contributions.map((contrib, i) => {
                  const x = toBarX(i);
                  const maxContrib = Math.max(...bins.contributions, 0.01);
                  const hContrib = (contrib / maxContrib) * (chartH - 30);
                  return (
                    <g key={`contrib-${i}`}
                      onMouseEnter={() => setHoveredBin(i)}
                      onMouseLeave={() => setHoveredBin(null)}
                      style={{ cursor: "pointer" }}
                    >
                      <rect x={x} y={padTop + chartH - hContrib - 15} width={barWidth} height={hContrib} rx="3"
                        className={`${contrib > (bins.totalChi / bins.k) ? "fill-amber-500/50 stroke-amber-500" : "fill-blue-500/30 stroke-blue-500/50"}`}
                        strokeWidth="1.5"
                      />
                      {/* Contribution value */}
                      {hoveredBin === i && (
                        <g transform={`translate(${x - 15}, ${padTop + chartH - hContrib - 30})`}>
                          <rect width="70" height="22" rx="4" className="fill-zinc-800/90 dark:fill-zinc-800/90" />
                          <text x="35" y="15" textAnchor="middle" className="fill-white text-[9px] font-mono font-bold">
                            {contrib.toFixed(2)}
                          </text>
                        </g>
                      )}
                      {/* Bin number */}
                      <text x={x + barWidth / 2} y={padTop + chartH - 3} textAnchor="middle" className="fill-zinc-400 text-[8px] font-mono">{i + 1}</text>
                    </g>
                  );
                })}

                {/* Total chi-square box */}
                <g transform={`translate(${padLeft + chartW - 165}, ${padTop + 15})`}>
                  <rect width="155" height="55" rx="6" className="fill-white/90 dark:fill-[#161B22]/90 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                  <text x="78" y="18" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[8px] font-bold uppercase tracking-wider">χ² total</text>
                  <text x="78" y="42" textAnchor="middle" className="fill-blue-600 dark:fill-blue-400 text-[18px] font-black font-mono">
                    {bins.totalChi.toFixed(4)}
                  </text>
                </g>

                {/* Formula reminder */}
                <text x={padLeft + chartW / 2} y={padTop + 18} textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[9px] font-medium">
                  Pasa el cursor sobre cada barra para ver su contribución
                </text>

                <text x={padLeft + chartW / 2} y={svgHeight - 8} textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[9px] font-medium">
                  χ² = Σ (O - E)² / E = {bins.totalChi.toFixed(4)}
                </text>
              </g>
            )}

            {/* Step 4: Result interpretation */}
            {step === 4 && (
              <g>
                <rect x={padLeft} y={padTop} width={chartW} height={chartH} rx="8" className="fill-zinc-900/5 dark:fill-white/5 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />

                <g transform={`translate(${padLeft + chartW / 2 - 200}, ${padTop + 30})`}>
                  {/* Chi-square value */}
                  <rect x="0" y="0" width="180" height="90" rx="8" className="fill-white/90 dark:fill-[#161B22]/90 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                  <text x="90" y="22" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[9px] font-bold uppercase tracking-wider">Estadístico χ²</text>
                  <text x="90" y="55" textAnchor="middle" className={`text-[22px] font-black font-mono ${
                    chiResult.pValue > 0.05 ? "fill-emerald-500" : "fill-amber-500"
                  }`}>
                    {chiResult.statisticValue.toFixed(4)}
                  </text>
                  <text x="90" y="78" textAnchor="middle" className="fill-zinc-400 text-[9px]">
                    gl = k - 3 = {bins.k - 3}
                  </text>

                  {/* p-value */}
                  <rect x="200" y="0" width="180" height="90" rx="8" className="fill-white/90 dark:fill-[#161B22]/90 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                  <text x="290" y="22" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[9px] font-bold uppercase tracking-wider">p-valor</text>
                  <text x="290" y="55" textAnchor="middle" className={`text-[22px] font-black font-mono ${
                    chiResult.pValue > 0.05 ? "fill-emerald-500" : "fill-amber-500"
                  }`}>
                    {chiResult.pValue < 0.001 ? "< 0.001" : chiResult.pValue.toFixed(4)}
                  </text>
                  <text x="290" y="78" textAnchor="middle" className={`text-[11px] font-bold ${
                    chiResult.pValue > 0.05 ? "fill-emerald-500" : "fill-amber-500"
                  }`}>
                    {chiResult.pValue > 0.05 ? "✓ Distribución Normal" : "✗ No Normal"}
                  </text>
                </g>

                {/* Details */}
                <g transform={`translate(${padLeft + 20}, ${padTop + chartH - 35})`}>
                  <rect width="300" height="28" rx="6" className="fill-zinc-900/10 dark:fill-white/5 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                  <text x="150" y="19" textAnchor="middle" className="fill-zinc-600 dark:fill-zinc-400 text-[9px]">
                    k = {bins.k} bins · gl = {bins.k - 3} · n = {sortedData.length}
                  </text>
                </g>
              </g>
            )}
          </svg>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-200 dark:border-[#30363D]">
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border bg-white dark:bg-[#0D1117] border-zinc-200 dark:border-[#30363D] text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-[#21262D] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Anterior
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={nextStep}
              disabled={step === 4}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              {step === 4 ? "Completado" : "Siguiente"}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-gray-400 flex items-center gap-2 mb-3">
          <Sigma className="w-4 h-4 text-blue-500" />
          Resumen del Cálculo
        </h3>
        <div className="grid sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
            <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">Muestra (n)</span>
            <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{sortedData.length}</span>
          </div>
          <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
            <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">Estadístico χ²</span>
            <span className={`block text-sm font-black font-mono mt-1 ${chiResult.pValue > 0.05 ? "text-emerald-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {chiResult.statisticValue.toFixed(4)}
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
            <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">p-valor</span>
            <span className={`block text-sm font-black font-mono mt-1 ${chiResult.pValue > 0.05 ? "text-emerald-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {chiResult.pValue < 0.001 ? "< 0.001" : chiResult.pValue.toFixed(4)}
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
            <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">Interpretación</span>
            <span className="block text-sm font-black mt-1">
              <span className={chiResult.pValue > 0.05 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                {chiResult.pValue > 0.05 ? "Distribución Normal" : "No Normal"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
