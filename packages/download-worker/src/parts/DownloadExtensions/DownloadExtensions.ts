import { join } from 'node:path'
import { downloadAndExtract } from '../DownloadAndExtract/DownloadAndExtract.ts'
import { root } from '../Root/Root.ts'

const urlPlaceHolder = `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/$PUBLISHER/vsextensions/$NAME/$VERSION/vspackage`

const downloadExtension = async (extension) => {
  const { id, version } = extension
  const [publisher, name] = id.split('/')
  const url = urlPlaceHolder.replace('$PUBLISHER', publisher).replace('$NAME', name).replace('$VERSION', version)
  console.log({ url })
  const outDir = join(root, '.vscode-tool-downloads', `${name}-extracted`)
  await downloadAndExtract(name, [url], outDir)
}

export const downloadExtensions = async (extensions) => {
  for (const extension of extensions) {
    await downloadExtension(extension)
  }
}
