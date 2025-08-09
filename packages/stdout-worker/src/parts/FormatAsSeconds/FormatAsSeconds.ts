export const formatAsSeconds = (durationInMs: number): string => {
  const durationInSeconds: number = durationInMs / 1000
  return `${durationInSeconds.toFixed(3)} s`
}
