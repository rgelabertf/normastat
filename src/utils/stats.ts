import { TestResult, DataSummary, Bin, SampleDataset } from "../types";

// Standard Normal CDF (using Abramowitz & Stegun approximation, error < 7.5e-8)
export function stdNormalCDF(z: number): number {
  const p = 0.2316419;
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;

  const absZ = Math.abs(z);
  const t = 1.0 / (1.0 + p * absZ);
  const pdf = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  let cdf = 1.0 - pdf * (b1 * t + b2 * t * t + b3 * Math.pow(t, 3) + b4 * Math.pow(t, 4) + b5 * Math.pow(t, 5));
  
  if (z < 0) {
    cdf = 1.0 - cdf;
  }
  return cdf;
}

// Inverse Standard Normal CDF (rational approximation for z)
export function inverseNormalCDF(p: number): number {
  if (p <= 0) return -5.0; // extreme bounds
  if (p >= 1) return 5.0;

  // Coefficients for Wichura's rational approximation
  const c = [2.515517, 0.802853, 0.010328];
  const d = [1.432788, 0.189269, 0.001308];

  const t = Math.sqrt(-2.0 * Math.log(p < 0.5 ? p : 1.0 - p));
  const num = c[0] + c[1] * t + c[2] * t * t;
  const den = 1.0 + d[0] * t + d[1] * t * t + d[2] * t * t * t;
  const z = t - num / den;
  return p < 0.5 ? -z : z;
}

// Kolmogorov distribution probability approximation
export function ksPValue(d: number, n: number): number {
  const lambda = (Math.sqrt(n) + 0.12 + 0.11 / Math.sqrt(n)) * d;
  if (lambda < 0.2) return 1.0;
  if (lambda > 3.0) return 0.0;

  let sum = 0;
  for (let k = 1; k <= 50; k++) {
    const term = Math.pow(-1, k - 1) * Math.exp(-2 * k * k * lambda * lambda);
    sum += term;
    if (Math.abs(term) < 1e-12) break;
  }
  return Math.min(1.0, Math.max(0.0, 2 * sum));
}

// Shapiro-Francia Normality Test (for n >= 5)
// This is the optimal approximation of Shapiro-Wilk for medium to large samples.
export function runShapiroFrancia(sortedData: number[]): TestResult {
  const n = sortedData.length;
  const sum = sortedData.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  // Sum of squared deviations (SS)
  let ss = 0;
  for (let i = 0; i < n; i++) {
    ss += Math.pow(sortedData[i] - mean, 2);
  }

  const formula = "W' = (\\sum a_i x_{(i)})^2 / \\sum (x_i - \\bar{x})^2";

  if (ss === 0) {
    return {
      statisticName: "Shapiro-Francia",
      statisticSymbol: "W'",
      statisticValue: 0,
      pValue: 0,
      isNormal: false,
      interpretation: "La muestra es constante (varianza cero). No es posible evaluar la normalidad.",
      formula
    };
  }

  if (n < 5) {
    return {
      statisticName: "Shapiro-Francia",
      statisticSymbol: "W'",
      statisticValue: 1.0,
      pValue: 1.0,
      isNormal: true,
      interpretation: "Se requieren al menos 5 datos para realizar la prueba de Shapiro-Francia.",
      formula
    };
  }

  // Calculate standard normal order statistics m_i
  const m = new Float64Array(n);
  let sumM2 = 0;
  for (let i = 0; i < n; i++) {
    const p = (i + 1 - 0.375) / (n + 0.25);
    m[i] = inverseNormalCDF(p);
    sumM2 += m[i] * m[i];
  }
  const sqrtSumM2 = Math.sqrt(sumM2);

  // Coefficients a_i
  let sumAX = 0;
  for (let i = 0; i < n; i++) {
    const a_i = m[i] / sqrtSumM2;
    sumAX += a_i * sortedData[i];
  }

  const wPrime = Math.pow(sumAX, 2) / ss;
  
  // Safe bounds for numerical precision
  const wPrimeClamped = Math.min(0.9999999, Math.max(0.0000001, wPrime));

  // Royston (1983) normal approximation for wPrime distribution
  const lnN = Math.log(n);
  const mean_v = -1.2725 + 1.0521 * (lnN - Math.log(4));
  const sigma_v = Math.exp(1.5677 - 0.4826 * lnN);
  
  const v = Math.log(1.0 - wPrimeClamped);
  const z = (v - mean_v) / sigma_v;
  
  // Upper tail of standard normal
  const pValue = stdNormalCDF(-z);

  return {
    statisticName: "Shapiro-Francia (Aproximación de Shapiro-Wilk)",
    statisticSymbol: "W'",
    statisticValue: wPrimeClamped,
    pValue: pValue,
    isNormal: pValue > 0.05,
    interpretation: pValue > 0.05
      ? "No se rechaza la hipótesis nula (p > 0.05). Los datos siguen una distribución normal."
      : "Se rechaza la hipótesis nula (p ≤ 0.05). Los datos difieren significativamente de una distribución normal.",
    formula
  };
}

