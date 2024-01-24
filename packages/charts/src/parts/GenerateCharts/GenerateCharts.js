import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import * as CreateFunctionCountChart from '../CreateFunctionCountChart/CreateFunctionCountChart.js'
import * as Root from '../Root/Root.js'

export const generateCharts = async () => {
  const svg = await CreateFunctionCountChart.createFunctionCountChart()
  const outPath = join(Root.root, '.vscode-charts', 'chart.svg')
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, svg)
}
