import React, { useState, useMemo, useEffect } from "react";
import { 
  getSummaryStatistics, 
  runShapiroFrancia, 
  runKolmogorovSmirnov, 
  runJarqueBera, 
  sampleDatasets 
} from "./utils/stats";
import { Chart } from "./components/Chart";
import { Tooltip } from "./components/Tooltip";
import { Manual } from "./components/Manual";
import { AiChat } from "./components/AiChat";
import { downloadStandaloneHTML } from "./components/ExportHTML";
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Clipboard, 
  Database, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  Sigma,
  BookOpen,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  ChevronRight
} from "lucide-react";

export default function App() {
  const [level, setLevel] = useState<"pri" | "pro">("pro");
  const [activeTab, setActiveTab] = useState<"analisis" | "manual">("analisis");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [rawData, setRawData] = useState<number[]>(sampleDatasets[0].data);
  const [binsCount, setBinsCount] = useState<number>(15);
  const [pasteText, setPasteText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // CSV parsed column state
  const [csvColumns, setCsvColumns] = useState<{ [key: string]: number[] } | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  // Sync theme with document class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const sortedData = useMemo(() => {
    return [...rawData].sort((a, b) => a - b);
  }, [rawData]);

  const stats = useMemo(() => {
    return getSummaryStatistics(rawData);
  }, [rawData]);

  // Compute three tests
  const swResult = useMemo(() => {
    return runShapiroFrancia(sortedData);
  }, [sortedData]);

  const ksResult = useMemo(() => {
    return runKolmogorovSmirnov(sortedData, stats.mean, stats.sd);
  }, [sortedData, stats.mean, stats.sd]);

  const jbResult = useMemo(() => {
    return runJarqueBera(sortedData);
  }, [sortedData]);

  // Handle Loading sample dataset
  const handleLoadSample = (index: number) => {
    setRawData(sampleDatasets[index].data);
    setCsvColumns(null);
    setSelectedColumn(null);
    setErrorMsg(null);
    setPasteText("");
  };

  // Helper to parse comma, semicolon, tab or newline separated text
  const parseNumbersFromString = (text: string): number[] => {
    const parts = text.split(/[\r\n,;\t\s]+/);
    const parsed: number[] = [];
    parts.forEach((p) => {
      const clean = p.trim().replace(",", ".");
      if (clean) {
        const num = parseFloat(clean);
        if (!isNaN(num)) {
          parsed.push(num);
        }
      }
    });
    return parsed;
  };

  // Handle copy paste submission
  const handleProcessPasted = () => {
    setErrorMsg(null);
    if (!pasteText.trim()) {
      setErrorMsg("La casilla de texto está vacía. Por favor pega tus datos primero.");
      return;
    }
    const numbers = parseNumbersFromString(pasteText);
    if (numbers.length < 5) {
      setErrorMsg("Se requieren al menos 5 datos numéricos válidos para procesar las pruebas estadísticas.");
      return;
    }
    setRawData(numbers);
    setCsvColumns(null);
    setSelectedColumn(null);
  };

  // Helper to export results and descriptive statistics as CSV
  const exportResultsToCSV = () => {
    const csvRows: string[][] = [];

    // Title and Metadata
    csvRows.push(["NormaStat - Reporte Estadistico Completo"]);
    csvRows.push([`Fecha de Generacion: ${new Date().toLocaleString()}`]);
    csvRows.push([`Variable de Analisis: ${selectedColumn || "Muestra Manual"}`]);
    csvRows.push([]);

    // Section 1: Descriptive Statistics
    csvRows.push(["ESTADISTICOS DESCRIPTIVOS", "VALOR", "SIMBOLO / DESCRIPCION"]);
    csvRows.push(["Tamaño de Muestra", stats.n.toString(), "N (Total de observaciones validas)"]);
    csvRows.push(["Media", stats.mean.toString(), "mu (Promedio aritmetico)"]);
    csvRows.push(["Desviacion Estandar", stats.sd.toString(), "sigma (Medida de dispersion respecto a la media)"]);
    csvRows.push(["Varianza", stats.variance.toString(), "sigma^2 (Dispersion cuadratica)"]);
    csvRows.push(["Mediana", stats.median.toString(), "Percentil 50 (Centro de los datos)"]);
    csvRows.push(["Minimo", stats.min.toString(), "Valor minimo observado"]);
    csvRows.push(["Maximo", stats.max.toString(), "Valor maximo observado"]);
    csvRows.push(["Asimetria", stats.skewness.toString(), "Sesgo de la distribucion (0 = perfecta simetria)"]);
    csvRows.push(["Curtosis", stats.kurtosis.toString(), "Curtosis de momentos estandarizados"]);
    csvRows.push(["Exceso de Curtosis", stats.excessKurtosis.toString(), "Curtosis relativa a la normal (0 = mesocurtica)"]);
    csvRows.push([]);

    // Section 2: Normality Tests Results
    csvRows.push(["PRUEBAS DE NORMALIDAD", "ESTADISTICO", "P-VALOR", "CUMPLE NORMALIDAD (p > 0.05)", "INTERPRETACION"]);
    csvRows.push([
      "Shapiro-Francia",
      swResult.statisticValue.toString(),
      swResult.pValue.toString(),
      swResult.isNormal ? "Si" : "No",
      swResult.interpretation
    ]);
    csvRows.push([
      "Kolmogorov-Smirnov",
      ksResult.statisticValue.toString(),
      ksResult.pValue.toString(),
      ksResult.isNormal ? "Si" : "No",
      ksResult.interpretation
    ]);
    csvRows.push([
      "Jarque-Bera",
      jbResult.statisticValue.toString(),
      jbResult.pValue.toString(),
      jbResult.isNormal ? "Si" : "No",
      jbResult.interpretation
    ]);
    csvRows.push([]);

    // Section 3: Recommendation / Conclusion
    const normalCount = [swResult.isNormal, ksResult.isNormal, jbResult.isNormal].filter(Boolean).length;
    const finalVeredict = normalCount >= 2 ? "SUPUESTO CUMPLIDO (Se acepta hipotesis de normalidad)" : "DESVIACION DETECTADA (Se rechaza hipotesis de normalidad)";
    const finalRec = normalCount >= 2 
      ? "Se recomienda el uso de pruebas parametricas (e.g., T de Student, ANOVA de un factor, correlacion de Pearson)."
      : "Se recomienda el uso de pruebas no parametricas (e.g., U de Mann-Whitney, Wilcoxon, Kruskal-Wallis, Spearman) o transformar los datos.";
    
    csvRows.push(["CONCLUSION GENERAL", finalVeredict]);
    csvRows.push(["RECOMENDACION METODOLOGICA", finalRec]);
    csvRows.push([]);

    // Section 4: Raw Data points ordered
    csvRows.push(["DATOS ORDENADOS (N = " + stats.n + ")"]);
    sortedData.forEach((val, i) => {
      csvRows.push([`Observacion ${i + 1}`, val.toString()]);
    });

    // Generate CSV and trigger download using Blob
    const csvString = csvRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `normastat_reporte_${(selectedColumn || "datos").toLowerCase().replace(/[^a-z0-9]+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Drag & Drop and manual file uploading
  const handleFileParse = (text: string, fileName: string) => {
    setErrorMsg(null);
    const rows = text.split(/\r?\n/);
    if (rows.length < 2) {
      setErrorMsg("El archivo no contiene suficientes filas de datos.");
      return;
    }

    // Detect column separator
    let separator = ",";
    const headerRow = rows[0];
    if (headerRow.includes(";")) separator = ";";
    else if (headerRow.includes("\t")) separator = "\t";

    // Split headers and trim
    const headers = headerRow.split(separator).map(h => h.trim().replace(/^["']|["']$/g, ""));
    const parsedCols: { [key: string]: number[] } = {};
    headers.forEach(h => { parsedCols[h] = []; });

    for (let i = 1; i < rows.length; i++) {
      if (!rows[i].trim()) continue;
      const cells = rows[i].split(separator);
      for (let j = 0; j < headers.length; j++) {
        if (cells[j] !== undefined) {
          const val = parseFloat(cells[j].trim().replace(",", "."));
          if (!isNaN(val)) {
            parsedCols[headers[j]].push(val);
          }
        }
      }
    }

    // Filter out empty columns or those with too few numbers
    const validCols: { [key: string]: number[] } = {};
    Object.keys(parsedCols).forEach(k => {
      if (parsedCols[k].length >= 5) {
        validCols[k] = parsedCols[k];
      }
    });

    const validKeys = Object.keys(validCols);
    if (validKeys.length === 0) {
      setErrorMsg("No se encontraron columnas válidas con al menos 5 datos numéricos en el archivo CSV.");
      return;
    }

    setCsvColumns(validCols);
    const firstCol = validKeys[0];
    setSelectedColumn(firstCol);
    setRawData(validCols[firstCol]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      handleFileParse(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      handleFileParse(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleColumnSelect = (colName: string) => {
    if (csvColumns && csvColumns[colName]) {
      setSelectedColumn(colName);
      setRawData(csvColumns[colName]);
    }
  };

  return (
    <div className="bg-zinc-50 text-zinc-900 dark:bg-[#0F1115] dark:text-[#E2E8F0] min-h-screen flex flex-col transition-colors duration-200">
      
      {/* Header Panel */}
      <header id="app-header" className="border-b border-zinc-200 dark:border-[#2D333D] bg-white/80 dark:bg-[#161B22]/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-600/20">
              <Sigma className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">NormaStat</h1>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Evaluador Avanzado de Normalidad</p>
            </div>
          </div>

          {/* Nav & Exporter & Theme */}
          <div className="flex items-center gap-3">
            
            {/* Tabs switcher */}
            {level === "pro" && (
              <>
                <div className="bg-zinc-100 dark:bg-[#0D1117] p-1 rounded-lg flex items-center text-xs font-semibold border dark:border-[#2D333D]">
                  <button
                    id="btn-nav-analisis"
                    onClick={() => setActiveTab("analisis")}
                    className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                      activeTab === "analisis"
                        ? "bg-white dark:bg-blue-600 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Análisis</span>
                  </button>
                  
                  <button
                    id="btn-nav-manual"
                    onClick={() => setActiveTab("manual")}
                    className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                      activeTab === "manual"
                        ? "bg-white dark:bg-blue-600 text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Manual</span>
                  </button>
                </div>
                <div className="h-5 w-px bg-zinc-200 dark:bg-[#2D333D]"></div>
              </>
            )}

            {/* Standalone Export Button */}
            <button
              id="btn-export-html"
              onClick={downloadStandaloneHTML}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-[#21262D] hover:bg-zinc-850 dark:hover:bg-[#30363D] text-white rounded-lg text-xs font-semibold border dark:border-[#30363D] transition-colors shadow-sm"
              title="Descargar esta herramienta como un archivo HTML único que funciona completamente offline"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar HTML</span>
            </button>

            {/* Dark Mode toggler */}
            <button
              id="btn-theme-toggle"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-[#161B22] text-zinc-500 dark:text-zinc-400 rounded-lg transition"
              title="Cambiar tema visual"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === "analisis" ? (
          <div className="space-y-8 animate-fade-in">
            
            {/* Level Selector Control Panel */}
            <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-blue-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Profundidad de Conocimientos:</span>
                </div>
                
                {/* Segmented control */}
                <div className="bg-zinc-100 dark:bg-[#0D1117] p-1 rounded-xl flex items-center text-xs font-semibold border dark:border-[#2D333D]">
                  <button
                    id="btn-level-pri"
                    onClick={() => {
                      setLevel("pri");
                      setActiveTab("analisis");
                    }}
                    className={`px-4 py-2 rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
                      level === "pri"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/15 font-bold cursor-pointer"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
                    }`}
                  >
                    <span>Principiante (Nivel Pri)</span>
                  </button>
                  <button
                    id="btn-level-pro"
                    onClick={() => setLevel("pro")}
                    className={`px-4 py-2 rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
                      level === "pro"
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/15 font-bold cursor-pointer"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer"
                    }`}
                  >
                    <span>Profesional (Nivel Pro)</span>
                  </button>
                </div>
              </div>

              <div className="text-right">
                {level === "pri" ? (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-green-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/35 px-3 py-1.5 rounded-full">
                    ✓ Enfoque Minimalista: Toma de decisiones rápida y directa
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/35 px-3 py-1.5 rounded-full">
                    ✓ Modo Avanzado: Explicaciones teóricas completas, manuales y chat IA
                  </span>
                )}
              </div>
            </div>
            
            {/* Context Info Banner */}
            <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Toma de Decisiones Científicas</h2>
                <p className="text-xs text-zinc-500 dark:text-gray-400">
                  Las pruebas evalúan si tu muestra difiere significativamente de una campana teórica de Gauss. Un valor de <strong className="text-emerald-600 dark:text-green-400">p &gt; 0.05</strong> respalda la normalidad.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs bg-zinc-50 dark:bg-[#0D1117] px-3.5 py-2 border border-zinc-200 dark:border-[#30363D] rounded-lg">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="font-semibold text-zinc-600 dark:text-gray-300">Cálculos analíticos del lado cliente</span>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-4 rounded-xl flex items-center gap-3 text-sm text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Analysis Bento Grid */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Panel: Upload and inputs (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* 1. Sample Datasets picker */}
                {level === "pro" && (
                  <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-gray-500 flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-500" />
                      Ejemplos de Aprendizaje
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                      {sampleDatasets.map((ds, i) => {
                        const isSelected = rawData === ds.data;
                        return (
                          <button
                            key={ds.name}
                            onClick={() => handleLoadSample(i)}
                            className={`text-left p-3.5 rounded-lg border transition duration-150 ${
                              isSelected
                                ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-900/50"
                                : "bg-white dark:bg-[#0D1117] border-zinc-200 dark:border-[#30363D] hover:bg-zinc-50 dark:hover:bg-[#161B22]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-800 dark:text-white">{ds.name}</span>
                              <span className="text-[9px] font-mono bg-zinc-150 dark:bg-[#161B22] text-zinc-500 dark:text-gray-400 px-1.5 py-0.5 rounded border dark:border-[#30363D]">
                                N = {ds.data.length}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 dark:text-gray-400 mt-1.5 leading-relaxed">{ds.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Drag & Drop File Upload */}
                <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-gray-500 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-500" />
                    Subir CSV o Archivo de Texto
                  </h3>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="border-2 border-dashed border-zinc-200 dark:border-[#30363D] rounded-xl p-6 text-center hover:border-blue-500 dark:hover:border-blue-500 transition cursor-pointer relative"
                  >
                    <input
                      id="file-uploader"
                      type="file"
                      onChange={handleFileUpload}
                      accept=".csv,.txt,.tsv"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileSpreadsheet className="w-8 h-8 text-zinc-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-zinc-700 dark:text-gray-300">
                      Arrastra tu archivo CSV/TXT aquí o haz clic
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-gray-500 mt-1">
                      Soporta separadores de comas, punto y coma, o tabuladores
                    </p>
                  </div>

                  {/* Multi Column selector */}
                  {csvColumns && selectedColumn && (
                    <div className="space-y-2 pt-2 animate-fade-in">
                      <label className="block text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">
                        Columna numérica seleccionada:
                      </label>
                      <select
                        id="col-selector-dropdown"
                        value={selectedColumn}
                        onChange={(e) => handleColumnSelect(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-[#0D1117] border border-zinc-200 dark:border-[#30363D] rounded-lg py-2 px-3 text-xs font-bold text-zinc-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {Object.keys(csvColumns).map((key) => (
                          <option key={key} value={key}>
                            {key} ({csvColumns[key].length} valores)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quick Example Loader for Principiante */}
                  {level === "pri" && (
                    <div className="border-t border-zinc-100 dark:border-[#30363D] pt-3.5 mt-2 text-center">
                      <span className="text-[10px] text-zinc-400 dark:text-gray-500 font-bold uppercase tracking-wider block mb-2">
                        ¿No tienes datos propios? Prueba con un ejemplo:
                      </span>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <button
                          onClick={() => handleLoadSample(0)}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition duration-150 cursor-pointer ${
                            rawData === sampleDatasets[0].data
                              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 text-emerald-600 dark:text-green-400 font-extrabold"
                              : "bg-zinc-50 dark:bg-[#0D1117] border-zinc-200 dark:border-[#30363D] text-zinc-600 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-[#161B22]"
                          }`}
                        >
                          Estatura (Normal)
                        </button>
                        <button
                          onClick={() => handleLoadSample(1)}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition duration-150 cursor-pointer ${
                            rawData === sampleDatasets[1].data
                              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 text-emerald-600 dark:text-green-400 font-extrabold"
                              : "bg-zinc-50 dark:bg-[#0D1117] border-zinc-200 dark:border-[#30363D] text-zinc-600 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-[#161B22]"
                          }`}
                        >
                          Reacción (Sesgado)
                        </button>
                        <button
                          onClick={() => handleLoadSample(2)}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition duration-150 cursor-pointer ${
                            rawData === sampleDatasets[2].data
                              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 text-emerald-600 dark:text-green-400 font-extrabold"
                              : "bg-zinc-50 dark:bg-[#0D1117] border-zinc-200 dark:border-[#30363D] text-zinc-600 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-[#161B22]"
                          }`}
                        >
                          Examen (Bimodal)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Text area input for Paste */}
                <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-gray-500 flex items-center gap-2">
                    <Clipboard className="w-4 h-4 text-blue-500" />
                    Copiar y Pegar Columnas de Excel
                  </h3>
                  <textarea
                    id="txt-paste-area"
                    rows={5}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Pega tu columna de datos numéricos. Ejemplo:&#10;173.2&#10;168.5&#10;174.1&#10;169.3..."
                    className="w-full bg-zinc-50 dark:bg-[#0D1117] border border-zinc-200 dark:border-[#30363D] rounded-lg p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#0D1117] text-zinc-700 dark:text-gray-300 transition"
                  ></textarea>
                  <button
                    id="btn-process-pasted"
                    onClick={handleProcessPasted}
                    className="w-full bg-zinc-900 dark:bg-blue-600 text-white dark:text-white py-2 rounded-lg text-xs font-bold hover:bg-zinc-800 dark:hover:bg-blue-500 transition-colors"
                  >
                    Procesar Datos Copiados
                  </button>
                </div>

              </div>

              {/* Right Panel: Chart and results summary (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 3 Normality Test results card */}
                <div className="grid md:grid-cols-3 gap-4" id="stats-summary-cards">
                  
                  {/* Shapiro-Francia */}
                  <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Potencia</span>
                          {level === "pro" && (
                            <Tooltip 
                              title="Potencia Estadística (Shapiro-Francia)" 
                              description="La potencia mide la capacidad de una prueba para detectar correctamente desviaciones de la normalidad (evitando falsos negativos)."
                              details={[
                                "Especialmente diseñada para muestras de tamaño medio y grande.",
                                "Basada en la correlación lineal (W') entre los cuantiles ordenados de la muestra y los cuantiles teóricos.",
                                "W' próximo a 1 indica un alto ajuste a la normalidad teórica."
                              ]}
                              align="left"
                            />
                          )}
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          swResult.isNormal 
                            ? "bg-emerald-50 dark:bg-green-950/20 text-emerald-600 dark:text-green-400" 
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                        }`}>
                          {swResult.isNormal ? "Normal" : "No Normal"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-700 dark:text-gray-300 mt-3 flex items-center gap-1">
                        Shapiro-Francia
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-gray-500">(W')</span>
                      </h4>
                      <div className="mt-2.5 flex items-baseline">
                        <span className="text-2xl font-black font-mono tracking-tight text-zinc-900 dark:text-white">
                          {swResult.statisticValue.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <span className="text-zinc-400 dark:text-gray-500 font-mono text-[10px]">p-value:</span>
                        <span className={`font-mono font-bold ${
                          swResult.isNormal ? "text-emerald-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                        }`}>
                          {swResult.pValue < 0.0001 ? "< 0.0001" : swResult.pValue.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-gray-400 mt-4 leading-relaxed border-t border-zinc-100 dark:border-[#2D333D] pt-3">
                      {swResult.interpretation}
                    </p>
                  </div>

                  {/* Kolmogorov-Smirnov */}
                  <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Distancia</span>
                          {level === "pro" && (
                            <Tooltip 
                              title="Distancia Empírica (Kolmogorov-Smirnov)" 
                              description="La prueba KS evalúa la normalidad comparando la distribución acumulada observada frente a la teórica mediante una métrica de distancia espacial."
                              details={[
                                "El estadístico D representa la distancia máxima absoluta vertical entre ambas funciones de distribución.",
                                "Un valor D pequeño respalda la hipótesis nula de normalidad.",
                                "Sensible a cambios en el centro, la distribución y la forma de la distribución."
                              ]}
                              align="center"
                            />
                          )}
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          ksResult.isNormal 
                            ? "bg-emerald-50 dark:bg-green-950/20 text-emerald-600 dark:text-green-400" 
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                        }`}>
                          {ksResult.isNormal ? "Normal" : "No Normal"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-700 dark:text-gray-300 mt-3 flex items-center gap-1">
                        Kolmogorov-Smirnov
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-gray-500">(D)</span>
                      </h4>
                      <div className="mt-2.5 flex items-baseline">
                        <span className="text-2xl font-black font-mono tracking-tight text-zinc-900 dark:text-white">
                          {ksResult.statisticValue.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <span className="text-zinc-400 dark:text-gray-500 font-mono text-[10px]">p-value:</span>
                        <span className={`font-mono font-bold ${
                          ksResult.isNormal ? "text-emerald-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                        }`}>
                          {ksResult.pValue < 0.0001 ? "< 0.0001" : ksResult.pValue.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-gray-400 mt-4 leading-relaxed border-t border-zinc-100 dark:border-[#2D333D] pt-3">
                      {ksResult.interpretation}
                    </p>
                  </div>

                  {/* Jarque-Bera */}
                  <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-gray-500 uppercase tracking-wider">Momentos</span>
                          {level === "pro" && (
                            <Tooltip 
                              title="Momentos de Distribución (Jarque-Bera)" 
                              description="La prueba JB se basa en los momentos estandarizados de tercer y cuarto orden para determinar si los datos se comportan de manera simétrica y mesocúrtica."
                              details={[
                                "Evalúa de manera conjunta la asimetría (sesgo = 0) y el exceso de curtosis (curtosis = 0).",
                                "Estadístico JB = (n/6) * [S² + (K-3)² / 4].",
                                "Especialmente efectiva para muestras grandes; sensible a valores atípicos extremos."
                              ]}
                              align="right"
                            />
                          )}
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          jbResult.isNormal 
                            ? "bg-emerald-50 dark:bg-green-950/20 text-emerald-600 dark:text-green-400" 
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                        }`}>
                          {jbResult.isNormal ? "Normal" : "No Normal"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-700 dark:text-gray-300 mt-3 flex items-center gap-1">
                        Jarque-Bera
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-gray-500">(JB)</span>
                      </h4>
                      <div className="mt-2.5 flex items-baseline">
                        <span className="text-2xl font-black font-mono tracking-tight text-zinc-900 dark:text-white">
                          {jbResult.statisticValue.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <span className="text-zinc-400 dark:text-gray-500 font-mono text-[10px]">p-value:</span>
                        <span className={`font-mono font-bold ${
                          jbResult.isNormal ? "text-emerald-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
                        }`}>
                          {jbResult.pValue < 0.0001 ? "< 0.0001" : jbResult.pValue.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-4 leading-relaxed border-t border-zinc-100 dark:border-zinc-850 pt-3">
                      {jbResult.interpretation}
                    </p>
                  </div>

                </div>

                {/* Main Curve Plot Chart */}
                <Chart
                  data={rawData}
                  sortedData={sortedData}
                  mean={stats.mean}
                  sd={stats.sd}
                  binsCount={binsCount}
                  setBinsCount={setBinsCount}
                />

                {/* Criterios Fundamentales para la Toma de Decisión (Principiante / Profesional) */}
                <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-[#2D333D] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-50">
                          Criterios Fundamentales de Decisión
                        </h3>
                        <p className="text-[10px] text-zinc-400 dark:text-gray-500 font-medium">Guía simplificada para sustentar tu decisión científica</p>
                      </div>
                    </div>
                    <div>
                      {(() => {
                        const passedCount = [swResult.isNormal, ksResult.isNormal, jbResult.isNormal].filter(Boolean).length;
                        if (passedCount >= 2) {
                          return (
                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-green-400 border border-emerald-200/40 dark:border-emerald-900/30">
                              ✓ SUPUESTO CUMPLIDO (Normalidad Aceptada)
                            </span>
                          );
                        } else {
                          return (
                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/30">
                              ✗ DESVIACIÓN DETECTADA (No Normal)
                            </span>
                          );
                        }
                      })()}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed">
                    <div className="space-y-3">
                      <h4 className="font-bold text-zinc-700 dark:text-gray-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        1. Regla de Oro del p-valor (Significación)
                      </h4>
                      <p className="text-zinc-500 dark:text-gray-400 text-[11px]">
                        Para aceptar la normalidad estadística, buscamos un p-valor mayor a <strong className="text-zinc-800 dark:text-white">0.05</strong>. Si es menor, la muestra se desvía del comportamiento de Gauss.
                      </p>
                      <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#2D333D] space-y-1.5 font-mono text-[10px]">
                        <div className="flex justify-between items-center">
                          <span>Shapiro-Francia:</span>
                          <span className={swResult.isNormal ? "text-emerald-600 dark:text-green-400 font-bold" : "text-amber-600 dark:text-amber-400 font-bold"}>
                            p = {swResult.pValue < 0.0001 ? "< 0.0001" : swResult.pValue.toFixed(4)} ({swResult.isNormal ? "✓ Normal" : "✗ No Normal"})
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Kolmogorov-Smirnov:</span>
                          <span className={ksResult.isNormal ? "text-emerald-600 dark:text-green-400 font-bold" : "text-amber-600 dark:text-amber-400 font-bold"}>
                            p = {ksResult.pValue < 0.0001 ? "< 0.0001" : ksResult.pValue.toFixed(4)} ({ksResult.isNormal ? "✓ Normal" : "✗ No Normal"})
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Jarque-Bera:</span>
                          <span className={jbResult.isNormal ? "text-emerald-600 dark:text-green-400 font-bold" : "text-amber-600 dark:text-amber-400 font-bold"}>
                            p = {jbResult.pValue < 0.0001 ? "< 0.0001" : jbResult.pValue.toFixed(4)} ({jbResult.isNormal ? "✓ Normal" : "✗ No Normal"})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-zinc-700 dark:text-gray-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        2. ¿Qué camino estadístico seguir ahora?
                      </h4>
                      <p className="text-zinc-500 dark:text-gray-400 text-[11px]">
                        Dependiendo del veredicto final sobre la normalidad de tu muestra de datos, debes seleccionar las pruebas estadísticas correctas:
                      </p>
                      
                      {(() => {
                        const passedCount = [swResult.isNormal, ksResult.isNormal, jbResult.isNormal].filter(Boolean).length;
                        if (passedCount >= 2) {
                          return (
                            <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-350 space-y-1">
                              <span className="font-bold block">✓ Recomendación: Pruebas Paramétricas</span>
                              <span>Tus datos son aptos para aplicar pruebas de alto rendimiento como: <strong>T de Student, ANOVA de un factor, Coeficiente de Pearson</strong> o regresiones lineales clásicas.</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 p-3 rounded-lg text-[11px] text-amber-800 dark:text-amber-350 space-y-1">
                              <span className="font-bold block">⚠ Recomendación: Pruebas No Paramétricas</span>
                              <span>Se recomienda aplicar alternativas que no asumen normalidad como: <strong>U de Mann-Whitney, Wilcoxon, Kruskal-Wallis o Correlación de Spearman</strong>. También puedes aplicar transformaciones matemáticas (e.g. logaritmo natural).</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-gray-500 flex items-center gap-2">
                      <Sigma className="w-4 h-4 text-blue-500" />
                      Estadísticos Descriptivos de la Muestra
                    </h3>
                    {level === "pro" ? (
                      <button
                        id="btn-export-csv"
                        onClick={exportResultsToCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all duration-150 shadow-sm shadow-blue-500/10 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Exportar Resultados (CSV)</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-gray-500">Métricas auxiliares</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-550 tracking-wider">Muestra (N)</span>
                      <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{stats.n}</span>
                    </div>

                    <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-550 tracking-wider">Media (μ)</span>
                      <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{stats.mean.toFixed(2)}</span>
                    </div>

                    <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-550 tracking-wider">Desv. Estándar (σ)</span>
                      <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{stats.sd.toFixed(2)}</span>
                    </div>

                    <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-550 tracking-wider">Mediana</span>
                      <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{stats.median.toFixed(2)}</span>
                    </div>

                    <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-550 tracking-wider">Mínimo</span>
                      <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{stats.min.toFixed(2)}</span>
                    </div>

                    <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-550 tracking-wider">Máximo</span>
                      <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{stats.max.toFixed(2)}</span>
                    </div>

                    <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-550 tracking-wider">Asimetría (Sesgo)</span>
                      <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{stats.skewness.toFixed(3)}</span>
                    </div>

                    <div className="bg-zinc-50 dark:bg-[#0D1117] p-3 rounded-lg border border-zinc-100 dark:border-[#30363D] text-center">
                      <span className="block text-[9px] uppercase font-bold text-zinc-400 dark:text-gray-550 tracking-wider">Exceso Curtosis</span>
                      <span className="block text-sm font-black font-mono mt-1 text-zinc-800 dark:text-white">{stats.excessKurtosis.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        ) : (
          <div className="animate-fade-in">
            <Manual />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-[#2D333D] bg-white dark:bg-[#161B22]/40 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-zinc-400 dark:text-gray-550 space-y-2">
          <p>© 2026 Rolando Gelabert Fernández — Universidad Autónoma del Carmen</p>
          <p>Desarrollada por Rolando Gelabert · Licencia MIT</p>
          <p className="mt-1 font-mono text-[10px]">Todos los algoritmos de Shapiro-Francia, Kolmogorov-Smirnov y Jarque-Bera operan bajo fórmulas matemáticas nativas de alto rendimiento.</p>
        </div>
      </footer>

      {/* Interactive AI Clarification Chat */}
      {level === "pro" && <AiChat />}

    </div>
  );
}
