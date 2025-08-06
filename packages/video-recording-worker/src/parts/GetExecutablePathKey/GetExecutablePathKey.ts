export const getExecutablePathKey = (platform) => {
  switch (platform) {
    case 'linux':
      return 'linux'
    case 'darwin':
      return 'mac'
    case 'win32':
      return 'win'
    default:
      return ''
  }
}
