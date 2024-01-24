import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import * as CreateFunctionCountChart from '../CreateFunctionCountChart/CreateFunctionCountChart.js'
import * as Root from '../Root/Root.js'

export const generateCharts = async () => {
  const functionCounts = [
    {
      name: 'test-1',
      functionCount: 90000,
    },
    {
      name: 'test-1',
      functionCount: 95000,
    },
    {
      name: 'test-3',
      functionCount: 110000,
    },
  ]
  const svg = CreateFunctionCountChart.createFunctionCountChart(functionCounts)
  const outPath = join(Root.root, '.vscode-charts', 'chart.svg')
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, svg)
}
