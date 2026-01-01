import { cp } from 'node:fs/promises'
import { platform } from 'node:os'
import { join } from 'node:path'
import { downloadAndExtract } from '../DownloadAndExtract/DownloadAndExtract.ts'
import { root } from '../Root/Root.ts'

const urlPlaceHolder = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/$PUBLISHER/vsextensions/$NAME/$VERSION/vspackage`

const downloadExtension = async (extension: { id: string; version: string }) => {
  const { id, version } = extension
  const [publisher, name] = id.split('/')
  const publisherLower = publisher.toLowerCase()
  const url = urlPlaceHolder.replace('$PUBLISHER', publisher).replace('$NAME', name).replace('$VERSION', version)
  console.info(`[download worker] Downloading extension ${id}`)
  const outDir = join(root, '.vscode-tool-downloads', `${name}-extracted`)
  await downloadAndExtract(platform(), name, [url], outDir)
  await cp(join(outDir, 'extension'), join(root, '.vscode-extensions', `${publisherLower}.${name}-${version}`), {
    recursive: true,
  })
}

export const downloadExtensions = async (extensions: Array<{ id: string; version: string }>) => {
  for (const extension of extensions) {
    await downloadExtension(extension)
  }
}
