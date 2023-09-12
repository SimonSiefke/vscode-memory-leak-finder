import { join } from 'path'
import * as GetExecutablePath from '../GetExecutablePath/GetExecutablePath.js'
import * as Root from '../Root/Root.js'

export const getFfmpegPath = () => {
  const executablePath = GetExecutablePath.getExecutablePath('ffmpeg')
  return join(Root.root, '.vscode-ffmpeg', ...executablePath)
}
