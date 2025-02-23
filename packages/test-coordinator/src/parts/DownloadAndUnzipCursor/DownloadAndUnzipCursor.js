import { VError } from '@lvce-editor/verror'
import * as Download from '../Download/Download.js'
import * as Root from '../Root/Root.js'
import { join } from 'path'

// TODO support macos and windows also and different architecture
const downloadUrl =
  'https://anysphere-binaries.s3.us-east-1.amazonaws.com/production/client/linux/x64/appimage/Cursor-0.45.15-73dd83bb6f8e3a3704ad8078a8e455ac6d4260d1.deb.glibc2.25-x86_64.AppImage'

export const downloadAndUnzipCursor = async () => {
  try {
    // TODO
    // 1. download the appimage
    // 2. extract the appimage
    // 3. move the appimage contents into workspace folder
    // 4. return binary path

    const outFile = join(Root.root, '.vscode-tool-downloads', 'cursor.AppImage')

    await Download.download('cursor', downloadUrl, outFile)
    console.log('done')
    return ''
  } catch (error) {
    throw new VError(error, `Failed to download cursor`)
  }
}

downloadAndUnzipCursor()
