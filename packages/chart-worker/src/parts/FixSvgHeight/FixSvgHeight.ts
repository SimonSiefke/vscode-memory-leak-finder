export const fixSvgHeight = (svgHtml: string, dataCount: number): string => {
  // Workaround for single bar charts: adjust SVG height and viewBox
  if (dataCount === 1) {
    return svgHtml
      .replace(/height="[^"]*"/, 'height="20"')
      .replace(/viewBox="[^"]*"/, (match) => {
        const viewBoxMatch = match.match(/viewBox="(\d+) (\d+) (\d+) (\d+)"/)
        if (viewBoxMatch) {
          const [, x, y, width, height] = viewBoxMatch
          return `viewBox="${x} ${y} ${width} 20"`
        }
        return match
      })
  }
  
  return svgHtml
}
