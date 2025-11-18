export const getCommonBarChartOptions = (dataCount: number, options: any) => {
  const marginLeft = options.marginLeft || 250
  const marginRight = options.marginRight || 250
  const fontSize = options.fontSize || 7
  const width = options.width || 640
  const fixedBarHeight = 20 // Fixed height for each bar
  const marginTop = 0 // Zero margin to minimize spacing
  const marginBottom = 0 // Zero margin to minimize spacing
  // Use a reasonable height that ensures all bars have consistent minimum height
  const minHeight = 20 // Further reduced minimum height for single bars
  const maxHeight = 400_000 // Increased maximum height for many bars
  const minBarHeight = 12 // Minimum height for each bar to ensure visibility
  const calculatedHeight = dataCount * Math.max(fixedBarHeight, minBarHeight) // + marginTop + marginBottom

  let height = 0
  if (dataCount === 1) {
    height = fixedBarHeight * 2
  } else if (dataCount === 2) {
    height = fixedBarHeight * 2 + fixedBarHeight
  } else if (dataCount === 3) {
    height = fixedBarHeight * 3 + fixedBarHeight
  } else if (dataCount === 4) {
    height = fixedBarHeight * 4 + fixedBarHeight
  } else {
    height = Math.max(minHeight, Math.min(maxHeight, calculatedHeight))
  }

  return {
    marginLeft,
    marginRight,
    fontSize,
    width,
    height,
    fixedBarHeight,
    marginTop,
    marginBottom,
  }
}
