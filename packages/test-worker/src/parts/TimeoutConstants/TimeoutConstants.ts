import * as IsWindows from '../IsWindows/IsWindows.ts'
import * as PlatformState from '../PlatformState/PlatformState.ts'

export const getAttachToPage = (): number => {
  const platform = PlatformState.getPlatform()
  return IsWindows.isWindows(platform) ? 5000 : 1000
}

const DefaultExecutionContext = 500
export const PageEvent = 2000
const SessionState = 500
const Target = 8000

export const getUtilityExecutionContext = (): number => {
  const platform = PlatformState.getPlatform()
  return IsWindows.isWindows(platform) ? 16_000 : 8500
}

const InteractiveTime = 120_000
