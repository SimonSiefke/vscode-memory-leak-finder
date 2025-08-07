import * as GenerateCharts from '../GenerateCharts/GenerateCharts.ts'
import * as GenerateIndexHtml from '../GenerateIndexHtml/GenerateIndexHtml.ts'

export const main = async () => {
  await GenerateCharts.generateCharts()
  await GenerateIndexHtml.generateIndexHtml()
}
