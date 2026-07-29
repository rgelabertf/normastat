import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Move,
  BarChart3,
  Lightbulb,
  Sigma,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { stdNormalCDF, runKolmogorovSmirnov, getSummaryStatistics } from "../utils/stats";

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
    title: "¿Qué es Kolmogorov-Smirnov?",
    subtitle: "La máxima distancia entre dos funciones",
    explanation: "La prueba Kolmogorov-Smirnov compara la función de distribución acumulada empírica (ECDF) de tus datos con la CDF teórica de una distribución normal. El estadístico D mide la máxima distancia vertical entre ambas curvas. Mientras más grande sea D, menos normales son los datos."
  },
  {
    id: 1,
    title: "Paso 1: Construir la ECDF",
    subtitle: "La función escalonada de tus datos",
    explanation: "La ECDF (Función de Distribución Acumulada Empírica) asigna a cada valor la proporción de datos que son ≤ ese valor. Es una función escalonada: en cada dato observado, la función sube 1/n."
  },
  {
    id: 2,
    title: "Paso 2: Superponer la CDF teórica",
    subtitle: "¿Qué esperaríamos si fueran normales?",
    explanation: "Si los datos siguieran una distribución normal, su CDF sería una curva suave con forma de S (sigmoide). Superponemos esta curva teórica sobre la ECDF empírica para compararlas visualmente."
  },
  {
    id: 3,
    title: "Paso 3: Encontrar D",
    subtitle: "La brecha más grande entre ambas curvas",
    explanation: "D = max |ECDF(x) − CDF_normal(x)|. Este es el estadístico de Kolmogorov-Smirnov. Representa la máxima desviación vertical entre lo que observas y lo que esperarías bajo normalidad."
  },
  {
    id: 4,
    title: "Paso 4: Interpretar D",
    subtitle: "¿Es D lo suficientemente grande?",
    explanation: "Si D es grande (p-valor < 0.05), rechazamos la hipótesis de normalidad. Esto significa que la distancia máxima entre la ECDF y la CDF normal es mayor de lo que esperaríamos por azar."
  }
];

