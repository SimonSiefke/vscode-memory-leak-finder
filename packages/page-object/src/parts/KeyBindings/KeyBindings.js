const isMacos = process.platform === 'darwin'

export const OpenQuickPickCommands = isMacos ? 'Meta+Shift+P' : 'Control+Shift+P'
export const OpenQuickPickFiles = isMacos ? 'Meta+P' : 'Control+P'
export const Escape = 'Escape'
export const F2 = 'F2'
export const ArrowDown = 'ArrowDown'
export const ArrowUp = 'ArrowUp'
export const Copy = isMacos ? 'Meta+C' : 'Control+C'
export const CloseTab = isMacos ? 'Meta+w' : 'Control+w'
