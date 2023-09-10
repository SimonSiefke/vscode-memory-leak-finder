import { join } from 'path'
import * as Root from '../Root/Root.js'

export const getFfmpegPath = () => {
  return join(Root.root, '.vscode-ffmpeg', 'ffmpeg-linux')
}
