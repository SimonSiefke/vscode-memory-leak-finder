import type { RunTestsOptions } from '../RunTestsOptions/RunTestsOptions.ts'

export interface BisectOptions extends RunTestsOptions {
  readonly checkLeaks: true
}

