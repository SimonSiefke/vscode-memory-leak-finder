import { VError } from '@lvce-editor/verror'
import { existsSync } from 'fs'
import { rm } from 'fs/promises'
import { join } from 'path'
import * as Download from '../Download/Download.js'
import * as ExtractAppImage from '../ExtractAppImage/ExtractAppImage.js'
import * as MakeExecutable from '../MakeExecutable/MakeExecutable.js'
import * as Root from '../Root/Root.js'

// TODO support macos and windows also and different architecture
const downloadUrl = 'https://dl.todesktop.com/230313mzl4w4u92/versions/0.42.4/linux/zip/x64'

export const downloadAndUnzipCursor = async () => {
  try {
    const outFile = join(Root.root, '.vscode-tool-downloads', 'cursor.AppImage')
    const cursorPath = join(Root.root, '.vscode-tool-downloads', 'squashfs-root', 'cursor')
    if (existsSync(cursorPath)) {
      return cursorPath
    }
    await rm(outFile, { recursive: true, force: true })
    await Download.download('cursor', [downloadUrl], outFile)
    await MakeExecutable.makeExecutable(outFile)
    await ExtractAppImage.extractAppImage(outFile)
    return cursorPath
  } catch (error) {
    throw new VError(error, `Failed to download cursor`)
  }
}
