export const getElectronArgs = ({ args = [], headlessMode }: { args?: string[]; headlessMode: boolean }): string[] => {
  const allArgs: string[] = [...args]
  if (headlessMode) {
    allArgs.unshift('--headless')
  }
  allArgs.unshift('--inspect-brk=0', '--remote-debugging-port=0')
  return allArgs
}
