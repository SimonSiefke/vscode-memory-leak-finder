import * as CreateChat from '../CreateChart/CreateChart.ts'
import * as CreateBarChart from '../CreateBarChart/CreateBarChart.ts'

export const commandMap = {
  'Chart.create': CreateChat.createChart,
  'Chart.createBarChart': CreateBarChart.createBarChart,
}
