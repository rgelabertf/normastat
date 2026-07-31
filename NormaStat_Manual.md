# Manual de Operación y Fundamentos Estadísticos
**NormaStat — Evaluador de Normalidad de Datos**

Guía paso a paso para utilizar la herramienta de evaluación de normalidad e interpretar los resultados científicos de forma rigurosa.

---

## 1. Niveles de Profundidad de la Herramienta

Para adaptarse a tus necesidades específicas de aprendizaje y análisis, NormaStat cuenta con dos niveles de operación seleccionables en el panel de control superior:

### Principiante (Nivel Pri)
**Enfoque Minimalista e Ilustrativo**
Diseñado para una visualización rápida. Oculta tecnicismos complejos para centrarse en los datos, los resultados gráficos interactivos, los Estadísticos Descriptivos de la muestra y los criterios fundamentales recomendados para tomar una decisión científica ágil.

### Profesional (Nivel Pro)
**Laboratorio de Aprendizaje Estadístico**
Pensado para clases de estadística o autoaprendizaje supervisado. Además de todo lo incluido en el nivel Principiante, incorpora:
- Explicaciones teóricas detalladas de cada prueba.
- Tooltips informativos sobre cada métrica y estadístico.
- Asistente virtual **NormaStat IA** para resolver dudas conceptuales.
- Evaluación Cruzada de Supuestos (Pruebas Múltiples).
- Exportación detallada de resultados a CSV para reportes académicos.

---

## 2. Regla de Oro para Interpretar el p-valor

La herramienta se fundamenta en la siguiente regla de decisión universalmente aceptada:

- **H₀ (Hipótesis Nula):** Los datos siguen una distribución normal.
- **H₁ (Hipótesis Alternativa):** Los datos NO siguen una distribución normal.

### Criterio de Decisión
| Condición | Interpretación | Acción Recomendada |
|-----------|---------------|-------------------|
| **p > 0.05** | No se rechaza H₀ | Los datos son normales. Puedes usar pruebas **paramétricas** (t-student, ANOVA, correlación de Pearson). |
| **p ≤ 0.05** | Se rechaza H₀ | Los datos NO son normales. Usa pruebas **no paramétricas** (Mann-Whitney, Kruskal-Wallis, Spearman) o aplica transformaciones. |

> **Nota importante:** Si tu muestra tiene más de 1000 registros, considera usar un nivel de significancia más estricto (α = 0.01) para compensar la alta sensibilidad de las pruebas con muestras grandes.

---

## 3. Pruebas Estadísticas Incluidas

### Shapiro-Francia (W')
- **Tipo:** Prueba de bondad de ajuste basada en correlación.
- **Uso:** Variante mejorada de Shapiro-Wilk para muestras medianas y grandes.
- **Rango recomendado:** 5 ≤ N ≤ 5000.
- **Interpretación:** Evalúa si los datos se desvían de una distribución normal comparando los cuantiles observados vs. esperados.

### Kolmogorov-Smirnov (D)
- **Tipo:** Prueba de bondad de ajuste no paramétrica.
- **Uso:** Compara la función de distribución acumulada empírica con la distribución normal teórica.
- **Ventaja:** Funciona bien incluso con muestras muy grandes.
- **Limitación:** Menos sensible que Shapiro-Francia para detectar desviaciones en las colas.

### Jarque-Bera (JB)
- **Tipo:** Prueba basada en momentos.
- **Uso:** Evalúa conjuntamente la asimetría (skewness) y la curtosis de la muestra.
- **Fundamento:** Una distribución normal tiene asimetría = 0 y curtosis = 3.
- **Interpretación:** Valores grandes del estadístico JB indican desviación de la normalidad.

### Chi-cuadrado (χ²)
- **Tipo:** Prueba de bondad de ajuste no paramétrica.
- **Uso:** Compara las frecuencias observadas en cada intervalo (bin) contra las frecuencias esperadas bajo una distribución normal.
- **Fundamento:** χ² = Σ (Oᵢ - Eᵢ)² / Eᵢ, con k-3 grados de libertad (k = número de intervalos).
- **Interpretación:** Si el p-valor > 0.05, las diferencias entre frecuencias observadas y esperadas son atribuibles al azar.
- **Requisito:** Se requieren al menos 8 datos para obtener un resultado válido.

---

## 4. Carga de Datos

### Método 1: Copiar y Pegar
1. Selecciona y copia tus datos desde Excel, Google Sheets, SPSS, o cualquier hoja de cálculo.
2. Haz clic en el área de texto "Pega aquí tus datos".
3. Pega los datos usando Ctrl+V / Cmd+V.
4. Los datos se parsean automáticamente columna por columna.

### Método 2: Cargar Archivo
1. Haz clic en "Seleccionar archivo" o arrastra un archivo al área indicada.
2. Formatos aceptados: **CSV** y **TXT** (valores separados por comas, tabulaciones o espacios).
3. El sistema detecta automáticamente columnas numéricas con nombre.
4. Cada columna se analiza de forma independiente.

---

## 5. Despliegue para el Docente

La herramienta está disponible de forma gratuita en línea para su uso inmediato en clase:

- **URL de Acceso:** [https://normastat.vercel.app](https://normastat.vercel.app)
- **No requiere instalación** — funciona directamente en el navegador.
- **No requiere registro** de estudiantes.
- El asistente IA funciona sin necesidad de claves API para los alumnos.
- Se puede generar un archivo **HTML independiente** para usar sin conexión.
- Compatible con cualquier dispositivo: computadora, tableta o celular.

---

## 6. Ejecución Offline (Exportar HTML Autónomo)

La herramienta permite generar un archivo HTML completamente independiente y autocontenido para ejecutarse sin conexión a internet:

1. Carga y analiza tus datos en la versión en línea.
2. Haz clic en **"Exportar HTML Autónomo"** en el panel de resultados.
3. El archivo generado contiene **todo** el código necesario (HTML+CSS+JS) incrustado.
4. Funciona en cualquier navegador moderno sin servidor ni conexión.
5. Los datos permanecen **100% privados** — nunca salen de tu dispositivo.
6. Ideal para entornos educativos sin internet o para preservar resultados.

---

> **NormaStat** — Evaluador de Normalidad de Datos
> GitHub: [https://github.com/rogeliodh/Normalidad](https://github.com/rogeliodh/Normalidad)
> Documento generado automáticamente desde la aplicación.
