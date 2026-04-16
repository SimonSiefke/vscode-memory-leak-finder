import * as IsMacos from '../IsMacos/IsMacos.ts'

export const getOpenQuickPickCommands = (_platform: string): string => {
  return 'F1'
}

export const getOpenQuickPickFiles = (platform: string): string => {
  return IsMacos.isMacos(platform) ? 'Meta+P' : 'Control+P'
}

export const Escape = 'Escape'
export const F1 = 'F1'
export const F2 = 'F2'
export const ArrowDown = 'ArrowDown'
export const ArrowUp = 'ArrowUp'

export const getCopy = (platform: string): string => {
  return IsMacos.isMacos(platform) ? 'Meta+C' : 'Control+C'
}

export const getCloseTab = (platform: string): string => {
  return IsMacos.isMacos(platform) ? 'Meta+w' : 'Control+w'
}
