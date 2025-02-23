import { VError } from '@lvce-editor/verror'
import * as Download from '../Download/Download.js'
import * as Root from '../Root/Root.js'
import * as MakeExecutable from '../MakeExecutable/MakeExecutable.js'
import * as ExtractAppImage from '../ExtractAppImage/ExtractAppImage.js'
import { join } from 'path'
import { rm } from 'fs/promises'
import { existsSync } from 'fs'

// TODO support macos and windows also and different architecture
const downloadUrl = 'https://dl.todesktop.com/230313mzl4w4u92/versions/0.42.4/linux/zip/x64'

export const downloadAndUnzipCursor = async () => {
  try {
    // TODO
    // 1. download the appimage
    // 2. extract the appimage
    // 3. move the appimage contents into workspace folder
    // 4. return binary path

    const outFile = join(Root.root, '.vscode-tool-downloads', 'cursor.AppImage')
    if (!existsSync(outFile)) {
      await rm(outFile, { recursive: true, force: true })
      await Download.download('cursor', downloadUrl, outFile)
    }
    await MakeExecutable.makeExecutable(outFile)
    await ExtractAppImage.extractAppImage(outFile)
    console.log('done')
    return ''
  } catch (error) {
    throw new VError(error, `Failed to download cursor`)
  }
}

downloadAndUnzipCursor()
