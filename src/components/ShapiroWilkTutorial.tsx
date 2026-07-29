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
import { inverseNormalCDF, stdNormalCDF } from "../utils/stats";

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
    title: "¿Qué mide Shapiro-Wilk?",
    subtitle: "La correlación entre tus datos y la normalidad teórica",
    explanation: "Shapiro-Wilk responde una pregunta simple: ¿qué tan alineados están mis datos ordenados con los valores que esperaríamos si vinieran de una distribución normal? La respuesta es el estadístico W, un número entre 0 y 1."
  },
  {
    id: 1,
    title: "Paso 1: Ordenar los datos",
    subtitle: "Los datos se ordenan de menor a mayor",
    explanation: "El primer paso es ordenar la muestra. Esto nos permite emparejar cada valor observado con su cuantil teórico esperado bajo normalidad."
  },
  {
    id: 2,
    title: "Paso 2: Generar cuantiles teóricos",
    subtitle: "¿Qué esperaríamos si los datos fueran normales?",
    explanation: "Usamos la posición de cada dato ordenado para calcular su cuantil esperado en una distribución normal estándar. Estos son los valores que 'deberían' tener si fueran perfectamente normales."
  },
  {
    id: 3,
    title: "Paso 3: Emparejar (QQ-plot)",
    subtitle: "Observado vs. Esperado — la correlación",
    explanation: "Comparamos cada valor observado con su cuantil teórico. Si forman una línea recta, tus datos son normales. La correlación entre ambos conjuntos es el estadístico W."
  },
  {
    id: 4,
    title: "Paso 4: El estadístico W",
    subtitle: "Un número que lo resume todo",
    explanation: "W = correlación al cuadrado entre datos observados y cuantiles teóricos. Si W está cerca de 1, tus datos son normales. Si está lejos de 1, no lo son."
  }
];

function computeSW(sortedData: number[]) {
  const n = sortedData.length;
  const sum = sortedData.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  let ss = 0;
  for (let i = 0; i < n; i++) ss += (sortedData[i] - mean) ** 2;
  const m = new Float64Array(n);
  let sumM2 = 0;
  for (let i = 0; i < n; i++) {
    const p = (i + 1 - 0.375) / (n + 0.25);
    m[i] = inverseNormalCDF(p);
    sumM2 += m[i] * m[i];
  }
  const sqrtSumM2 = Math.sqrt(sumM2);
  let sumAX = 0;
  for (let i = 0; i < n; i++) {
    const a_i = m[i] / sqrtSumM2;
    sumAX += a_i * sortedData[i];
  }
  const w = Math.min(0.9999, Math.max(0.0001, (sumAX * sumAX) / ss));
  const lnN = Math.log(n);
  const mean_v = -1.2725 + 1.0521 * (lnN - Math.log(4));
  const sigma_v = Math.exp(1.5677 - 0.4826 * lnN);
  const v = Math.log(1.0 - w);
  const z = (v - mean_v) / sigma_v;
  const pVal = stdNormalCDF(-z);
  return { w, pValue: pVal, n, mean, theoreticalQuantiles: Array.from(m) };
}

function correlation(x: number[], y: number[]): number {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  return num / Math.sqrt(dx2 * dy2);
}

