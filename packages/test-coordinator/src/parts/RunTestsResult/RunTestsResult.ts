import type { RunTestsSuccessResult } from '../RunTestsSuccessResult/RunTestsSuccessResult.ts'
import type { RunTestsErrorResult } from '../RunTestsErrorResult/RunTestsErrorResult.ts'

export type RunTestsResult = RunTestsSuccessResult | RunTestsErrorResult
