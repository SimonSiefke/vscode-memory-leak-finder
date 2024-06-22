import { mkdir, writeFile } from 'fs/promises'
import { dirname, join } from 'path'
import * as Charts from '../Charts/Charts.js'
import * as Root from '../Root/Root.js'

const visitors = Object.values(Charts).map((value) => {
  return {
    name: value.name,
    fn: value.createChart,
  }
})

export const generateCharts = async () => {
  for (const visitor of visitors) {
    const svg = await visitor.fn()
    const outPath = join(Root.root, '.vscode-charts', `${visitor.name}.svg`)
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, svg)
  }
}
