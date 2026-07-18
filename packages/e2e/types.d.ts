declare const process: {
  platform: 'win32' | 'linux' | 'darwin'
}

export * from './types/pageobject-api.d.ts'

export type { default as TestContext } from './types/pageobject-api.d.ts'

export interface PerformanceScenario<TContext> {
  readonly mode: 'cold' | 'warm'
  readonly prepare: (context: TContext, iteration: number) => Promise<void>
  readonly action: (context: TContext, iteration: number) => Promise<void>
  readonly ready: (context: TContext, iteration: number) => Promise<void>
  readonly validate: (context: TContext, iteration: number) => Promise<void>
  readonly reset: (context: TContext, iteration: number) => Promise<void>
}
