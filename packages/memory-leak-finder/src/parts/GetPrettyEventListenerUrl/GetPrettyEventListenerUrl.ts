import type { Dynamic } from '../Types/Types.ts'
export const getPrettyEventListenerUrl = (url: Dynamic) => {
  if (url.startsWith('/')) {
    return url.slice(1)
  }
  if (url.startsWith('vscode-file://vscode-app')) {
    return `file://` + url.slice('vscode-file://vscode-app'.length)
  }
  return url
}
