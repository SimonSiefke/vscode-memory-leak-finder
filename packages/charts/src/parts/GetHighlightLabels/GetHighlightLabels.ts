type ChartEntry = {
  readonly name: string
  readonly comparisonKey?: string
}

const isChartEntry = (entry: unknown): entry is ChartEntry => {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    'name' in entry &&
    typeof entry.name === 'string' &&
    (!('comparisonKey' in entry) || typeof entry.comparisonKey === 'string')
  )
}

export const getHighlightLabels = (
  data: readonly unknown[],
  comparisonData: readonly unknown[],
  shouldHighlightChanges: boolean,
): string[] => {
  if (!shouldHighlightChanges) {
    return []
  }
  const comparisonKeys = new Set(comparisonData.filter(isChartEntry).map((item) => item.comparisonKey ?? item.name))
  return data
    .filter(isChartEntry)
    .filter((item) => !comparisonKeys.has(item.comparisonKey ?? item.name))
    .map((item) => item.name)
}
