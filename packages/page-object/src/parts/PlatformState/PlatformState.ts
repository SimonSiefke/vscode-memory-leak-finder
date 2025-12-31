let platform: string | undefined

export const setPlatform = (value: string): void => {
  platform = value
}

export const getPlatform = (): string => {
  if (platform === undefined) {
    throw new Error('Platform not set. Call setPlatform first.')
  }
  return platform
}