// Kolmogorov-Smirnov Normality Test (comparing empirical CDF against normal CDF)
export function runKolmogorovSmirnov(sortedData: number[], mean: number, sd: number): TestResult {
  const n = sortedData.length;
  const formula = "D = \\max | F_n(x) - \\Phi(x) |";

  if (n < 3) {
    return {
      statisticName: "Kolmogorov-Smirnov",
      statisticSymbol: "D",
      statisticValue: 0,
      pValue: 1.0,
      isNormal: true,
      interpretation: "Se requieren al menos 3 datos para realizar la prueba de Kolmogorov-Smirnov.",
      formula
    };
  }

  if (sd === 0) {
    return {
      statisticName: "Kolmogorov-Smirnov",
      statisticSymbol: "D",
      statisticValue: 1.0,
      pValue: 0.0,
      isNormal: false,
      interpretation: "La desviación estándar es cero. Los datos son constantes y no siguen una curva normal.",
      formula
    };
  }

  let maxD = 0;
  for (let i = 0; i < n; i++) {
    const x = sortedData[i];
    const z = (x - mean) / sd;
    const cdfTheoretical = stdNormalCDF(z);
    
    // Step values
    const cdfEmpiricalBefore = i / n;
    const cdfEmpiricalAfter = (i + 1) / n;
    
    const d1 = Math.abs(cdfEmpiricalAfter - cdfTheoretical);
    const d2 = Math.abs(cdfTheoretical - cdfEmpiricalBefore);
    
    if (d1 > maxD) maxD = d1;
    if (d2 > maxD) maxD = d2;
  }

  const pValue = ksPValue(maxD, n);

  return {
    statisticName: "Kolmogorov-Smirnov",
    statisticSymbol: "D",
    statisticValue: maxD,
    pValue: pValue,
    isNormal: pValue > 0.05,
    interpretation: pValue > 0.05
      ? "No se rechaza la hipótesis nula (p > 0.05). Los datos no muestran desviaciones significativas respecto a la normal."
      : "Se rechaza la hipótesis nula (p ≤ 0.05). Los datos no provienen de una población distribuida normalmente.",
    formula
  };
}

