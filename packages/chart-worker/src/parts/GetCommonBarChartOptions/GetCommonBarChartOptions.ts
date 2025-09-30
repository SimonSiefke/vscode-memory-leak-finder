export const getCommonBarChartOptions = (dataCount: number, options: any) => {
  const marginLeft = options.marginLeft || 250
  const marginRight = options.marginRight || 250
  const fontSize = options.fontSize || 7
  const width = options.width || 640
  const fixedBarHeight = 20 // Fixed height for each bar
  const marginTop = options.marginTop || -20 // Negative margin to compensate for internal spacing
  const marginBottom = options.marginBottom || -20 // Negative margin to compensate for internal spacing
  // Use a reasonable height that ensures all bars have consistent minimum height
  const minHeight = 50 // Reduced minimum height for single bars
  const maxHeight = 4000 // Increased maximum height for many bars
  const minBarHeight = 12 // Minimum height for each bar to ensure visibility
  const calculatedHeight = dataCount * Math.max(fixedBarHeight, minBarHeight) + marginTop + marginBottom
  const height = Math.max(minHeight, Math.min(maxHeight, calculatedHeight))

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