const ANIMATION_DURATION = 0.6;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const ShapiroWilkTutorial: React.FC = () => {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoTimer, setAutoTimer] = useState<number | null>(null);
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
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
        const n = shuffled.length;
        const mixed = shuffled.map((v, i) => {
          const t = sortProgress;
          return v + (sorted[i] - v) * t;
        });
        return mixed;
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

  const swResult = useMemo(() => computeSW(sortedData), [sortedData]);
  const currentForStep = useMemo(() => {
    if (!interactiveMode) {
      if (step === 0) return shuffleArray(DEMO_DATA);
      return sortedData;
    }
    return sortedData;
  }, [step, sortedData, interactiveMode]);

  const quantiles = useMemo(() => {
    const n = currentForStep.length;
    return currentForStep.map((_, i) => {
      const p = (i + 1 - 0.375) / (n + 0.25);
      return inverseNormalCDF(p);
    });
  }, [currentForStep]);

  const lineOfBestFit = useMemo(() => {
    if (step < 3) return null;
    const sx = quantiles.reduce((a, b) => a + b, 0) / quantiles.length;
    const sy = currentForStep.reduce((a, b) => a + b, 0) / currentForStep.length;
    let num = 0, den = 0;
    for (let i = 0; i < quantiles.length; i++) {
      num += (quantiles[i] - sx) * (currentForStep[i] - sy);
      den += (quantiles[i] - sx) ** 2;
    }
    const slope = den !== 0 ? num / den : 0;
    const intercept = sy - slope * sx;
    const minQ = Math.min(...quantiles);
    const maxQ = Math.max(...quantiles);
    return { slope, intercept, x1: minQ, y1: slope * minQ + intercept, x2: maxQ, y2: slope * maxQ + intercept };
  }, [step, quantiles, currentForStep]);

  const r = useMemo(() => {
    if (step < 3) return 0;
    return correlation(quantiles, currentForStep);
  }, [step, quantiles, currentForStep]);

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

  const handleDragStart = useCallback((e: React.PointerEvent, idx: number) => {
    if (!interactiveMode || step < 3) return;
    setDraggedIdx(idx);
    const el = e.currentTarget as SVGElement;
    el.setPointerCapture(e.pointerId);
  }, [interactiveMode, step]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (draggedIdx === null || !svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const paddingLeft = 70;
    const paddingRight = 50;
    const chartWidth = svg.clientWidth - paddingLeft - paddingRight;
    const minVal = Math.min(...sortedData);
    const maxVal = Math.max(...sortedData);
    const range = maxVal - minVal || 1;
    const xSvg = e.clientX - rect.left;
    const dataVal = minVal + ((xSvg - paddingLeft) / chartWidth) * range;
    const clamped = Math.max(minVal, Math.min(maxVal, dataVal));
    const newData = [...userShuffledData];
    const actualIdx = newData.indexOf(sortedData[draggedIdx]);
    if (actualIdx !== -1) {
      newData[actualIdx] = clamped;
      setUserShuffledData(newData);
    }
  }, [draggedIdx, sortedData, userShuffledData]);

  const handleDragEnd = useCallback(() => {
    setDraggedIdx(null);
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

  const minVal = Math.min(...currentData);
  const maxVal = Math.max(...currentData);
  const dataRange = maxVal - minVal || 1;

  const minQ = Math.min(...quantiles);
  const maxQ = Math.max(...quantiles);
  const qRange = maxQ - minQ || 1;

  const toSvgX = (v: number) => padLeft + ((v - minVal) / dataRange) * chartW;
  const toSvgY = (i: number) => padTop + chartH - ((i + 0.5) / currentData.length) * chartH;
  const toSvgQ = (q: number) => padLeft + 20 + ((q - minQ) / qRange) * (chartW - 40);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              Tutorial Interactivo: Shapiro-Wilk
            </h2>
            <p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">
              Aprende visualmente cómo funciona la prueba de normalidad más utilizada en estadística
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
            {step >= 2 && (
              <>
                <text x={padLeft + chartW / 2} y={svgHeight - 8} textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[10px] font-medium">
                  Cuantiles Teóricos Normales (z)
                </text>
                <text transform={`translate(14, ${padTop + chartH / 2}) rotate(-90)`} textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[10px] font-medium">
                  Datos Observados
                </text>
              </>
            )}

            {step >= 2 && (
              <>
                <line x1={padLeft} y1={padTop + chartH} x2={padLeft + chartW} y2={padTop + chartH} className="stroke-zinc-300 dark:stroke-[#30363D]" strokeWidth="1" />
                <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} className="stroke-zinc-300 dark:stroke-[#30363D]" strokeWidth="1" />
              </>
            )}

            {lineOfBestFit && step >= 3 && (
              <line
                x1={toSvgQ(lineOfBestFit.x1)}
                y1={toSvgY(0) - (lineOfBestFit.y1 - currentForStep[0]) / dataRange * chartH * 0.3}
                x2={toSvgQ(lineOfBestFit.x2)}
                y2={toSvgY(currentForStep.length - 1) - (lineOfBestFit.y2 - currentForStep[currentForStep.length - 1]) / dataRange * chartH * 0.3}
                className="stroke-blue-400 dark:stroke-blue-500"
                strokeWidth="2"
                strokeDasharray="6,3"
                opacity={0.7}
              />
            )}

            {currentData.map((val, i) => {
              const x = toSvgX(val);
              const y = toSvgY(i);
              const q = quantiles[i];
              const qx = toSvgQ(q);

              return (
                <g key={`point-${i}`}>
                  {step >= 2 && (
                    <line
                      x1={x}
                      y1={y}
                      x2={qx}
                      y2={y}
                      className="stroke-zinc-300 dark:stroke-zinc-600"
                      strokeWidth="0.5"
                      strokeDasharray="3,2"
                      opacity={0.4}
                    />
                  )}

                  <motion.circle
                    initial={step <= 1 ? { opacity: 0, r: 0 } : { opacity: 1, r: 5 }}
                    animate={{
                      cx: step >= 2 ? qx : x,
                      cy: y,
                      opacity: 1,
                      r: step >= 2 ? 5 : 6
                    }}
                    transition={{ duration: ANIMATION_DURATION, delay: i * 0.03 }}
                    className={`cursor-${interactiveMode && step >= 3 ? "grab" : "default"} ${
                      draggedIdx === i
                        ? "fill-blue-500 stroke-blue-300"
                        : "fill-blue-400/80 dark:fill-blue-500/80 stroke-blue-600 dark:stroke-blue-400"
                    }`}
                    strokeWidth="1.5"
                    onPointerDown={(e) => handleDragStart(e, i)}
                    onPointerMove={handleDragMove}
                    onPointerUp={handleDragEnd}
                    onPointerCancel={handleDragEnd}
                  />

                  {step >= 3 && (
                    <motion.line
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.02 }}
                      x1={Math.min(x, qx)}
                      y1={y}
                      x2={Math.max(x, qx)}
                      y2={y}
                      className="stroke-zinc-400 dark:stroke-zinc-500"
                      strokeWidth="1"
                      strokeDasharray="2,3"
                      opacity={0.5}
                    />
                  )}

                  {(step === 0 || step === 1) && (
                    <motion.circle
                      initial={{ opacity: 0, r: 0 }}
                      animate={{ cx: x, cy: y, opacity: 1, r: 5 }}
                      transition={{ duration: 0.4, delay: i * 0.02 }}
                      className="fill-blue-500/70 dark:fill-blue-400/70 stroke-blue-700 dark:stroke-blue-500"
                      strokeWidth="1"
                    />
                  )}
                </g>
              );
            })}

            {(step === 3 || step === 4) && (
              <g transform={`translate(${padLeft + 10}, ${padTop + 10})`}>
                <rect width="160" height="80" rx="8" className="fill-white/90 dark:fill-[#161B22]/90 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                <text x="12" y="22" className="fill-zinc-700 dark:fill-zinc-300 text-[11px] font-bold">
                  Correlación (r)
                </text>
                <text x="12" y="42" className={`text-[18px] font-black font-mono ${Math.abs(r) > 0.9 ? "fill-emerald-500" : "fill-amber-500"}`}>
                  {r.toFixed(4)}
                </text>
                <text x="12" y="62" className="fill-zinc-500 dark:fill-zinc-400 text-[10px] font-mono">
                  W = r² = {(r * r).toFixed(4)}
                </text>
              </g>
            )}

            {(step === 3 || step === 4) && (
              <g transform={`translate(${padLeft + chartW - 170}, ${padTop + 10})`}>
                <rect width="155" height="80" rx="8" className="fill-white/90 dark:fill-[#161B22]/90 stroke-zinc-200 dark:border-[#30363D]" strokeWidth="1" />
                <text x="12" y="22" className="fill-zinc-700 dark:fill-zinc-300 text-[11px] font-bold">
                  Diagnóstico
                </text>
                <text x="12" y="44" className={`text-[13px] font-bold ${swResult.pValue > 0.05 ? "fill-emerald-500" : "fill-amber-500"}`}>
                  {swResult.pValue > 0.05 ? "✓ Normal" : "✗ No Normal"}
                </text>
                <text x="12" y="64" className="fill-zinc-500 dark:fill-zinc-400 text-[10px] font-mono">
                  p = {swResult.pValue < 0.001 ? "< 0.001" : swResult.pValue.toFixed(4)}
                </text>
              </g>
            )}

            {step === 2 && (
              <g transform={`translate(${padLeft + chartW / 2 - 80}, ${padTop + 10})`}>
                <rect width="160" height="28" rx="6" className="fill-blue-50/90 dark:fill-blue-950/40 stroke-blue-200 dark:stroke-blue-900" strokeWidth="1" />
                <text x="80" y="19" textAnchor="middle" className="fill-blue-700 dark:fill-blue-300 text-[10px] font-bold">
                  ← Distancia = desviación de la normal
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
                <span>Mezclar datos y observar cómo cambia W</span>
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
            <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{swResult.n}</span>
          </div>
          <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
            <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">Estadístico W</span>
            <span className={`block text-sm font-black font-mono mt-1 ${swResult.w > 0.9 ? "text-emerald-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {swResult.w.toFixed(4)}
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
            <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">p-valor</span>
            <span className={`block text-sm font-black font-mono mt-1 ${swResult.pValue > 0.05 ? "text-emerald-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {swResult.pValue < 0.001 ? "< 0.001" : swResult.pValue.toFixed(4)}
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
            <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">Interpretación</span>
            <span className="block text-sm font-black mt-1">
              <span className={swResult.pValue > 0.05 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                {swResult.pValue > 0.05 ? "Distribución Normal" : "No Normal"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
