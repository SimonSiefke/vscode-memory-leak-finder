import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import prettier from 'prettier'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const registryPath = resolve(root, 'packages/memory-leak-finder/src/parts/Measures/Measures.ts')
const pagePath = resolve(root, 'packages/docs/site/measures/index.md')
const registry = await readFile(registryPath, 'utf8')
const page = await readFile(pagePath, 'utf8')
const rows = [...registry.matchAll(/^export \* as (Measure\w+) from '(\.\.\/[^']+)'/gm)].map(([, exportName, modulePath]) => {
  const name = exportName.slice('Measure'.length)
  const kebabName = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  const sourcePath = modulePath.replace(/^\.\.\//, 'packages/memory-leak-finder/src/parts/')
  const url = `https://github.com/SimonSiefke/vscode-memory-leak-finder/blob/main/${sourcePath}`
  return `| \`${kebabName}\` | [${name}](${url}) |`
})

if (rows.length === 0) throw new Error(`No measures found in ${registryPath}`)
const section = `| CLI-style name | Collector source |\n| --- | --- |\n${rows.join('\n')}`
if (!page.includes('## Registry')) throw new Error(`Registry heading is missing from ${pagePath}`)
const updated = page.replace(/## Registry[\s\S]*$/, `## Registry\n\n${section}\n`)
await writeFile(pagePath, await prettier.format(updated, { filepath: pagePath }))
console.log(`Wrote ${rows.length} registered measures to ${pagePath}`)
