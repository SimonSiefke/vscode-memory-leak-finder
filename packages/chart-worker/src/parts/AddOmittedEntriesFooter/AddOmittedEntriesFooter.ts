const HEIGHT_REGEX = /height="(\d+)"/
const VIEWBOX_REGEX = /viewBox="([^"]*)"/
const FOOTER_HEIGHT = 28
const FOOTER_FONT_SIZE = 12

const getViewBoxWithHeight = (viewBox: string, height: number): string => {
  const parts = viewBox.split(' ')
  if (parts.length !== 4) {
    return viewBox
  }
  return `${parts[0]} ${parts[1]} ${parts[2]} ${height}`
}

export const addOmittedEntriesFooter = (svg: string, options: any): string => {
  const omittedEntryCount = options.omittedEntryCount || 0
  if (omittedEntryCount <= 0) {
    return svg
  }
  const heightMatch = svg.match(HEIGHT_REGEX)
  if (!heightMatch) {
    return svg
  }
  const currentHeight = Number.parseInt(heightMatch[1])
  const newHeight = currentHeight + FOOTER_HEIGHT
  const label = `${omittedEntryCount} entries omitted for brevity`
  const footerY = currentHeight + FOOTER_FONT_SIZE + 4
  const footer = `<text x="8" y="${footerY}" font-size="${FOOTER_FONT_SIZE}" fill="#5f6368">${label}</text>`
  return svg
    .replace(HEIGHT_REGEX, `height="${newHeight}"`)
    .replace(VIEWBOX_REGEX, (_match, viewBox) => `viewBox="${getViewBoxWithHeight(viewBox, newHeight)}"`)
    .replace('</svg>', `${footer}</svg>`)
}