// Jarque-Bera Normality Test (based on skewness and kurtosis)
export function runJarqueBera(sortedData: number[]): TestResult {
  const n = sortedData.length;
  const formula = "JB = \\frac{n}{6} [ S^2 + \\frac{(K - 3)^2}{4} ]";

  if (n < 4) {
    return {
      statisticName: "Jarque-Bera",
      statisticSymbol: "JB",
      statisticValue: 0,
      pValue: 1.0,
      isNormal: true,
      interpretation: "Se requieren al menos 4 datos para la prueba de Jarque-Bera.",
      formula
    };
  }

  const sum = sortedData.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  let m2 = 0;
  let m3 = 0;
  let m4 = 0;

  for (let i = 0; i < n; i++) {
    const diff = sortedData[i] - mean;
    const diff2 = diff * diff;
    m2 += diff2;
    m3 += diff2 * diff;
    m4 += diff2 * diff2;
  }

  m2 /= n;
  m3 /= n;
  m4 /= n;

  if (m2 === 0) {
    return {
      statisticName: "Jarque-Bera",
      statisticSymbol: "JB",
      statisticValue: 0,
      pValue: 0,
      isNormal: false,
      interpretation: "Varianza cero. Los datos no siguen una distribución normal.",
      formula
    };
  }

  const skewness = m3 / Math.pow(m2, 1.5);
  const kurtosis = m4 / Math.pow(m2, 2);

  const jb = (n / 6) * (Math.pow(skewness, 2) + Math.pow(kurtosis - 3, 2) / 4);
  
  // JB follows Chi-Square distribution with 2 df under H0
  // P-value = exp(-JB / 2)
  const pValue = Math.exp(-jb / 2);

  return {
    statisticName: "Jarque-Bera (Simetría y Curtosis)",
    statisticSymbol: "JB",
    statisticValue: jb,
    pValue: pValue,
    isNormal: pValue > 0.05,
    interpretation: pValue > 0.05
      ? "No se rechaza la hipótesis nula (p > 0.05). Tanto la asimetría como la curtosis son consistentes con una distribución normal."
      : "Se rechaza la hipótesis nula (p ≤ 0.05). La asimetría o la curtosis difieren significativamente de una distribución normal.",
    formula
  };
}

// Compile all summary statistics
export function getSummaryStatistics(data: number[]): DataSummary {
  const n = data.length;
  if (n === 0) {
    return { n: 0, mean: 0, sd: 0, median: 0, min: 0, max: 0, skewness: 0, kurtosis: 0, excessKurtosis: 0, variance: 0 };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[n - 1];
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  let median = 0;
  if (n % 2 === 0) {
    median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  } else {
    median = sorted[Math.floor(n / 2)];
  }

  let sumSqDiff = 0;
  let sumCubeDiff = 0;
  let sumQuadDiff = 0;

  for (let i = 0; i < n; i++) {
    const diff = data[i] - mean;
    const diff2 = diff * diff;
    sumSqDiff += diff2;
    sumCubeDiff += diff2 * diff;
    sumQuadDiff += diff2 * diff2;
  }

  const variance = n > 1 ? sumSqDiff / (n - 1) : 0;
  const sd = Math.sqrt(variance);

  // Moments
  const m2 = sumSqDiff / n;
  const m3 = sumCubeDiff / n;
  const m4 = sumQuadDiff / n;

  let skewness = 0;
  let kurtosis = 3;
  if (m2 > 0) {
    skewness = m3 / Math.pow(m2, 1.5);
    kurtosis = m4 / Math.pow(m2, 2);
  }

  return {
    n,
    mean,
    sd,
    median,
    min,
    max,
    skewness,
    kurtosis,
    excessKurtosis: kurtosis - 3,
    variance
  };
}

// Calculate IQR for bandwidth calculation
export function calculateIQR(sortedData: number[]): number {
  const n = sortedData.length;
  if (n < 4) return 0;
  
  // Clean percentile calculation
  const getPercentile = (p: number) => {
    const idx = (n - 1) * p;
    const base = Math.floor(idx);
    const rest = idx - base;
    if (base + 1 < n) {
      return sortedData[base] + rest * (sortedData[base + 1] - sortedData[base]);
    }
    return sortedData[base];
  };

  return getPercentile(0.75) - getPercentile(0.25);
}

// Silverman's Rule of Thumb for KDE Bandwidth
export function calculateBandwidth(sortedData: number[], sd: number): number {
  const n = sortedData.length;
  if (n === 0) return 1.0;
  const iqr = calculateIQR(sortedData);
  const spread = iqr > 0 ? Math.min(sd, iqr / 1.34) : sd;
  const h = (spread > 0 ? spread : 1.0) * 0.9 * Math.pow(n, -0.2);
  // Ensure bandwidth isn't too small
  return Math.max(h, 1e-5);
}

// Get standard normal kernel density contribution
export function getKDEDensity(x: number, data: number[], h: number): number {
  const n = data.length;
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const u = (x - data[i]) / h;
    const kernel = Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
    sum += kernel;
  }
  return sum / (n * h);
}

