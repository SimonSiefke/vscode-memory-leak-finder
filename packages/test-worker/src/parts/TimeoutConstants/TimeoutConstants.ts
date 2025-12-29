import * as IsWindows from '../IsWindows/IsWindows.ts'

const AttachToPage = IsWindows.IsWindows ? 5000 : 1000
const DefaultExecutionContext = 500
export const PageEvent = 2000
const SessionState = 500
const Target = 8000
const UtilityExecutionContext = IsWindows.IsWindows ? 16_000 : 8500
const InteractiveTime = 120_000
