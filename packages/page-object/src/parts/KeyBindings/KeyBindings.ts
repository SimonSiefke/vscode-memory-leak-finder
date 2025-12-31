import * as IsMacos from '../IsMacos/IsMacos.ts'

export const getOpenQuickPickCommands = (): string => {
  return IsMacos.isMacos() ? 'Meta+Shift+P' : 'Control+Shift+P'
}

export const getOpenQuickPickFiles = (): string => {
  return IsMacos.isMacos() ? 'Meta+P' : 'Control+P'
}

export const Escape = 'Escape'
export const F2 = 'F2'
export const ArrowDown = 'ArrowDown'
export const ArrowUp = 'ArrowUp'

export const getCopy = (): string => {
  return IsMacos.isMacos() ? 'Meta+C' : 'Control+C'
}

export const getCloseTab = (): string => {
  return IsMacos.isMacos() ? 'Meta+w' : 'Control+w'
}
