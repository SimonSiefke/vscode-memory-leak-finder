export const getChartConfig = () => {
  const highlightChangesIndex = process.argv.indexOf('--highlight-changes')
  const highlightChangesPath = highlightChangesIndex === -1 ? undefined : process.argv[highlightChangesIndex + 1]
  return {
    compress: true,
    ...(highlightChangesPath ? { highlightChangesPath } : {}),
  }
}
