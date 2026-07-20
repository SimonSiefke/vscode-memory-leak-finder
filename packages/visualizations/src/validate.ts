import { access, readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { isMemoryCityDataset } from './model.ts'

export const validateMemoryCityArtifact = async (datasetPath: string): Promise<void> => {
  const value = JSON.parse(await readFile(datasetPath, 'utf8'))
  if (!isMemoryCityDataset(value) || value.revisions.length === 0) {
    throw new Error(`Invalid or empty Memory City dataset at ${datasetPath}`)
  }
  for (const revision of value.revisions) {
    for (const owner of ['renderer', 'extensionHost'] as const) {
      if (revision.owners[owner].buildings.length === 0) {
        throw new Error(`Memory City ${owner} snapshot is empty for ${revision.label}`)
      }
    }
  }
  await access(join(dirname(datasetPath), 'index.html'))
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const datasetPath = resolve(process.argv[2] || '.vscode-charts/memory-city/memory-city.json')
  await validateMemoryCityArtifact(datasetPath)
  console.log(`Validated VS Code Memory City at ${datasetPath}`)
}
