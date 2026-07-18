import { addOmittedEntriesFooter } from '../AddOmittedEntriesFooter/AddOmittedEntriesFooter.ts'

const HeaderHeight = 36
const RowHeight = 54
const BarHeight = 10
const BarGap = 5
const CreatedColor = '#111111'
const CollectedColor = '#B22222'
const CpuColor = '#1565C0'

const escapeXml = (value: string): string => {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

const getBarWidth = (value: number, maxValue: number, width: number): number => {
  if (value <= 0 || maxValue <= 0) {
    return 0
  }
  return (value / maxValue) * width
}

export const createAllocationPerformanceChart = (data: readonly any[], options: any): string => {
  const orderedData = [...data].sort(
    (a, b) =>
      (b.collectedCount || 0) - (a.collectedCount || 0) ||
      (b.createdCount || 0) - (a.createdCount || 0) ||
      (b.sourceSelfTimeMs || 0) - (a.sourceSelfTimeMs || 0),
  )
  const width = options.width || 1600
  const fontSize = options.fontSize || 12
  const marginLeft = options.marginLeft || 500
  const marginRight = options.marginRight || 80
  const gap = 80
  const availableWidth = width - marginLeft - marginRight - gap
  const allocationWidth = availableWidth * 0.58
  const cpuWidth = availableWidth - allocationWidth
  const cpuX = marginLeft + allocationWidth + gap
  const maxAllocationCount = Math.max(
    1,
    ...orderedData.flatMap((item) => [item.createdCount || 0, item.collectedCount || 0]),
  )
  const maxCpuPercent = Math.max(1, ...orderedData.map((item) => item.sourceSelfTimePercent || 0))
  const height = Math.max(HeaderHeight + RowHeight, HeaderHeight + orderedData.length * RowHeight)

  const rows = orderedData
    .map((item, index) => {
      const name = escapeXml(item.name || '')
      const createdCount = item.createdCount || 0
      const collectedCount = item.collectedCount || 0
      const retainedCount = item.retainedCount || 0
      const sourceSelfTimeMs = item.sourceSelfTimeMs || 0
      const sourceSelfTimePercent = item.sourceSelfTimePercent || 0
      const createdWidth = getBarWidth(createdCount, maxAllocationCount, allocationWidth)
      const collectedWidth = getBarWidth(collectedCount, maxAllocationCount, allocationWidth)
      const cpuBarWidth = getBarWidth(sourceSelfTimePercent, maxCpuPercent, cpuWidth)
      const rowTop = HeaderHeight + index * RowHeight
      const createdY = rowTop + 8
      const collectedY = createdY + BarHeight + BarGap
      const cpuY = rowTop + 15
      const labelY = rowTop + RowHeight / 2 + 4
      return `<g data-row-label="${name}">
  <text x="${marginLeft - 8}" y="${labelY}" font-size="${fontSize}" text-anchor="end">${name}</text>
  <rect aria-label="created ${createdCount}" x="${marginLeft}" y="${createdY}" width="${createdWidth}" height="${BarHeight}" rx="2" ry="2" fill="${CreatedColor}" fill-opacity="0.8" />
  <text x="${marginLeft + createdWidth + 4}" y="${createdY + BarHeight - 1}" font-size="${fontSize - 2}">created ${createdCount}</text>
  <rect aria-label="collected ${collectedCount}" x="${marginLeft}" y="${collectedY}" width="${collectedWidth}" height="${BarHeight}" rx="2" ry="2" fill="${CollectedColor}" fill-opacity="0.8" />
  <text x="${marginLeft + collectedWidth + 4}" y="${collectedY + BarHeight - 1}" font-size="${fontSize - 2}">collected ${collectedCount}, retained ${retainedCount}</text>
  <rect aria-label="source CPU self time ${sourceSelfTimeMs} ms ${sourceSelfTimePercent} percent" x="${cpuX}" y="${cpuY}" width="${cpuBarWidth}" height="${BarHeight + 6}" rx="2" ry="2" fill="${CpuColor}" fill-opacity="0.8" />
  <text x="${cpuX + cpuBarWidth + 4}" y="${cpuY + BarHeight + 3}" font-size="${fontSize - 2}">${sourceSelfTimeMs} ms (${sourceSelfTimePercent}%)</text>
</g>`
    })
    .join('')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" fill="currentColor" font-family="system-ui, sans-serif" font-size="${fontSize}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible; background:white"><title>Allocation churn and sampled JavaScript CPU self-time by source file</title><text x="${marginLeft}" y="22" font-size="${fontSize}" font-weight="600">Allocations</text><text x="${cpuX}" y="22" font-size="${fontSize}" font-weight="600">Sampled JavaScript self-time</text>${rows}</svg>`
  return addOmittedEntriesFooter(svg, options)
}
