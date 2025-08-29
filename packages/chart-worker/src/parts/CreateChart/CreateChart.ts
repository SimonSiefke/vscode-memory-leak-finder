import { createBarChart } from '../CreateBarChart/CreateBarChart.ts'
import { createDefaultChart } from '../CreateDefaultChart/CreateDefaultChart.ts'

export const createChart = (data: any, options: any) => {
  switch (options.type) {
    case 'bar-chart':
      return createBarChart(data, options)
    default:
      return createDefaultChart(data, options)
  }
}
