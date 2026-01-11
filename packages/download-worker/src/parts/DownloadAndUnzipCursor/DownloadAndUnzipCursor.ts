import { VError } from '@lvce-editor/verror'
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import * as Download from '../Download/Download.ts'
import * as ExtractAppImage from '../ExtractAppImage/ExtractAppImage.ts'
import * as MakeExecutable from '../MakeExecutable/MakeExecutable.ts'
import * as Root from '../Root/Root.ts'

// TODO support macos and windows also and different architecture
const getDownloadUrl = (version: string): string => {
  const downloadUrl = `https://dl.todesktop.com/230313mzl4w4u92/versions/${version}/linux/zip/x64`
  return downloadUrl
}

export const downloadAndUnzipCursor = async (cursorVersion: string): Promise<string> => {
  try {
    const downloadUrl = getDownloadUrl(cursorVersion)
    const outFile = join(Root.root, '.vscode-tool-downloads', 'cursor.AppImage')
    const cursorPath = join(Root.root, '.vscode-tool-downloads', 'squashfs-root', 'cursor')
    if (existsSync(cursorPath)) {
      return cursorPath
    }
    await rm(outFile, { force: true, recursive: true })
    await Download.download('cursor', [downloadUrl], outFile)
    await MakeExecutable.makeExecutable(outFile)
    await ExtractAppImage.extractAppImage(outFile)
    return cursorPath
  } catch (error) {
    throw new VError(error, `Failed to download cursor`)
  }
}
