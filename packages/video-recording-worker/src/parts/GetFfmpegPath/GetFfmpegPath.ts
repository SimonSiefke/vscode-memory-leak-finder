import { join } from 'path'
import * as GetExecutablePath from '../GetExecutablePath/GetExecutablePath.ts'
import * as Root from '../Root/Root.ts'

export const getFfmpegPath = () => {
  const executablePath = GetExecutablePath.getExecutablePath('ffmpeg')
  return join(Root.root, '.vscode-ffmpeg', ...executablePath)
}
