import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetFunctionCountsData from '../GetFunctionCountsData/GetFunctionCountsData.js'

export const createFunctionCountChart = async () => {
  const data = await GetFunctionCountsData.getFunctionCountsData()
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
  })
}
