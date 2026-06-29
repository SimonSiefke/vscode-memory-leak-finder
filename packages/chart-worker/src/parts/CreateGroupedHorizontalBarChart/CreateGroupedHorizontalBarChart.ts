import { addRowHighlights } from '../AddRowHighlights/AddRowHighlights.ts'
import { getCommonBarChartOptions } from '../GetCommonBarChartOptions/GetCommonBarChartOptions.ts'

const CREATED_COLOR = '#111111'
const COLLECTED_COLOR = '#B22222'
const ROW_HEIGHT = 44
const BAR_HEIGHT = 12
const BAR_GAP = 6

const escapeXml = (value: string): string => {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

const getBarWidth = (value: number, maxValue: number, plotWidth: number): number => {
  if (value <= 0 || maxValue <= 0) {
    return 0
  }
  return (value / maxValue) * plotWidth
}

export const createGroupedHorizontalBarChart = (data: any, options: any): string => {
  const orderedData = [...data].sort((a: any, b: any) => (b.created || 0) - (a.created || 0) || (b.collected || 0) - (a.collected || 0))
  const dataCount = orderedData.length
  const chartOptions = {
    ...getCommonBarChartOptions(dataCount, options),
    height: Math.max(ROW_HEIGHT, dataCount * ROW_HEIGHT),
  }
  const plotWidth = chartOptions.width - chartOptions.marginLeft - chartOptions.marginRight
  const maxValue = Math.max(1, ...orderedData.flatMap((item: any) => [item.created || 0, item.collected || 0]))

  const rows = orderedData
    .map((item: any, index: number) => {
      const name = escapeXml(item.name || '')
      const created = item.created || 0
      const collected = item.collected || 0
      const createdWidth = getBarWidth(created, maxValue, plotWidth)
      const collectedWidth = getBarWidth(collected, maxValue, plotWidth)
      const rowTop = index * ROW_HEIGHT
      const createdY = rowTop + 7
      const collectedY = createdY + BAR_HEIGHT + BAR_GAP
      const labelY = rowTop + ROW_HEIGHT / 2 + 4
      return `<g data-row-label="${name}">
  <text x="${chartOptions.marginLeft - 8}" y="${labelY}" font-size="${chartOptions.fontSize}" text-anchor="end">${name}</text>
  <rect aria-label="created ${created}" x="${chartOptions.marginLeft}" y="${createdY}" width="${createdWidth}" height="${BAR_HEIGHT}" rx="2" ry="2" fill="${CREATED_COLOR}" fill-opacity="0.75" />
  <text x="${chartOptions.marginLeft + createdWidth + 4}" y="${createdY + BAR_HEIGHT - 2}" font-size="${chartOptions.fontSize - 2}">created ${created}</text>
  <rect aria-label="collected ${collected}" x="${chartOptions.marginLeft}" y="${collectedY}" width="${collectedWidth}" height="${BAR_HEIGHT}" rx="2" ry="2" fill="${COLLECTED_COLOR}" fill-opacity="0.75" />
  <text x="${chartOptions.marginLeft + collectedWidth + 4}" y="${collectedY + BAR_HEIGHT - 2}" font-size="${chartOptions.fontSize - 2}">collected ${collected}</text>
</g>`
    })
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" fill="currentColor" font-family="system-ui, sans-serif" font-size="${chartOptions.fontSize}" width="${chartOptions.width}" height="${chartOptions.height}" viewBox="0 0 ${chartOptions.width} ${chartOptions.height}" style="overflow: visible; background:white"><title>Created and collected allocations by file</title>${rows}</svg>`
  return addRowHighlights(svg, orderedData, chartOptions, options)
}
