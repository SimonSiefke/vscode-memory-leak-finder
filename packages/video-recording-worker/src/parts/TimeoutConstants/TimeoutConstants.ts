import * as IsWindows from '../IsWindows/IsWindows.ts'

export const AttachToPage = IsWindows.IsWindows ? 5000 : 4000
export const DefaultExecutionContext = 500
export const PageEvent = 2000
export const SessionState = 500
export const Target = 8000
export const UtilityExecutionContext = IsWindows.IsWindows ? 16000 : 8500
export const WaitForDebuggerToBePaused = 1000