function computeKS(sortedData: number[]) {
  const { mean, sd } = getSummaryStatistics(sortedData);
  const result = runKolmogorovSmirnov(sortedData, mean, sd);
  const n = sortedData.length;
  let maxD = 0;
  let maxAtX = sortedData[0];
  let maxAtY_ECDF = 0;
  let maxAtY_CDF = 0;
  let maxIsAfter = false;

  for (let i = 0; i < n; i++) {
    const x = sortedData[i];
    const z = (x - mean) / sd;
    const cdf = stdNormalCDF(z);

    const ecdfBefore = i / n;
    const dBefore = Math.abs(ecdfBefore - cdf);
    if (dBefore > maxD) {
      maxD = dBefore;
      maxAtX = x;
      maxAtY_ECDF = ecdfBefore;
      maxAtY_CDF = cdf;
      maxIsAfter = false;
    }

    const ecdfAfter = (i + 1) / n;
    const dAfter = Math.abs(ecdfAfter - cdf);
    if (dAfter > maxD) {
      maxD = dAfter;
      maxAtX = x;
      maxAtY_ECDF = ecdfAfter;
      maxAtY_CDF = cdf;
      maxIsAfter = true;
    }
  }

  return {
    ...result,
    maxD,
    maxAtX,
    maxAtY_ECDF,
    maxAtY_CDF,
    maxIsAfter,
    mean,
    sd,
    n
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const KolmogorovSmirnovTutorial: React.FC = () => {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoTimer, setAutoTimer] = useState<number | null>(null);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [userShuffledData, setUserShuffledData] = useState<number[]>([...DEMO_DATA]);
  const [playSortAnim, setPlaySortAnim] = useState(false);
  const [sortProgress, setSortProgress] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const isSorted = step >= 1;
  const sortedData = useMemo(() => {
    if (interactiveMode) return [...userShuffledData].sort((a, b) => a - b);
    return [...DEMO_DATA].sort((a, b) => a - b);
  }, [interactiveMode, userShuffledData]);

  const currentData = useMemo(() => {
    if (!interactiveMode) {
      if (step === 0) return shuffleArray(DEMO_DATA);
      if (step === 1 && !playSortAnim) return shuffleArray(DEMO_DATA);
      if (step === 1 && playSortAnim) {
        const shuffled = shuffleArray(DEMO_DATA);
        const sorted = [...DEMO_DATA].sort((a, b) => a - b);
        return shuffled.map((v, i) => v + (sorted[i] - v) * sortProgress);
      }
      return sortedData;
    }
    if (playSortAnim && step === 1) {
      const shuffled = shuffleArray(DEMO_DATA);
      const sorted = [...DEMO_DATA].sort((a, b) => a - b);
      return shuffled.map((v, i) => v + (sorted[i] - v) * sortProgress);
    }
    if (step >= 2) return sortedData;
    return userShuffledData;
  }, [step, playSortAnim, sortProgress, sortedData, interactiveMode, userShuffledData]);

  const ksResult = useMemo(() => computeKS(sortedData), [sortedData]);

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
      }, 5000);
      setAutoTimer(t);
      return () => window.clearInterval(t);
    } else {
      if (autoTimer) {
        window.clearInterval(autoTimer);
        setAutoTimer(null);
      }
    }
  }, [autoPlay]);

  const handleShuffleData = useCallback(() => {
    setUserShuffledData(shuffleArray(DEMO_DATA));
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay(p => !p);
  }, []);

  const svgWidth = 700;
  const svgHeight = 380;
  const padLeft = 70;
  const padRight = 50;
  const padTop = 40;
  const padBottom = 50;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const minVal = Math.min(...sortedData) - 2;
  const maxVal = Math.max(...sortedData) + 2;
  const dataRange = maxVal - minVal || 1;

  const toSvgX = (v: number) => padLeft + ((v - minVal) / dataRange) * chartW;
  const toSvgY = (p: number) => padTop + chartH - p * chartH;

  const ecdfPath = useMemo(() => {
    const n = sortedData.length;
    if (n === 0) return "";
    let path = `M ${toSvgX(sortedData[0])} ${toSvgY(0)}`;
    for (let i = 0; i < n; i++) {
      const x = toSvgX(sortedData[i]);
      const yBefore = toSvgY(i / n);
      const yAfter = toSvgY((i + 1) / n);
      path += ` L ${x} ${yBefore} L ${x} ${yAfter}`;
      if (i < n - 1) {
        path += ` L ${toSvgX(sortedData[i + 1])} ${yAfter}`;
      }
    }
    return path;
  }, [sortedData]);

  const normalCdfPath = useMemo(() => {
    const steps = 100;
    const range = maxVal - minVal;
    let path = "";
    for (let j = 0; j <= steps; j++) {
      const x = minVal + (j / steps) * range;
      const z = (x - ksResult.mean) / ksResult.sd;
      const cdf = stdNormalCDF(z);
      const sx = toSvgX(x);
      const sy = toSvgY(cdf);
      if (j === 0) path += `M ${sx} ${sy}`;
      else path += ` L ${sx} ${sy}`;
    }
    return path;
  }, [minVal, maxVal, ksResult.mean, ksResult.sd]);

  const maxDX = toSvgX(ksResult.maxAtX);
  const maxDY_ECDF = toSvgY(ksResult.maxAtY_ECDF);
  const maxDY_CDF = toSvgY(ksResult.maxAtY_CDF);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              Tutorial Interactivo: Kolmogorov-Smirnov
            </h2>
            <p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">
              Aprende visualmente cómo la prueba KS compara dos funciones de distribución
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setInteractiveMode(m => !m); setStep(0); setPlaySortAnim(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                interactiveMode
                  ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                  : "bg-white dark:bg-[#0D1117] border-zinc-200 dark:border-[#30363D] text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-[#21262D]"
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>{interactiveMode ? "Modo Tutorial" : "Modo Interactivo"}</span>
            </button>
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

        <div className="flex items-center gap-3 mt-4 mb-2">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setStep(s.id); setPlaySortAnim(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                step === s.id
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : step > s.id
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400"
                    : "bg-white dark:bg-[#0D1117] border-zinc-200 dark:border-[#30363D] text-zinc-500 dark:text-gray-400"
              }`}
            >
              {step > s.id ? <span className="text-xs">✓</span> : <span>{s.id + 1}</span>}
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
            <text x={padLeft + chartW / 2} y={svgHeight - 8} textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[10px] font-medium">
              Valor de los Datos
            </text>
            <text transform={`translate(14, ${padTop + chartH / 2}) rotate(-90)`} textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[10px] font-medium">
              Probabilidad Acumulada
            </text>

            <line x1={padLeft} y1={padTop + chartH} x2={padLeft + chartW} y2={padTop + chartH} className="stroke-zinc-300 dark:stroke-[#30363D]" strokeWidth="1" />
            <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} className="stroke-zinc-300 dark:stroke-[#30363D]" strokeWidth="1" />

            {[0, 0.25, 0.5, 0.75, 1.0].map(p => (
              <g key={`yl-${p}`}>
                <line x1={padLeft - 4} y1={toSvgY(p)} x2={padLeft + chartW} y2={toSvgY(p)} className="stroke-zinc-200 dark:stroke-[#21262D]" strokeWidth="0.5" strokeDasharray="3,3" />
                <text x={padLeft - 8} y={toSvgY(p) + 3} textAnchor="end" className="fill-zinc-400 dark:fill-gray-500 text-[9px] font-mono">
                  {p}
                </text>
              </g>
            ))}

            {step >= 1 && (
              <motion.path
                d={ecdfPath}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="stroke-blue-500 dark:stroke-blue-400"
                strokeWidth="2.5"
                fill="none"
                strokeLinejoin="round"
              />
            )}

            {step >= 1 && sortedData.map((val, i) => {
              const x = toSvgX(val);
              const yAfter = toSvgY((i + 1) / sortedData.length);
              return (
                <motion.circle
                  key={`ecdf-${i}`}
                  cx={x}
                  cy={yAfter}
                  r={3}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="fill-blue-500 dark:fill-blue-400"
                />
              );
            })}

            {step >= 2 && (
              <motion.path
                d={normalCdfPath}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="stroke-emerald-500 dark:stroke-emerald-400"
                strokeWidth="2.5"
                fill="none"
              />
            )}

            {(step === 3 || step === 4) && (
              <g>
                <motion.line
                  x1={maxDX}
                  y1={maxDY_ECDF}
                  x2={maxDX}
                  y2={maxDY_CDF}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="stroke-red-500 dark:stroke-red-400"
                  strokeWidth="2.5"
                  strokeDasharray="4,3"
                />
                <motion.polygon
                  points={`${maxDX - 5},${(maxDY_ECDF + maxDY_CDF) / 2 + 6} ${maxDX + 5},${(maxDY_ECDF + maxDY_CDF) / 2 + 6} ${maxDX},${(maxDY_ECDF + maxDY_CDF) / 2}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="fill-red-500 dark:fill-red-400"
                />
                <motion.text
                  x={maxDX + 12}
                  y={(maxDY_ECDF + maxDY_CDF) / 2 + 4}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="fill-red-500 dark:fill-red-400 text-[13px] font-bold font-mono"
                >
                  D = {ksResult.maxD.toFixed(4)}
                </motion.text>
              </g>
            )}

            {step >= 2 && (
              <g transform={`translate(${padLeft + chartW - 160}, ${padTop + 8})`}>
                <rect width="150" height="50" rx="6" className="fill-white/90 dark:fill-[#161B22]/90 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                <line x1="10" y1="18" x2="30" y2="18" className="stroke-blue-500 dark:stroke-blue-400" strokeWidth="2" />
                <text x="36" y="22" className="fill-zinc-600 dark:fill-gray-400 text-[9px] font-medium">ECDF (datos)</text>
                <line x1="10" y1="38" x2="30" y2="38" className="stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="2" />
                <text x="36" y="42" className="fill-zinc-600 dark:fill-gray-400 text-[9px] font-medium">CDF Normal</text>
              </g>
            )}

            {(step === 3 || step === 4) && (
              <g transform={`translate(${padLeft + 10}, ${padTop + chartH - 100})`}>
                <rect width="160" height="70" rx="8" className="fill-white/90 dark:fill-[#161B22]/90 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                <text x="12" y="20" className="fill-zinc-700 dark:fill-zinc-300 text-[11px] font-bold">Estadístico D</text>
                <text x="12" y="44" className="text-[18px] font-black font-mono fill-red-500 dark:fill-red-400">
                  {ksResult.maxD.toFixed(4)}
                </text>
              </g>
            )}

            {step === 4 && (
              <g transform={`translate(${padLeft + chartW - 170}, ${padTop + 10})`}>
                <rect width="155" height="80" rx="8" className="fill-white/90 dark:fill-[#161B22]/90 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                <text x="12" y="22" className="fill-zinc-700 dark:fill-zinc-300 text-[11px] font-bold">Diagnóstico</text>
                <text x="12" y="44" className={`text-[13px] font-bold ${ksResult.pValue > 0.05 ? "fill-emerald-500" : "fill-amber-500"}`}>
                  {ksResult.pValue > 0.05 ? "✓ Normal" : "✗ No Normal"}
                </text>
                <text x="12" y="64" className="fill-zinc-500 dark:fill-zinc-400 text-[10px] font-mono">
                  p = {ksResult.pValue < 0.001 ? "< 0.001" : ksResult.pValue.toFixed(4)}
                </text>
              </g>
            )}

            {step === 2 && (
              <g transform={`translate(${padLeft + chartW / 2 - 90}, ${padTop + chartH - 30})`}>
                <rect width="180" height="24" rx="6" className="fill-blue-50/90 dark:fill-blue-950/40 stroke-blue-200 dark:stroke-blue-900" strokeWidth="1" />
                <text x="90" y="17" textAnchor="middle" className="fill-blue-700 dark:fill-blue-300 text-[9px] font-bold">
                  ← Distancia vertical entre curvas →
                </text>
              </g>
            )}
          </svg>

          {interactiveMode && step >= 3 && (
            <div className="text-center mt-2">
              <button
                onClick={handleShuffleData}
                className="flex items-center gap-1.5 px-3 py-1.5 mx-auto text-xs font-bold rounded-lg border bg-white dark:bg-[#0D1117] border-zinc-200 dark:border-[#30363D] text-zinc-600 dark:text-gray-400 hover:bg-zinc-50 dark:hover:bg-[#21262D] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Mezclar datos y observar cómo cambia D</span>
              </button>
            </div>
          )}
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
            {step === 1 && (
              <button
                onClick={() => {
                  if (!playSortAnim) {
                    setPlaySortAnim(true);
                    const start = performance.now();
                    const dur = 1500;
                    const anim = (t: number) => {
                      const elapsed = t - start;
                      const prog = Math.min(1, elapsed / dur);
                      setSortProgress(prog);
                      if (prog < 1) requestAnimationFrame(anim);
                    };
                    requestAnimationFrame(anim);
                  }
                }}
                disabled={playSortAnim}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg border bg-blue-600 text-white border-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <StepForward className="w-3.5 h-3.5" />
                Animar Ordenamiento
              </button>
            )}
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
            <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{ksResult.n}</span>
          </div>
          <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
            <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">Estadístico D</span>
            <span className={`block text-sm font-black font-mono mt-1 ${ksResult.pValue > 0.05 ? "text-emerald-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {ksResult.maxD.toFixed(4)}
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
            <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">p-valor</span>
            <span className={`block text-sm font-black font-mono mt-1 ${ksResult.pValue > 0.05 ? "text-emerald-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {ksResult.pValue < 0.001 ? "< 0.001" : ksResult.pValue.toFixed(4)}
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
            <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">Interpretación</span>
            <span className="block text-sm font-black mt-1">
              <span className={ksResult.pValue > 0.05 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                {ksResult.pValue > 0.05 ? "Distribución Normal" : "No Normal"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
