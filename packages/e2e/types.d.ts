declare const process: {
  platform: 'win32' | 'linux' | 'darwin'
}

export * from './types/pageobject-api.d.ts'

export type { default as TestContext } from './types/pageobject-api.d.ts'

export interface PerformanceScenarioTimingResult {
  readonly actionStartMs: number
  readonly domReadyMs: number
  readonly paintReadyMs: number
  readonly work?: {
    readonly allocations?: Readonly<Record<string, number>>
    readonly functions?: Readonly<Record<string, number>>
  }
}

export interface PerformanceScenario<TContext> {
  readonly mode: 'cold' | 'warm'
  readonly prepare: (context: TContext, iteration: number) => Promise<void>
  readonly action: (context: TContext, iteration: number) => Promise<void>
  readonly ready: (context: TContext, iteration: number) => Promise<void>
  readonly validate: (context: TContext, iteration: number) => Promise<void>
  readonly reset: (context: TContext, iteration: number) => Promise<void>
  readonly timing?: {
    readonly arm: (context: TContext, iteration: number) => Promise<void>
    readonly read: (context: TContext, iteration: number) => Promise<PerformanceScenarioTimingResult>
  }
}
