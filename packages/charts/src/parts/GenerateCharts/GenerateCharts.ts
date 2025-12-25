import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import * as Charts from '../Charts/Charts.ts'
import { launchChartWorker } from '../LaunchChartWorker/LaunchChartWorker.ts'
import * as Root from '../Root/Root.ts'

const visitors = Object.values(Charts).map((value) => {
  return {
    fn: value.createChart,
    getData: value.getData,
    // @ts-ignore
    multiple: value.multiple,
    name: value.name,
    // @ts-ignore
    skip: value.skip,
  }
})

export const generateCharts = async () => {
  await using rpc = await launchChartWorker()

  // Generate charts for all process types
  const basePaths = [
    { isNode: false, path: join(Root.root, '.vscode-memory-leak-finder-results'), processType: 'main' },
    { isNode: true, path: join(Root.root, '.vscode-memory-leak-finder-results', 'node'), processType: 'node' },
    { isNode: false, path: join(Root.root, '.vscode-memory-leak-finder-results', 'shared-process'), processType: 'shared-process' },
    { isNode: false, path: join(Root.root, '.vscode-memory-leak-finder-results', 'extension-host'), processType: 'extension-host' },
    { isNode: false, path: join(Root.root, '.vscode-memory-leak-finder-results', 'pty-host'), processType: 'pty-host' },
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
                outPath = join(Root.root, '.vscode-charts', 'node', 'named-function-count-3', `${filename}.svg`)
              } else {
                outPath = join(Root.root, '.vscode-charts', 'node', visitor.name, `${filename}.svg`)
              }
            } else if (basePathInfo.processType === 'main') {
              outPath = join(Root.root, '.vscode-charts', `${visitor.name}/${filename}.svg`)
            } else {
              outPath = join(Root.root, '.vscode-charts', basePathInfo.processType, visitor.name, `${filename}.svg`)
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
        } else if (basePathInfo.processType === 'main') {
          outPath = join(Root.root, '.vscode-charts', `${visitor.name}.svg`)
        } else {
          outPath = join(Root.root, '.vscode-charts', basePathInfo.processType, `${visitor.name}.svg`)
        }
        await mkdir(dirname(outPath), { recursive: true })
        await writeFile(outPath, svg)
      }
    }
  }
}