// Evaluate Normal Density at x
export function getNormalDensity(x: number, mean: number, sd: number): number {
  if (sd === 0) return 0;
  const exponent = -Math.pow(x - mean, 2) / (2 * sd * sd);
  return Math.exp(exponent) / (sd * Math.sqrt(2 * Math.PI));
}

// Compute dynamic histogram bins
export function computeBins(data: number[], numBins: number): Bin[] {
  const n = data.length;
  if (n === 0) return [];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  // Handle case where all values are equal
  if (range === 0) {
    return [{
      index: 0,
      x0: min - 0.5,
      x1: min + 0.5,
      count: n,
      density: 1.0
    }];
  }

  const binWidth = range / numBins;
  const bins: Bin[] = [];

  for (let i = 0; i < numBins; i++) {
    const x0 = min + i * binWidth;
    const x1 = x0 + binWidth;
    bins.push({
      index: i,
      x0,
      x1,
      count: 0,
      density: 0
    });
  }

  // Assign items to bins
  for (let i = 0; i < n; i++) {
    const val = data[i];
    let binIdx = Math.floor((val - min) / binWidth);
    if (binIdx >= numBins) {
      binIdx = numBins - 1; // edge case for max value
    }
    if (binIdx < 0) {
      binIdx = 0;
    }
    bins[binIdx].count++;
  }

  // Calculate density: count / (n * binWidth)
  for (let i = 0; i < numBins; i++) {
    bins[i].density = bins[i].count / (n * binWidth);
  }

  return bins;
}

