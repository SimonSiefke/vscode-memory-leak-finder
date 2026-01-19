import * as CompressSvg from '../CompressSvg/CompressSvg.ts'
import { createBarChart } from '../CreateBarChart/CreateBarChart.ts'
import { createDefaultChart } from '../CreateDefaultChart/CreateDefaultChart.ts'
import { createDualBarChart } from '../CreateDualBarChart/CreateDualBarChart.ts'

export const createChart = async (data: any, options: any): Promise<string> => {
  let svg: string
  switch (options.type) {
    case 'bar-chart':
      svg = createBarChart(data, options)
      break
    case 'dual-bar-chart':
      svg = createDualBarChart(data, options)
      break
    default:
      svg = createDefaultChart(data, options)
      break
  }

  if (options.compress) {
    try {
      return await CompressSvg.compressSvg(svg)
    } catch (error) {
      console.error('SVG compression failed, returning uncompressed SVG:', error)
      return svg
    }
  }

  return svg
}
