import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import * as CreateFunctionCountChart from '../CreateFunctionCountChart/CreateFunctionCountChart.js'
import * as CreateObjectCountChart from '../CreateObjectCountChart/CreateObjectCountChart.js'
import * as Root from '../Root/Root.js'

const visitors = [
  {
    name: 'function-count',
    fn: CreateFunctionCountChart.createFunctionCountChart,
  },
  {
    name: 'object-count',
    fn: CreateObjectCountChart.createFunctionCountChart,
  },
]

export const generateCharts = async () => {
  for (const visitor of visitors) {
    const svg = await visitor.fn()
    const outPath = join(Root.root, '.vscode-charts', `${visitor.name}.svg`)
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, svg)
  }
}
