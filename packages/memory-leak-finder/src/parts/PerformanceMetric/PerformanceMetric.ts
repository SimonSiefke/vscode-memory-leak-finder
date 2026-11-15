export interface Metric {
  name: string
  unit: string
  value: number
  coverage: string
  higherIsBetter?: boolean
}

export class UnavailableError extends Error {}