// Sample Datasets for the user to pick and play with
export const sampleDatasets: SampleDataset[] = [
  {
    name: "Estatura de Estudiantes (Normal)",
    description: "Alturas simuladas de 150 estudiantes universitarios en centímetros. Sigue de manera muy precisa una distribución normal con media = 170 y desviación estándar = 7.",
    data: [
      173.1, 168.4, 169.5, 175.2, 165.1, 172.3, 178.6, 160.2, 171.1, 166.7,
      174.4, 170.1, 179.3, 164.8, 172.9, 167.2, 176.5, 169.1, 161.4, 175.8,
      170.4, 173.8, 163.5, 168.1, 174.9, 172.1, 167.9, 166.2, 177.1, 171.5,
      169.4, 165.7, 173.4, 176.2, 162.8, 170.8, 168.9, 178.1, 171.9, 164.1,
      175.4, 167.5, 170.2, 174.1, 169.8, 166.4, 172.7, 173.6, 161.9, 171.3,
      168.3, 177.4, 165.9, 170.5, 174.7, 169.2, 164.5, 173.9, 171.1, 176.1,
      166.9, 172.5, 169.7, 163.1, 175.1, 170.9, 168.6, 179.1, 172.2, 165.4,
      174.6, 167.8, 171.4, 173.3, 169.1, 166.1, 172.8, 174.2, 162.1, 170.7,
      168.5, 177.9, 165.2, 171.6, 175.3, 169.5, 163.8, 173.2, 171.8, 176.8,
      167.1, 172.4, 169.9, 164.4, 174.8, 170.3, 168.2, 178.4, 172.6, 165.8,
      173.7, 167.3, 171.2, 174.5, 169.3, 166.5, 172.9, 173.5, 162.5, 171.7,
      168.7, 177.5, 165.5, 170.6, 175.6, 169.6, 164.2, 173.1, 171.3, 176.3,
      167.4, 172.1, 169.1, 163.6, 174.3, 170.5, 168.1, 178.9, 172.4, 165.2,
      173.5, 167.9, 171.8, 174.1, 169.4, 166.8, 172.6, 173.9, 162.9, 171.2,
      168.2, 177.1, 165.9, 170.2, 175.1, 169.9, 164.8, 173.3, 171.5, 176.2
    ]
  },
  {
    name: "Tiempos de Reacción (Asimétrica Positiva)",
    description: "Tiempos de reacción en milisegundos de 80 participantes ante un estímulo visual. Presenta una asimetría positiva típica (sesgo a la derecha) ya que los humanos tienen un límite físico de velocidad.",
    data: [
      185, 192, 198, 201, 205, 210, 212, 215, 218, 220,
      222, 225, 228, 230, 232, 235, 238, 240, 242, 245,
      248, 250, 252, 255, 258, 260, 263, 265, 268, 272,
      275, 278, 282, 285, 288, 292, 295, 300, 304, 308,
      312, 316, 321, 326, 331, 336, 342, 348, 354, 361,
      368, 376, 384, 393, 402, 412, 423, 435, 448, 462,
      478, 495, 514, 535, 558, 584, 613, 646, 684, 728,
      780, 842, 918, 1012, 1134, 1298, 1524, 1850, 2340, 3120
    ]
  },
  {
    name: "Calificaciones de Examen (Bimodal)",
    description: "Resultados de un examen de matemáticas de 100 alumnos donde hay dos grupos diferenciados (los que entendieron el tema y los que necesitan reforzamiento). Produce una distribución bimodal.",
    data: [
      45.2, 48.1, 41.5, 52.3, 49.8, 46.4, 43.1, 55.2, 47.3, 50.1,
      51.4, 44.2, 48.9, 53.5, 46.1, 49.3, 52.8, 42.9, 50.6, 47.8,
      85.1, 88.4, 82.5, 91.3, 89.9, 86.2, 83.4, 94.2, 87.1, 90.3,
      91.5, 84.4, 88.9, 93.1, 86.5, 89.7, 92.4, 82.1, 90.8, 87.5,
      43.4, 47.2, 42.1, 54.1, 48.8, 45.3, 44.5, 53.2, 46.7, 51.1,
      84.1, 87.9, 81.2, 92.3, 88.2, 85.1, 82.9, 93.5, 86.8, 91.4,
      46.2, 51.5, 43.8, 50.4, 47.9, 48.5, 42.6, 52.1, 49.4, 44.9,
      85.8, 89.2, 83.1, 90.5, 87.4, 86.9, 81.8, 92.1, 88.7, 85.2,
      48.3, 41.9, 49.5, 50.8, 45.8, 46.1, 43.5, 51.4, 47.2, 53.1,
      83.7, 88.5, 82.2, 89.1, 86.4, 87.2, 84.1, 91.6, 88.1, 89.8
    ]
  },
  {
    name: "Resultados de Dado (Uniforme)",
    description: "Resultados de lanzar un dado equilibrado de 6 caras 120 veces. Al tener todas las caras la misma probabilidad, se obtiene una distribución uniforme que claramente no es normal.",
    data: [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
      4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
      5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
      6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6
    ]
  }
];

// Chi-square CDF using regularized lower incomplete gamma function
function chiSquareCDF(x: number, k: number): number {
  if (x <= 0) return 0;
  return lowerRegularizedGamma(k / 2, x / 2);
}

