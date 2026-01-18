import { join } from 'node:path'
import * as GetExecutablePath from '../GetExecutablePath/GetExecutablePath.ts'
import * as Root from '../Root/Root.ts'

export const getFfmpegPath = (platform: string) => {
  const executablePath = GetExecutablePath.getExecutablePath(platform, 'ffmpeg')
  return join(Root.root, '.vscode-ffmpeg', ...executablePath)
}
