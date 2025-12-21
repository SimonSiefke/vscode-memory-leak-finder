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
  switch (dataCount) {
    case 1: {
      height = fixedBarHeight * 2

      break
    }
    case 2: {
      height = fixedBarHeight * 2 + fixedBarHeight

      break
    }
    case 3: {
      height = fixedBarHeight * 3 + fixedBarHeight

      break
    }
    case 4: {
      height = fixedBarHeight * 4 + fixedBarHeight

      break
    }
    default: {
      height = Math.max(minHeight, Math.min(maxHeight, calculatedHeight))
    }
  }

  return {
    fixedBarHeight,
    fontSize,
    height,
    marginBottom,
    marginLeft,
    marginRight,
    marginTop,
    width,
  }
}
