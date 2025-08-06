import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import * as Charts from '../Charts/Charts.js'
import { launchChartWorker } from '../LaunchChartWorker/LaunchChartWorker.js'
import * as Root from '../Root/Root.js'

const visitors = Object.values(Charts).map((value) => {
  return {
    name: value.name,
    fn: value.createChart,
    getData: value.getData,
  }
})

export const generateCharts = async () => {
  const rpc = await launchChartWorker()
  for (const visitor of visitors) {
    const data = await visitor.getData()
    const chartMetaData = await visitor.fn()
    const svg = await rpc.invoke('Chart.create', data, chartMetaData)
    const outPath = join(Root.root, '.vscode-charts', `${visitor.name}.svg`)
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, svg)
  }
  await rpc[Symbol.asyncDispose]()
}
