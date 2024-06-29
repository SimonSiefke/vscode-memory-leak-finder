import * as CommandMap from '../src/parts/CommandMap/CommandMap.js'
import { readFile, writeFile } from 'fs/promises'

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const root = join(__dirname, '..', '..', '..')
const snapshotPath = join(root, '.vscode-heapsnapshots', 'lvce-web.json')
const snapshotContent = await readFile(snapshotPath, 'utf8')
const snapshot = JSON.parse(snapshotContent)

const fn = CommandMap.commandMap['HeapSnapshot.parseNamedArrayCount']
// const fn = CommandMap.commandMap['HeapSnapshot.parseObjectShapeCount']

console.time('parse')
const result = await fn(snapshot)
console.timeEnd('parse')

const outPath = join(root, '.vscode-heapsnapshots', 'result.json')
const resultContent = JSON.stringify(result, null, 2) + '\n'
await writeFile(outPath, resultContent)
// console.log({ result })
