import * as GenerateCharts from '../GenerateCharts/GenerateCharts.js'
import * as GenerateIndexHtml from '../GenerateIndexHtml/GenerateIndexHtml.js'

export const main = async () => {
  await GenerateCharts.generateCharts()
  await GenerateIndexHtml.generateIndexHtml()
}
