import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import * as Charts from '../Charts/Charts.ts'
import { launchChartWorker } from '../LaunchChartWorker/LaunchChartWorker.ts'
import * as Root from '../Root/Root.ts'

const visitors = Object.values(Charts).map((value) => {
  return {
    name: value.name,
    // @ts-ignore
    skip: value.skip,
    fn: value.createChart,
    getData: value.getData,
  }
})

export const generateCharts = async () => {
  const rpc = await launchChartWorker()
  for (const visitor of visitors) {
    if (visitor.skip) {
      continue
    }
    const data = await visitor.getData()
    const chartMetaData = visitor.fn()
    // @ts-ignore
    if (visitor.multiple) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        const svg = await rpc.invoke('Chart.create', item, chartMetaData)
        const outPath = join(Root.root, '.vscode-charts', `${visitor.name}-${i}.svg`)
        await mkdir(dirname(outPath), { recursive: true })
        await writeFile(outPath, svg)
      }
    } else {
      const svg = await rpc.invoke('Chart.create', data, chartMetaData)
      const outPath = join(Root.root, '.vscode-charts', `${visitor.name}.svg`)
      await mkdir(dirname(outPath), { recursive: true })
      await writeFile(outPath, svg)
    }
  }
  await rpc[Symbol.asyncDispose]()
}
