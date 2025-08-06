import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import * as Charts from '../Charts/Charts.js'
import * as Root from '../Root/Root.js'

const visitors = Object.values(Charts).map((value) => {
  return {
    name: value.name,
    fn: value.createChart,
    getData: value.getData,
  }
})

export const generateCharts = async () => {
  console.time('total')
  for (const visitor of visitors) {
    console.time('data')
    const data = await visitor.getData()
    console.timeEnd('data')
    console.time('svg')
    const svg = visitor.fn(data)
    console.timeEnd('svg')
    const outPath = join(Root.root, '.vscode-charts', `${visitor.name}.svg`)
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, svg)
  }
  console.timeEnd('total')
}
