export const formatAsSeconds = (durationInMs: number): string => {
  const durationInSeconds = durationInMs / 1000
  return `${durationInSeconds.toFixed(3)} s`
}
