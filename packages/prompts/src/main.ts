import clipboard from 'clipboardy'
import { readFile } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { getPrompt } from './getPrompt.ts'

const { dirname } = import.meta

const root = join(dirname, '..', '..', '..')

const localVscodePath = `/home/simon/.cache/repos/vite`

const relativePath = `/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-memory-leak-finder-results/node-subprocess/instance-counts-difference/node-vite-server-hot-reload.json`
const ourPath = `/home/simon/.cache/repos/vite`
const only = 'node-vite-server-hot-reload'
const runs = 197
const measure = 'instance-count-differences'

const main = async () => {
  const absolutePath = isAbsolute(relativePath) ? relativePath : join(root, relativePath)
  const content = await readFile(absolutePath, 'utf8')
  const prompt = getPrompt({
    content,
    localVscodePath,
    only,
    runs,
    ourPath,
    measure,
  })
  await clipboard.write(prompt)
  process.stdout.write(prompt)
}

main()
