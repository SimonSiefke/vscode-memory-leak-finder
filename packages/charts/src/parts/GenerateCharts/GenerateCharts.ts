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
    // @ts-ignore
    multiple: value.multiple,
    fn: value.createChart,
    getData: value.getData,
  }
})

export const generateCharts = async () => {
  const rpc = await launchChartWorker()
  
  // Generate charts for both regular and Node.js data
  const basePaths = [
    { path: join(Root.root, '.vscode-memory-leak-finder-results'), isNode: false },
    { path: join(Root.root, '.vscode-memory-leak-finder-results', 'node'), isNode: true }
  ]
  
  for (const basePathInfo of basePaths) {
    for (const visitor of visitors) {
      if (visitor.skip) {
        continue
      }
      
      const data = await visitor.getData(basePathInfo.path)
      if (data.length === 0) {
        continue
      }
      
      const chartMetaData = visitor.fn()
      // @ts-ignore
      if (visitor.multiple) {
        for (let i = 0; i < data.length; i++) {
          const item = data[i]
          // Check if item has filename metadata (new structure) or is just data array (old structure)
          const chartData = item.data || item
          const filename = item.filename || i.toString()

          if (chartData.length > 0) {
            const svg = await rpc.invoke('Chart.create', chartData, chartMetaData)
            let outPath
            if (basePathInfo.isNode) {
              if (visitor.name === 'named-function-count-3') {
                outPath = join(Root.root, '.vscode-charts', 'node', 'named-function-count3', `${filename}.svg`)
              } else {
                outPath = join(Root.root, '.vscode-charts', 'node', visitor.name, `${filename}.svg`)
              }
            } else {
              outPath = join(Root.root, '.vscode-charts', `${visitor.name}/${filename}.svg`)
            }
            await mkdir(dirname(outPath), { recursive: true })
            await writeFile(outPath, svg)
          }
        }
      } else {
        const svg = await rpc.invoke('Chart.create', data, chartMetaData)
        let outPath
        if (basePathInfo.isNode) {
          outPath = join(Root.root, '.vscode-charts', 'node', `${visitor.name}.svg`)
        } else {
          outPath = join(Root.root, '.vscode-charts', `${visitor.name}.svg`)
        }
        await mkdir(dirname(outPath), { recursive: true })
        await writeFile(outPath, svg)
      }
    }
  }
  
  await rpc[Symbol.asyncDispose]()
}
