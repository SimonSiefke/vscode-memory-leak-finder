export const getDisplayname = (extensionName: string): string => {
  return extensionName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}


