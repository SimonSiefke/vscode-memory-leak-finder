import { mkdir, writeFile } from 'fs/promises'
import path, { basename, dirname, join, resolve } from 'path'
import { cleanSource } from '../CleanSource/CleanSource.ts'
import { readJson } from '../ReadJson/ReadJson.ts'

export const normalizeSourceMap = async (originalPath: string, outFilePath: string): Promise<void> => {
  const data = await readJson(originalPath)
  const cleanSources = data.sources.map(cleanSource)
  const outDirName = path.dirname(path.dirname(originalPath))
  const hash = basename(originalPath).replace('.js.map.original', '')
  const sourcesPath = join(outDirName, '.vscode-sources', hash)
  if(data.sourcesContent){

    for (let i = 0; i < data.sourcesContent.length; i++) {
      const source = cleanSources[i]
      const sourcePath = resolve(sourcesPath, source)
      if (!sourcePath.startsWith(sourcesPath)) {
        console.log({ sourcesPath, sourcePath })
        throw new Error(`cannot write to file outside of source: ${sourcePath}`)
      }
      await mkdir(dirname(sourcePath), { recursive: true })
      await writeFile(sourcePath, data.sourcesContent[i])
    }
  }

  const newData = {
    ...data,
    sources: cleanSources,
    sourcesContent: [],
  }
  await writeFile(outFilePath, JSON.stringify(newData, null, 2) + '\n')
  // TODO clean names also, some names dont seems to be quite correct
}
