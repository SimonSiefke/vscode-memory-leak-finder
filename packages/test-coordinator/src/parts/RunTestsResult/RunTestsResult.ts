import type { BisectResult } from '../BisectResult/BisectResult.ts'
import type { RunTestsErrorResult } from '../RunTestsErrorResult/RunTestsErrorResult.ts'
import type { RunTestsSuccessResult } from '../RunTestsSuccessResult/RunTestsSuccessResult.ts'

export type RunTestsResult = RunTestsSuccessResult | RunTestsErrorResult | BisectResult
