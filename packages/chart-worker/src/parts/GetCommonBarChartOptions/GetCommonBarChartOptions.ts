export const getCommonBarChartOptions = (dataCount: number, options: any) => {
  const marginLeft = options.marginLeft || 250
  const marginRight = options.marginRight || 250
  const fontSize = options.fontSize || 7
  const width = options.width || 640
  const fixedBarHeight = 20 // Fixed height for each bar
  const marginTop = options.marginTop || 20
  const marginBottom = options.marginBottom || 50
  // Use a reasonable height that scales with data count but caps single bars
  const minHeight = 100 // Minimum height for single bars
  const maxHeight = 800 // Maximum height for many bars
  const calculatedHeight = dataCount * fixedBarHeight + marginTop + marginBottom
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
