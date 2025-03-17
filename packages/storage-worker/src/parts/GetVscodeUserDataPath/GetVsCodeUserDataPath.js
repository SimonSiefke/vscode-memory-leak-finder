import { homedir } from 'os'
import path from 'path'

const fallback = () => {
  return path.join(homedir(), '.config/Code')
}

export const getVscodeUserDataPath = () => {
  return process.env.VSCODE_USER_DATA_PATH || fallback()
}
