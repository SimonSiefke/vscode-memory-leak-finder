let platform: string = ''

export const setPlatform = (newPlatform: string): void => {
  platform = newPlatform
}

export const getPlatform = (): string => {
  return platform
}
