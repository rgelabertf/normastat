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
import { runJarqueBera, getSummaryStatistics } from "../utils/stats";

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
    title: "¿Qué mide Jarque-Bera?",
    subtitle: "La forma de tu distribución: asimetría y curtosis",
    explanation: "Jarque-Bera responde: ¿tu campana tiene la simetría y el pico correctos? Una distribución normal es perfectamente simétrica (asimetría = 0) y tiene un pico ni muy alto ni muy bajo (curtosis = 3). JB combina estas dos medidas en un solo estadístico."
  },
  {
    id: 1,
    title: "Paso 1: Asimetría (S)",
    subtitle: "¿Están los datos equilibrados alrededor de la media?",
    explanation: "La asimetría mide si los datos se extienden más hacia un lado. S = 0 indica simetría perfecta. S > 0 significa cola larga a la derecha (sesgo positivo). S < 0 significa cola larga a la izquierda (sesgo negativo)."
  },
  {
    id: 2,
    title: "Paso 2: Curtosis (K)",
    subtitle: "¿El pico de tu distribución es normal?",
    explanation: "La curtosis mide el 'pico' y las 'colas' de la distribución. K = 3 es normal (mesocúrtica). K > 3 indica un pico más alto y colas más gruesas (leptocúrtica). K < 3 indica un pico más plano y colas más delgadas (platicúrtica)."
  },
  {
    id: 3,
    title: "Paso 3: El estadístico JB",
    subtitle: "Combinando S y K en un solo número",
    explanation: "JB = (n/6) × [S² + (K-3)² / 4]. Si S ≈ 0 y K ≈ 3, entonces JB ≈ 0 y los datos son normales. Valores grandes de JB indican desviación de la normalidad. Cada término (S² y (K-3)²/4) contribuye al estadístico."
  },
  {
    id: 4,
    title: "Paso 4: Interpretar JB",
    subtitle: "¿Es JB lo suficientemente pequeño?",
    explanation: "El estadístico JB sigue una distribución Chi-cuadrado con 2 grados de libertad. Si el p-valor > 0.05, no rechazamos la hipótesis de normalidad. JB es especialmente potente para muestras grandes (n > 100)."
  }
];

function computeJB(sortedData: number[]) {
  const result = runJarqueBera(sortedData);
  const stats = getSummaryStatistics(sortedData);
  return { ...result, n: sortedData.length, skewness: stats.skewness, kurtosis: stats.kurtosis + 3 };
}

const ANIMATION_DURATION = 0.6;

