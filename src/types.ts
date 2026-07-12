export interface TestResult {
  statisticName: string;
  statisticSymbol: string;
  statisticValue: number;
  pValue: number;
  isNormal: boolean;
  interpretation: string;
  formula: string;
}

export interface DataSummary {
  n: number;
  mean: number;
  sd: number;
  median: number;
  min: number;
  max: number;
  skewness: number;
  kurtosis: number;
  excessKurtosis: number;
  variance: number;
}

export interface Bin {
  index: number;
  x0: number;
  x1: number;
  count: number;
  density: number;
}

export interface SampleDataset {
  name: string;
  description: string;
  data: number[];
}
