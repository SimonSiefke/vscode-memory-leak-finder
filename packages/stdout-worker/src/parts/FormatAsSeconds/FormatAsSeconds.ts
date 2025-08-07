export const formatAsSeconds = (durationInMs) => {
  const durationInSeconds = durationInMs / 1000
  return `${durationInSeconds.toFixed(3)} s`
}
