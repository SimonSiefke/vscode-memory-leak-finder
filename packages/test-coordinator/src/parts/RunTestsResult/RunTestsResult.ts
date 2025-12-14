import type { RunTestsSuccessResult } from '../RunTestsSuccessResult/RunTestsSuccessResult.ts'
import type { RunTestsErrorResult } from '../RunTestsErrorResult/RunTestsErrorResult.ts'
import type { BisectResult } from '../BisectResult/BisectResult.ts'

export type RunTestsResult = RunTestsSuccessResult | RunTestsErrorResult | BisectResult
