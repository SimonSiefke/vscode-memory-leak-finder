import * as CreateChart from '../CreateChart/CreateChart.js'
import * as GetObjectCountsData from '../GetObjectCountsData/GetObjectCountsData.js'

export const createFunctionCountChart = async () => {
  const data = await GetObjectCountsData.getObjectCountsData()
  return CreateChart.createChart(data, {
    x: 'index',
    y: 'count',
    xLabel: 'Index',
    yLabel: 'Object Count',
  })
}
