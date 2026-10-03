import type { Dynamic } from '../Types/Types.ts'
export const getSampleTiming = (profile: Dynamic) => {
  const samples = Array.isArray(profile?.samples) ? profile.samples : []
  const elapsedTimeMs =
    typeof profile?.startTime === 'number' &&
    typeof profile?.endTime === 'number' &&
    Number.isFinite(profile.endTime - profile.startTime) &&
    profile.endTime >= profile.startTime
      ? (profile.endTime - profile.startTime) / 1000
      : null
  const deltas = profile?.timeDeltas
  const estimated =
    !Array.isArray(deltas) ||
    deltas.length < samples.length ||
    deltas.slice(0, samples.length).some((value: unknown) => typeof value !== 'number' || !Number.isFinite(value) || value < 0)
  const times: number[] = estimated
    ? samples.map(() => (samples.length ? (elapsedTimeMs || 0) / samples.length : 0))
    : deltas.slice(0, samples.length).map((value: number) => value / 1000)
  return { times, estimated, elapsedTimeMs }
}
