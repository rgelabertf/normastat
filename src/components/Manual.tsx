import React from "react";
import { BookOpen, FileSpreadsheet, CheckCircle2, AlertCircle, Info, Download } from "lucide-react";

export const Manual: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Introduction Header */}
      <div className="border-b border-zinc-150 dark:border-[#2D333D] pb-6">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-500" />
          Manual de Operación y Fundamentos Estadísticos
        </h2>
        <p className="text-zinc-500 dark:text-gray-400 mt-2 text-sm">
          Guía paso a paso para utilizar la herramienta de evaluación de normalidad e interpretar los resultados científicos de forma rigurosa.
        </p>
      </div>

      {/* Niveles de Profundidad y Nuevas Funcionalidades */}
      <section className="bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-[#161B22]/60 dark:to-[#161B22]/20 border border-zinc-200 dark:border-[#30363D] rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-blue-500" />
          Niveles de Profundidad de la Herramienta
        </h3>
        <p className="text-xs text-zinc-500 dark:text-gray-400 leading-relaxed">
          Para adaptarse a tus necesidades específicas de aprendizaje y análisis, NormaStat cuenta con dos niveles de operación seleccionables en el panel de control superior:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#0D1117] border border-zinc-200/80 dark:border-[#30363D]/80 p-4 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-extrabold px-2 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-900/30 rounded-lg">
              Principiante (Nivel Pri)
            </span>
            <p className="text-xs font-semibold text-zinc-800 dark:text-white pt-1">Enfoque Minimalista e Ilustrativo</p>
            <p className="text-[11px] text-zinc-500 dark:text-gray-400 leading-relaxed">
              Diseñado para una visualización rápida. Oculta tecnicismos complejos para centrarse en los datos, los resultados gráficos interactivos, los <strong>Estadísticos Descriptivos</strong> de la muestra y los criterios fundamentales recomendados para tomar una decisión científica ágil.
            </p>
          </div>
          <div className="bg-white dark:bg-[#0D1117] border border-zinc-200/80 dark:border-[#30363D]/80 p-4 rounded-xl space-y-2">
            <span className="text-[10px] uppercase font-extrabold px-2 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-200/40 dark:border-blue-900/30 rounded-lg">
              Profesional (Nivel Pro)
            </span>
            <p className="text-xs font-semibold text-zinc-800 dark:text-white pt-1">Entorno de Aprendizaje Avanzado</p>
            <p className="text-[11px] text-zinc-500 dark:text-gray-400 leading-relaxed">
              Habilita explicaciones teóricas avanzadas, tooltips de ayuda estadística detallados, acceso completo a este Manual operativo y las siguientes herramientas clave integradas:
            </p>
            <ul className="text-[10px] text-zinc-500 dark:text-gray-400 list-disc pl-4 space-y-1 pt-1">
              <li><strong>Asistente Científico IA (NormaStat):</strong> Chatbot contextual para resolver dudas sobre asimetría, curtosis, tests y p-valores.</li>
              <li><strong>Exportar CSV:</strong> Permite descargar un reporte completo con métricas descriptivas y resultados de las pruebas estadísticas de normalidad.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Regla de Oro de la Toma de Decisiones */}
      <section className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-6">
        <h3 className="text-base font-semibold text-blue-900 dark:text-blue-400 flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0" />
          La Regla de Oro: Interpretación del Valor de p (p-value)
        </h3>
        <p className="text-sm text-zinc-700 dark:text-gray-300 leading-relaxed mb-4">
          En todas las pruebas de normalidad planteadas, contrastamos dos hipótesis fundamentales:
        </p>
        
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-lg p-4">
            <span className="text-xs font-bold px-2 py-0.5 bg-zinc-100 dark:bg-[#21262D] text-zinc-600 dark:text-gray-300 rounded">
              Hipótesis Nula (H₀)
            </span>
            <p className="text-sm font-medium text-zinc-800 dark:text-white mt-2">
              Los datos provienen de una población distribuida normalmente.
            </p>
            <p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">
              No hay diferencia significativa entre la muestra y la teoría normal.
            </p>
          </div>
          
          <div className="bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-lg p-4">
            <span className="text-xs font-bold px-2 py-0.5 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded">
              Hipótesis Alternativa (H₁)
            </span>
            <p className="text-sm font-medium text-zinc-800 dark:text-white mt-2">
              Los datos NO provienen de una población distribuida normalmente.
            </p>
            <p className="text-xs text-zinc-500 dark:text-gray-400 mt-1">
              Existe una desviación estadísticamente significativa de la normalidad.
            </p>
          </div>
        </div>

        <div className="space-y-3 border-t border-blue-100/50 dark:border-blue-950/20 pt-4">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-white">
                Si p &gt; 0.05 (Nivel de significación del 5%)
              </p>
              <p className="text-xs text-zinc-500 dark:text-gray-400">
                <strong className="text-emerald-600 dark:text-green-400">No se rechaza H₀</strong>. Significa que tus datos tienen un comportamiento normal y puedes utilizar estadística paramétrica con seguridad (ej. pruebas t de Student, ANOVA, correlaciones de Pearson).
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-white">
                Si p ≤ 0.05
              </p>
              <p className="text-xs text-zinc-500 dark:text-gray-400">
                <strong className="text-orange-600 dark:text-orange-400">Se rechaza H₀</strong>. Significa que tus datos NO tienen un comportamiento normal y deberías considerar el uso de estadística no paramétrica (ej. U de Mann-Whitney, Wilcoxon, Kruskal-Wallis, correlaciones de Spearman) o aplicar transformaciones matemáticas (como logarítmica o raíz cuadrada).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pruebas Estadísticas Incluidas */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
          ¿Qué pruebas estadísticas contiene esta herramienta?
        </h3>
        
        <div className="space-y-4">
          {/* Shapiro-Francia */}
          <div className="border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 space-y-2 bg-white dark:bg-[#161B22]">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-zinc-800 dark:text-white text-sm">
                1. Shapiro-Francia (Aproximación de Shapiro-Wilk)
              </h4>
              <span className="text-xs font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                Estadístico W'
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-gray-400 leading-relaxed">
              Es una de las pruebas de normalidad más potentes y recomendadas en la literatura científica. Es una versión modificada del algoritmo clásico de Shapiro-Wilk optimizada para muestras de tamaño mediano y grande ($5 \le N \le 5000$). Evalúa la correlación lineal entre los datos ordenados observados y las expectativas teóricas de una normal. Un valor de $W'$ cercano a 1 indica excelente ajuste normal.
            </p>
          </div>

          {/* Kolmogorov-Smirnov */}
          <div className="border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 space-y-2 bg-white dark:bg-[#161B22]">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-zinc-800 dark:text-white text-sm">
                2. Kolmogorov-Smirnov con Estimación Paramétrica
              </h4>
              <span className="text-xs font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                Estadístico D
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-gray-400 leading-relaxed">
              Compara de forma directa la Función de Distribución Acumulada empírica (ECDF) de tu muestra contra la función teórica de una distribución normal. El estadístico $D$ representa la distancia máxima vertical entre ambas funciones acumuladas. Es una prueba muy clásica y conservadora para evaluar distribuciones completas.
            </p>
          </div>

          {/* Jarque-Bera */}
          <div className="border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 space-y-2 bg-white dark:bg-[#161B22]">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-zinc-800 dark:text-white text-sm">
                3. Jarque-Bera
              </h4>
              <span className="text-xs font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                Estadístico JB
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-gray-400 leading-relaxed">
              Esta prueba evalúa específicamente los coeficientes de **Simetría (Skewness)** y **Curtosis** de los datos. En una distribución normal pura, el sesgo es exactamente 0 y la curtosis es exactamente 3 (exceso de curtosis es 0). La prueba de Jarque-Bera evalúa si estas dos medidas conjuntas difieren estadísticamente del estándar teórico. Es idóneo para muestras grandes.
            </p>
          </div>
        </div>
      </section>

      {/* Carga de Datos */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
          ¿Cómo cargar tus propios datos?
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 space-y-3 bg-white dark:bg-[#161B22]">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-white">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              <h4 className="font-semibold text-sm">Método 1: Copiar y Pegar Directo</h4>
            </div>
            <p className="text-xs text-zinc-500 dark:text-gray-400 leading-relaxed">
              Es el método más sencillo si tienes tus datos abiertos en **Microsoft Excel, Google Sheets, SPSS** o un editor de texto.
            </p>
            <ol className="text-xs text-zinc-500 dark:text-gray-400 space-y-1.5 list-decimal pl-4">
              <li>Selecciona la columna numérica de tu hoja de cálculo.</li>
              <li>Presiona <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-[#21262D] border border-zinc-200 dark:border-[#30363D] rounded text-[10px] text-zinc-800 dark:text-white">Ctrl+C</kbd> (o Cmd+C).</li>
              <li>Pega el contenido directamente en la casilla de texto de la aplicación y presiona <strong>"Procesar Datos Copiados"</strong>.</li>
            </ol>
          </div>

          <div className="border border-zinc-200 dark:border-[#30363D] rounded-xl p-5 space-y-3 bg-white dark:bg-[#161B22]">
            <div className="flex items-center gap-2 text-zinc-800 dark:text-white">
              <Download className="w-5 h-5 text-green-500" />
              <h4 className="font-semibold text-sm">Método 2: Subir archivo CSV/TXT</h4>
            </div>
            <p className="text-xs text-zinc-500 dark:text-gray-400 leading-relaxed">
              Ideal para conjuntos de datos guardados en archivos delimitados por comas o tabuladores.
            </p>
            <ol className="text-xs text-zinc-500 dark:text-gray-400 space-y-1.5 list-decimal pl-4">
              <li>Arrastra o selecciona tu archivo <code>.csv</code> o <code>.txt</code>.</li>
              <li>La herramienta detectará de forma inteligente si hay varias columnas.</li>
              <li>Usa el selector desplegable para elegir cuál columna numérica deseas analizar en tiempo real.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Despliegue para el Docente */}
      <section className="bg-gradient-to-r from-emerald-50 to-zinc-50 dark:from-emerald-950/10 dark:to-[#0D1117] border border-emerald-200 dark:border-emerald-900/20 rounded-xl p-6">
        <h3 className="text-base font-semibold text-zinc-800 dark:text-white flex items-center gap-2 mb-3">
          <Download className="w-5 h-5 text-emerald-500" />
          Despliegue e Implementación para el Docente
        </h3>
        <p className="text-xs text-zinc-500 dark:text-gray-400 leading-relaxed mb-4">
          NormaStat está disponible online sin necesidad de instalación. Comparte el siguiente enlace con tus estudiantes para que accedan desde cualquier navegador:
        </p>
        <div className="bg-white dark:bg-[#161B22] border border-emerald-200 dark:border-emerald-900/30 rounded-lg p-4 mb-4 font-mono text-sm text-center text-emerald-700 dark:text-emerald-400 select-all">
          https://normastat.vercel.app
        </div>
        <div className="grid md:grid-cols-3 gap-3 text-xs">
          <div className="px-3 py-2 bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
            <span className="text-zinc-600 dark:text-gray-300">Sin instalación &mdash; solo un navegador</span>
          </div>
          <div className="px-3 py-2 bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
            <span className="text-zinc-600 dark:text-gray-300">Asistente IA funcional sin API key del estudiante</span>
          </div>
          <div className="px-3 py-2 bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
            <span className="text-zinc-600 dark:text-gray-300">Exportación HTML offline disponible</span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-gray-500 mt-3 leading-relaxed">
          <strong>Nota técnica:</strong> El chat IA utiliza la API de Gemini a través de un proxy serverless en Vercel. Los estudiantes no necesitan configurar ninguna clave &mdash; la herramienta funciona directamente al abrir el enlace.
        </p>
      </section>

      {/* Uso Sin Conexión */}
      <section className="bg-zinc-50 dark:bg-[#0D1117] border border-zinc-200 dark:border-[#2D333D] rounded-xl p-6">
        <h3 className="text-base font-semibold text-zinc-800 dark:text-white flex items-center gap-2 mb-3">
          <Download className="w-5 h-5 text-blue-500" />
          Ejecución Offline y Portabilidad Extrema (Un Solo Archivo)
        </h3>
        <p className="text-xs text-zinc-500 dark:text-gray-400 leading-relaxed mb-4">
          Esta aplicación cumple con estándares de privacidad y funcionamiento libre. Si presionas el botón de <strong>"Exportar Aplicación HTML Autónoma"</strong>, se compilará un archivo HTML autocontenido de apenas unos kilobytes que incluye toda la lógica matemática, los gráficos SVG dinámicos y los estilos visuales en un solo archivo.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs">
          <div className="px-3 py-2 bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="font-mono text-zinc-600 dark:text-gray-300">100% Privado (Tus datos nunca salen de tu equipo)</span>
          </div>
          <div className="px-3 py-2 bg-white dark:bg-[#161B22] border border-zinc-200 dark:border-[#30363D] rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="font-mono text-zinc-600 dark:text-gray-300">Funciona en tablets, smartphones y laptops sin internet</span>
          </div>
        </div>
      </section>
    </div>
  );
};
