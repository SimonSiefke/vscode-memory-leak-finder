import { expect, test } from '@jest/globals'
import { mkdtemp, mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import * as CollectCallgrindResults from '../src/parts/CollectCallgrindResults/CollectCallgrindResults.ts'

test('collectCallgrindResults - totals multiple files and skips malformed files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vmlf-callgrind-'))
  try {
    const spoolDir = join(dir, 'spool')
    const resultPath = join(dir, 'results', 'callgrind', 'base.json')
    await mkdir(spoolDir, { recursive: true })
    await writeFile(
      join(spoolDir, 'callgrind.out.100'),
      `events: Ir Dr
summary: 100 2
`,
    )
    await writeFile(
      join(spoolDir, 'callgrind.out.200'),
      `events: Dr Ir
summary: 3 250
`,
    )
    await writeFile(join(spoolDir, 'callgrind.out.bad'), `not callgrind`)

    const result = await CollectCallgrindResults.collectCallgrindResults(
      {
        spoolDir,
        vgdbPrefix: 'vmlf-test',
      },
      resultPath,
    )

    expect(result).toMatchObject({
      isLeak: false,
      rawFilePaths: [
        join(dir, 'results', 'callgrind', 'base', 'callgrind.out.100'),
        join(dir, 'results', 'callgrind', 'base', 'callgrind.out.200'),
      ],
      skippedFiles: [join(spoolDir, 'callgrind.out.bad')],
      summary: {
        instructionReferences: 350,
        processCount: 2,
      },
      totalInstructionReferences: 350,
    })
    expect(result.processes).toEqual([
      {
        file: 'callgrind.out.100',
        instructionReferences: 100,
        outputPath: join(dir, 'results', 'callgrind', 'base', 'callgrind.out.100'),
        pid: 100,
      },
      {
        file: 'callgrind.out.200',
        instructionReferences: 250,
        outputPath: join(dir, 'results', 'callgrind', 'base', 'callgrind.out.200'),
        pid: 200,
      },
    ])
    await expect(stat(join(dir, 'results', 'callgrind', 'base', 'callgrind.out.100'))).resolves.toBeTruthy()
  } finally {
    await rm(dir, { force: true, recursive: true })
  }
})

test('collectCallgrindResults - no valid files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'vmlf-callgrind-'))
  try {
    const spoolDir = join(dir, 'spool')
    await mkdir(spoolDir, { recursive: true })
    await writeFile(join(spoolDir, 'callgrind.out.bad'), `not callgrind`)
    await expect(
      CollectCallgrindResults.collectCallgrindResults(
        {
          spoolDir,
          vgdbPrefix: 'vmlf-test',
        },
        join(dir, 'results', 'callgrind', 'base.json'),
      ),
    ).rejects.toThrow(new Error(`No valid Callgrind output files found in ${spoolDir}`))
  } finally {
    await rm(dir, { force: true, recursive: true })
  }
})
