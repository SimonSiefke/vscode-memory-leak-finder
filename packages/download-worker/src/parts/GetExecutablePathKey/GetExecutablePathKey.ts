export const getExecutablePathKey = (platform: string): string => {
  switch (platform) {
    case 'darwin':
      return 'mac'
    case 'linux':
      return 'linux'
    case 'win32':
      return 'win'
    default:
      return ''
  }
}
