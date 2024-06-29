import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { commandMap } from '../src/parts/CommandMap/CommandMap.js'
import { readFile, writeFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))

const root = join(__dirname, '..', '..', '..')

const fn = commandMap['HeapSnapshot.parseNamedArrayCount']

// const c = await readFile(join(root, '.vscode-heapsnapshots', 'lvce-web.json'), 'utf8')
const c = await readFile(join(root, '.vscode-heapsnapshots', 'array-count.heapsnapshot'), 'utf8')
const v = JSON.parse(c)

console.time('parse')
const r = await fn(v)
console.timeEnd('parse')

await writeFile(join(root, '.vscode-heapsnapshots', 'result.json'), JSON.stringify(r, null, 2) + '\n')