export const JarqueBeraTutorial: React.FC = () => {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoTimer, setAutoTimer] = useState<number | null>(null);
  const [interactiveMode] = useState(false);
  const [playSortAnim, setPlaySortAnim] = useState(false);
  const [sortProgress, setSortProgress] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const [showSkewHelp, setShowSkewHelp] = useState(false);
  const [showKurtHelp, setShowKurtHelp] = useState(false);
  const [hoveredCurve, setHoveredCurve] = useState<number | null>(null);

  const sortedData = useMemo(() => {
    return [...DEMO_DATA].sort((a, b) => a - b);
  }, []);

  const jbResult = useMemo(() => computeJB(sortedData), [sortedData]);

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
  const padBottom = 40;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const minVal = Math.min(...sortedData);
  const maxVal = Math.max(...sortedData);
  const dataRange = maxVal - minVal || 1;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4">
      <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              Tutorial Interactivo: Jarque-Bera
            </h2>
            <p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">
              Aprende cómo la asimetría y curtosis determinan la normalidad de tus datos
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
            {/* Step 0: Three bell curves showing different skewness/kurtosis */}
            {step === 0 && (
              <g>
                {/* Normal curve (center) */}
                <g transform="translate(130, 60)">
                  <text x="110" y="-5" textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[9px] font-medium">Simétrica (Normal)</text>
                  <ellipse cx="110" cy="130" rx="70" ry="2" className="fill-green-500/60" />
                  <line x1="110" y1="0" x2="110" y2="130" className="stroke-green-500" strokeWidth="1.5" strokeDasharray="4,2" />
                  <ellipse cx="110" cy="50" rx="45" ry="80" className="fill-green-500/15 stroke-green-500" strokeWidth="1.5" />
                  <text x="110" y="155" textAnchor="middle" className="fill-green-500 text-[10px] font-bold">S ≈ 0 | K ≈ 3</text>
                </g>

                {/* Left-skewed curve */}
                <g transform="translate(370, 60)">
                  <text x="110" y="-5" textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[9px] font-medium">Sesgo Negativo (S &lt; 0)</text>
                  <ellipse cx="110" cy="130" rx="70" ry="2" className="fill-amber-500/60" />
                  <line x1="75" y1="0" x2="75" y2="130" className="stroke-amber-500" strokeWidth="1.5" strokeDasharray="4,2" />
                  <ellipse cx="90" cy="50" rx="55" ry="80" className="fill-amber-500/15 stroke-amber-500" strokeWidth="1.5" />
                  <text x="110" y="155" textAnchor="middle" className="fill-amber-500 text-[10px] font-bold">Cola a la izquierda</text>
                </g>

                {/* Right-skewed curve */}
                <g transform="translate(570, 60)">
                  <text x="60" y="-5" textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[9px] font-medium">Sesgo Positivo (S &gt; 0)</text>
                  <ellipse cx="60" cy="130" rx="60" ry="2" className="fill-amber-500/60" />
                  <line x1="95" y1="0" x2="95" y2="130" className="stroke-amber-500" strokeWidth="1.5" strokeDasharray="4,2" />
                  <ellipse cx="75" cy="50" rx="40" ry="80" className="fill-amber-500/15 stroke-amber-500" strokeWidth="1.5" />
                  <text x="75" y="155" textAnchor="middle" className="fill-amber-500 text-[10px] font-bold">Cola a la derecha</text>
                </g>

                {/* Vertical labels */}
                <text x="30" y="90" textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[9px] font-medium" transform="rotate(-90, 30, 90)">
                  ¿Cómo se ve?
                </text>
              </g>
            )}

            {/* Step 1: Skewness visualization */}
            {step === 1 && (
              <g>
                <rect x={padLeft} y={padTop} width={chartW} height={chartH} rx="8" className="fill-zinc-900/5 dark:fill-white/5 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />

                {/* Histogram bars showing positive skew */}
                {[
                  { x: 80, h: 20 }, { x: 110, h: 30 }, { x: 140, h: 45 }, { x: 170, h: 60 },
                  { x: 200, h: 75 }, { x: 230, h: 85 }, { x: 260, h: 90 }, { x: 290, h: 88 },
                  { x: 320, h: 80 }, { x: 350, h: 65 }, { x: 380, h: 48 }, { x: 410, h: 32 },
                  { x: 440, h: 20 }, { x: 470, h: 12 }, { x: 500, h: 7 }, { x: 530, h: 4 },
                  { x: 560, h: 2 },
                ].map((b, i) => (
                  <g key={`hist-${i}`}>
                    <rect x={b.x} y={padTop + chartH - b.h} width="25" height={b.h} rx="3" className="fill-blue-500/40 stroke-blue-500/60" strokeWidth="0.5" />
                    {/* Contribution highlight */}
                    {i > 9 && (
                      <text x={b.x + 12} y={padTop + chartH - b.h - 5} textAnchor="middle" className="fill-amber-500 text-[8px] font-bold">
                        ↑ sesgo
                      </text>
                    )}
                  </g>
                ))}

                {/* Mean and median indicators */}
                <line x1="290" y1={padTop} x2="290" y2={padTop + chartH} className="stroke-green-500" strokeWidth="2" strokeDasharray="4,2" />
                <text x="290" y={padTop - 5} textAnchor="middle" className="fill-green-500 text-[10px] font-bold">Media</text>
                <line x1="250" y1={padTop} x2="250" y2={padTop + chartH} className="stroke-blue-400" strokeWidth="2" strokeDasharray="4,2" />
                <text x="250" y={padTop - 5} textAnchor="middle" className="fill-blue-400 text-[10px] font-bold">Mediana</text>

                <text x={padLeft + chartW / 2} y={svgHeight - 8} textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[9px] font-medium">
                  Cuando la media y la mediana no coinciden, hay asimetría (S)
                </text>

                {/* Formula box */}
                <g transform={`translate(${padLeft + 10}, ${padTop + chartH - 55})`}>
                  <rect width="160" height="48" rx="6" className="fill-white/90 dark:fill-[#161B22]/90 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                  <text x="12" y="18" className="fill-zinc-700 dark:fill-zinc-300 text-[10px] font-bold">Fórmula de asimetría:</text>
                  <text x="12" y="38" className="fill-blue-600 dark:fill-blue-400 text-[11px] font-mono font-bold">S = m₃ / (m₂)^(3/2)</text>
                </g>
              </g>
            )}

            {/* Step 2: Kurtosis visualization */}
            {step === 2 && (
              <g>
                <rect x={padLeft} y={padTop} width={chartW} height={chartH} rx="8" className="fill-zinc-900/5 dark:fill-white/5 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />

                {/* Three curves showing different kurtosis */}
                {[
                  { cx: 150, label: "Leptocúrtica (K > 3)", color: "stroke-amber-500 fill-amber-500/10", textColor: "fill-amber-500", rx: 35, ry: 95 },
                  { cx: 350, label: "Mesocúrtica (K = 3)  ✓", color: "stroke-green-500 fill-green-500/10", textColor: "fill-green-500", rx: 50, ry: 80 },
                  { cx: 550, label: "Platicúrtica (K < 3)", color: "stroke-amber-500 fill-amber-500/10", textColor: "fill-amber-500", rx: 65, ry: 65 },
                ].map((c, i) => (
                  <g key={`kurt-${i}`}
                    onMouseEnter={() => setHoveredCurve(i)}
                    onMouseLeave={() => setHoveredCurve(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <ellipse cx={c.cx} cy={padTop + chartH / 2 + 10} rx={c.rx} ry={c.ry} className={c.color} strokeWidth="2" />
                    <text x={c.cx} y={padTop + chartH - 5} textAnchor="middle" className={`${c.textColor} text-[9px] font-bold`}>
                      {c.label}
                    </text>
                    {/* Peak indicator */}
                    {hoveredCurve === i && (
                      <line x1={c.cx} y1={padTop + chartH / 2 + 10 - c.ry} x2={c.cx} y2={padTop + chartH / 2 + 10 + c.ry} className="stroke-white/50" strokeWidth="1" strokeDasharray="3,2" />
                    )}
                  </g>
                ))}

                <text x={padLeft + chartW / 2} y={padTop + 18} textAnchor="middle" className="fill-zinc-400 dark:fill-gray-500 text-[9px] font-medium">
                  Pasa el cursor sobre cada curva para ver el pico
                </text>
              </g>
            )}

            {/* Step 3: JB formula visualization */}
            {step === 3 && (
              <g>
                <rect x={padLeft} y={padTop} width={chartW} height={chartH} rx="8" className="fill-zinc-900/5 dark:fill-white/5 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />

                {/* Formula breakdown */}
                <g transform={`translate(${padLeft + 20}, ${padTop + 30})`}>
                  <text x="0" y="0" className="fill-zinc-700 dark:fill-zinc-300 text-[11px] font-bold">La fórmula de Jarque-Bera:</text>
                  <text x="0" y="30" className="fill-blue-600 dark:fill-blue-400 text-[16px] font-mono font-black">JB = (n / 6) × [ S² + (K - 3)² / 4 ]</text>

                  {/* Term 1: S² */}
                  <g transform="translate(30, 55)">
                    <rect x="0" y="0" width="100" height="40" rx="6" className="fill-blue-500/15 stroke-blue-500" strokeWidth="1" />
                    <text x="50" y="17" textAnchor="middle" className="fill-blue-600 dark:fill-blue-400 text-[11px] font-bold">S²</text>
                    <text x="50" y="32" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[8px]">Asimetría al cuadrado</text>
                  </g>

                  <text x="140" y="80" className="fill-zinc-400 text-[16px] font-bold">+</text>

                  {/* Term 2: (K-3)²/4 */}
                  <g transform="translate(160, 55)">
                    <rect x="0" y="0" width="120" height="40" rx="6" className="fill-amber-500/15 stroke-amber-500" strokeWidth="1" />
                    <text x="60" y="17" textAnchor="middle" className="fill-amber-600 dark:fill-amber-400 text-[11px] font-bold">(K-3)² / 4</text>
                    <text x="60" y="32" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[8px]">Exceso de curtosis</text>
                  </g>

                  <text x="295" y="80" className="fill-zinc-400 text-[16px] font-bold">= JB</text>

                  {/* Weight multiplier */}
                  <g transform="translate(10, 110)">
                    <rect x="0" y="0" width="580" height="35" rx="6" className="fill-zinc-900/5 dark:fill-white/5 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                    <text x="290" y="14" textAnchor="middle" className="fill-zinc-600 dark:fill-zinc-400 text-[10px]">
                      El factor n/6 amplifica la contribución con muestras grandes
                    </text>
                    <text x="290" y="28" textAnchor="middle" className="fill-zinc-600 dark:fill-zinc-400 text-[10px]">
                      n = {jbResult.n} → n/6 = {(jbResult.n / 6).toFixed(1)}
                    </text>
                  </g>
                </g>

                {/* Current values box */}
                <g transform={`translate(${padLeft + chartW - 185}, ${padTop + 15})`}>
                  <rect width="170" height="75" rx="6" className="fill-white/90 dark:fill-[#161B22]/90 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                  <text x="10" y="18" className="fill-zinc-700 dark:fill-zinc-300 text-[10px] font-bold">Tus datos:</text>
                  <text x="10" y="36" className="fill-blue-600 dark:fill-blue-400 text-[10px] font-mono">S = {jbResult.skewness.toFixed(4)}</text>
                  <text x="10" y="52" className="fill-amber-600 dark:fill-amber-400 text-[10px] font-mono">K = {jbResult.kurtosis.toFixed(4)}</text>
                  <text x="10" y="68" className="fill-zinc-500 dark:fill-zinc-400 text-[9px]">S² + (K-3)²/4 = {((jbResult.skewness ** 2) + ((jbResult.kurtosis - 3) ** 2) / 4).toFixed(4)}</text>
                </g>
              </g>
            )}

            {/* Step 4: Result interpretation */}
            {step === 4 && (
              <g>
                <rect x={padLeft} y={padTop} width={chartW} height={chartH} rx="8" className="fill-zinc-900/5 dark:fill-white/5 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />

                {/* Result cards */}
                <g transform={`translate(${padLeft + chartW / 2 - 200}, ${padTop + 30})`}>
                  {/* JB value */}
                  <rect x="0" y="0" width="180" height="90" rx="8" className="fill-white/90 dark:fill-[#161B22]/90 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                  <text x="90" y="22" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[9px] font-bold uppercase tracking-wider">Estadístico JB</text>
                  <text x="90" y="55" textAnchor="middle" className={`text-[22px] font-black font-mono ${
                    jbResult.pValue > 0.05 ? "fill-emerald-500" : "fill-amber-500"
                  }`}>
                    {jbResult.statisticValue.toFixed(4)}
                  </text>
                  <text x="90" y="78" textAnchor="middle" className="fill-zinc-400 text-[9px]">
                    n = {jbResult.n}
                  </text>

                  {/* p-value */}
                  <rect x="200" y="0" width="180" height="90" rx="8" className="fill-white/90 dark:fill-[#161B22]/90 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                  <text x="290" y="22" textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400 text-[9px] font-bold uppercase tracking-wider">p-valor</text>
                  <text x="290" y="55" textAnchor="middle" className={`text-[22px] font-black font-mono ${
                    jbResult.pValue > 0.05 ? "fill-emerald-500" : "fill-amber-500"
                  }`}>
                    {jbResult.pValue < 0.001 ? "< 0.001" : jbResult.pValue.toFixed(4)}
                  </text>
                  <text x="290" y="78" textAnchor="middle" className={`text-[11px] font-bold ${
                    jbResult.pValue > 0.05 ? "fill-emerald-500" : "fill-amber-500"
                  }`}>
                    {jbResult.pValue > 0.05 ? "✓ Distribución Normal" : "✗ No Normal"}
                  </text>
                </g>

                {/* Chi-square distribution hint */}
                <g transform={`translate(${padLeft + 20}, ${padTop + chartH - 35})`}>
                  <rect width="240" height="28" rx="6" className="fill-zinc-900/10 dark:fill-white/5 stroke-zinc-200 dark:stroke-[#30363D]" strokeWidth="1" />
                  <text x="120" y="19" textAnchor="middle" className="fill-zinc-600 dark:fill-zinc-400 text-[9px]">
                    JB sigue una χ² con 2 grados de libertad
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
            <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{jbResult.n}</span>
          </div>
          <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
            <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">Estadístico JB</span>
            <span className={`block text-sm font-black font-mono mt-1 ${jbResult.pValue > 0.05 ? "text-emerald-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {jbResult.statisticValue.toFixed(4)}
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
            <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">p-valor</span>
            <span className={`block text-sm font-black font-mono mt-1 ${jbResult.pValue > 0.05 ? "text-emerald-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
              {jbResult.pValue < 0.001 ? "< 0.001" : jbResult.pValue.toFixed(4)}
            </span>
          </div>
          <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
            <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-500">Interpretación</span>
            <span className="block text-sm font-black mt-1">
              <span className={jbResult.pValue > 0.05 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                {jbResult.pValue > 0.05 ? "Distribución Normal" : "No Normal"}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
