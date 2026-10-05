import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@jest/globals'
import { getData } from '../src/parts/GetPerformanceDiagnosticData/GetPerformanceDiagnosticData.ts'

test('keeps stack labels on one line with distinct identities and full tooltips', async () => {
  const root = await mkdtemp(join(tmpdir(), 'performance-labels-'))
  try {
    await mkdir(join(root, 'example'))
    const first = 'Element.getBoundingClientRect\n    at render (file:///very/long/path/workbench.js:12:34)\n    at firstCaller'
    const second = first.replace('firstCaller', 'secondCaller')
    await writeFile(
      join(root, 'example', 'run.json'),
      JSON.stringify({
        example: {
          rows: [
            { name: first, count: 2 },
            { name: second, count: 1 },
          ],
        },
      }),
    )
    const charts = await getData(root, 'example', 'example')
    const rows = charts[0].data
    expect(rows).toHaveLength(2)
    expect(rows[0].name).not.toContain('\n')
    expect(rows[0].name.length).toBeLessThan(80)
    expect(rows[0].name).toContain('workbench.js:12:34')
    expect(rows[0].name).not.toBe(rows[1].name)
    expect(rows[0].title).toBe(first + ' (count)')
    expect(rows[1].title).toBe(second + ' (count)')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