// Regularized lower incomplete gamma function P(a, x) using series expansion
function lowerRegularizedGamma(a: number, x: number): number {
  if (x < 0 || a <= 0) return 0;
  if (x === 0) return 0;
  if (x < a + 1) {
    // Series representation
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < 1e-14) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  } else {
    // Continued fraction representation (modified Lentz)
    const f = 1e-30;
    let C = f;
    let D = 1 / (x - a + 1 + f);
    let h = D;
    for (let i = 2; i <= 200; i++) {
      const n = i - 1;
      const a_n = -n * (n - a);
      const b_n = x + 2 * n - a;
      D = 1 / (b_n + a_n * D + f);
      C = b_n + a_n / C + f;
      const delta = C * D;
      h *= delta;
      if (Math.abs(delta - 1) < 1e-14) break;
    }
    const result = Math.exp(-x + a * Math.log(x) - logGamma(a)) / h;
    return 1 - result;
  }
}

// Log-gamma function (Lanczos approximation)
function logGamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// Chi-Square Goodness-of-Fit Test for Normality
export function runChiSquareGOF(sortedData: number[], mean: number, sd: number, binsCount?: number): TestResult {
  const n = sortedData.length;
  const formula = "\\chi^2 = \\sum_{i=1}^{k} \\frac{(O_i - E_i)^2}{E_i}";

  if (n < 8) {
    return {
      statisticName: "χ² Bondad de Ajuste",
      statisticSymbol: "χ²",
      statisticValue: 0,
      pValue: 1.0,
      isNormal: true,
      interpretation: "Se requieren al menos 8 datos para la prueba χ² de bondad de ajuste.",
      formula
    };
  }

  const min = sortedData[0];
  const max = sortedData[n - 1];
  const range = max - min;

  if (range === 0 || sd === 0) {
    return {
      statisticName: "χ² Bondad de Ajuste",
      statisticSymbol: "χ²",
      statisticValue: 0,
      pValue: 0,
      isNormal: false,
      interpretation: "Varianza cero o datos constantes. No siguen una distribución normal.",
      formula
    };
  }

  // Determine number of bins (Sturges' rule as default)
  const k = binsCount || Math.max(4, Math.ceil(1 + Math.log2(n)));
  const binWidth = range / k;
  
  // Create bins and count observed frequencies
  const observed: number[] = new Array(k).fill(0);
  for (let i = 0; i < n; i++) {
    let idx = Math.floor((sortedData[i] - min) / binWidth);
    if (idx >= k) idx = k - 1;
    if (idx < 0) idx = 0;
    observed[idx]++;
  }

  // Calculate expected frequencies under normality
  const expected: number[] = [];
  let chiSquare = 0;

  for (let i = 0; i < k; i++) {
    const lower = min + i * binWidth;
    const upper = lower + binWidth;
    const cdfLower = stdNormalCDF((lower - mean) / sd);
    const cdfUpper = stdNormalCDF((upper - mean) / sd);
    const prob = cdfUpper - cdfLower;
    const expFreq = Math.max(prob * n, 0.01); // avoid division by zero
    expected.push(expFreq);
    
    if (expFreq > 0) {
      chiSquare += Math.pow(observed[i] - expFreq, 2) / expFreq;
    }
  }

  // Degrees of freedom: k - 1 - 2 (estimated μ and σ from sample)
  const df = Math.max(1, k - 3);
  const pValue = 1 - chiSquareCDF(chiSquare, df);

  return {
    statisticName: "χ² Bondad de Ajuste (Pearson)",
    statisticSymbol: "χ²",
    statisticValue: chiSquare,
    pValue: pValue,
    isNormal: pValue > 0.05,
    interpretation: pValue > 0.05
      ? "No se rechaza la hipótesis nula (p > 0.05). Las frecuencias observadas no difieren significativamente de las esperadas bajo normalidad."
      : "Se rechaza la hipótesis nula (p ≤ 0.05). Las frecuencias observadas difieren significativamente de lo esperado bajo una distribución normal.",
    formula
  };
}
