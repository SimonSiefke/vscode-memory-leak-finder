import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import escapeHtml from 'escape-html'
import { getInstructionCountResults } from '../GetInstructionCountData/GetInstructionCountData.ts'
import * as Root from '../Root/Root.ts'

export const renderInstructionCountHtml = ({ availability, rows }: Awaited<ReturnType<typeof getInstructionCountResults>>): string => {
  const measured = rows.filter((row) => row.value !== null).length
  const tableRows = rows.map((row) => {
    const path = row.name.split('/').map(encodeURIComponent).join('/')
    const details = `<a href="../cpu-performance-counters/${escapeHtml(path)}.svg">Counters</a>`
    return `<tr><td>${escapeHtml(row.name)}</td><td>${row.value === null ? 'Unavailable' : row.value.toLocaleString('en-US')}</td><td>${details}</td></tr>`
  })
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VS Code instruction counts</title>
  <style>
    body { font: 16px system-ui, sans-serif; margin: 2rem; color: #222; background: white; }
    .chart { overflow-x: auto; }
    table { border-collapse: collapse; }
    th, td { padding: .5rem 1rem; border-bottom: 1px solid #ddd; text-align: left; }
    td:nth-child(2) { text-align: right; font-variant-numeric: tabular-nums; }
  </style>
</head>
<body>
  <h1>VS Code instruction counts</h1>
  <p>Tests ranked by user-space instructions in the inspected process during the scenario. Higher counts indicate more CPU work; they are not evidence of a memory leak.</p>
  <p>CI runs each scenario once, with a fresh VS Code instance per test. Application startup is excluded. Background work and scenario duration can affect the counts. Compare results collected with the same architecture and settings.</p>
  <p>${measured} tests measured; ${rows.length - measured} with unavailable instruction counters. Unavailable values are excluded from the chart.</p>
  ${availability?.available === false ? `<p>Runner counters unavailable: ${escapeHtml(availability.reason || 'Hardware counters are not exposed.')}</p>` : ''}
  <div class="chart"><img src="./all-tests.svg" alt="Instruction counts by test, highest first"></div>
  <table>
    <thead><tr><th>Test</th><th>Instructions</th><th>Details</th></tr></thead>
    <tbody>${tableRows.join('\n')}</tbody>
  </table>
  <p><a href="../index.html">Memory leak charts</a></p>
</body>
</html>`
}

export const generateInstructionCountHtml = async (): Promise<void> => {
  const results = await getInstructionCountResults(join(Root.root, '.vscode-memory-leak-finder-results'))
  if (!results.rows.length && !results.availability) return
  const folder = join(Root.root, '.vscode-charts', 'instruction-count')
  await mkdir(folder, { recursive: true })
  await writeFile(join(folder, 'index.html'), renderInstructionCountHtml(results))
}
