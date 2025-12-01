import { createBarChart } from '../CreateBarChart/CreateBarChart.ts'
import { createDualBarChart } from '../CreateDualBarChart/CreateDualBarChart.ts'
import { createDefaultChart } from '../CreateDefaultChart/CreateDefaultChart.ts'

export const createChart = (data: any, options: any) => {
  switch (options.type) {
    case 'bar-chart':
      return createBarChart(data, options)
    case 'dual-bar-chart':
      return createDualBarChart(data, options)
    default:
      return createDefaultChart(data, options)
  }
}
