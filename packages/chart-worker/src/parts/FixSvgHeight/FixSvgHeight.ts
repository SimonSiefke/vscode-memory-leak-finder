const HEIGHT_REGEX = /height="(\d+)"/
const VIEWBOX_REGEX = /viewBox="[^"]*"/
const VIEWBOX_MATCH_REGEX = /viewBox="(\d+) (\d+) (\d+) (\d+)"/

export const fixSvgHeight = (svgHtml: string, dataCount: number): string => {
  // Reduce height by 20px for all charts
  const heightMatch = svgHtml.match(HEIGHT_REGEX)
  if (heightMatch) {
    const currentHeight = parseInt(heightMatch[1])
    const newHeight = Math.max(20, currentHeight - 20) // Ensure minimum height of 20px

    return svgHtml.replace(HEIGHT_REGEX, `height="${newHeight}"`).replace(VIEWBOX_REGEX, (match) => {
      const viewBoxMatch = match.match(VIEWBOX_MATCH_REGEX)
      if (viewBoxMatch) {
        const [, x, y, width] = viewBoxMatch
        return `viewBox="${x} ${y} ${width} ${newHeight}"`
      }
      return match
    })
  }

  return svgHtml
}
