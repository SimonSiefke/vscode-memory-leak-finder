export const getCommonBarChartOptions = (dataCount: number, options: any) => {
  const marginLeft = options.marginLeft || 250
  const marginRight = options.marginRight || 250
  const fontSize = options.fontSize || 7
  const width = options.width || 640
  const fixedBarHeight = 20 // Fixed height for each bar
  const marginTop = options.marginTop || 50
  const marginBottom = options.marginBottom || 50
  const height = dataCount * fixedBarHeight + marginTop + marginBottom

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
