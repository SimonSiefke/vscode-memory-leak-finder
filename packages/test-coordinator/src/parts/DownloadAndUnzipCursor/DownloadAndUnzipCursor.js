import { VError } from '@lvce-editor/verror'
import * as Download from '../Download/Download.js'
import * as Root from '../Root/Root.js'
import * as MakeExecutable from '../MakeExecutable/MakeExecutable.js'
import * as ExtractAppImage from '../ExtractAppImage/ExtractAppImage.js'
import { join } from 'path'
import { rm } from 'fs/promises'
import { existsSync } from 'fs'

// TODO support macos and windows also and different architecture
const downloadUrl = 'https://dl.todesktop.com/230313mzl4w4u92/versions/0.42.4/linulx/zip/x64'

export const downloadAndUnzipCursor = async () => {
  try {
    const outFile = join(Root.root, '.vscode-tool-downloads', 'cursor.AppImage')
    if (!existsSync(outFile)) {
      await rm(outFile, { recursive: true, force: true })
      await Download.download('cursor', downloadUrl, outFile)
    }
    await MakeExecutable.makeExecutable(outFile)
    await ExtractAppImage.extractAppImage(outFile)
    const cursorPath = join(Root.root, '.vscode-tool-downloads', 'squashfs-root', 'cursor')
    return cursorPath
  } catch (error) {
    throw new VError(error, `Failed to download cursor`)
  }
}
