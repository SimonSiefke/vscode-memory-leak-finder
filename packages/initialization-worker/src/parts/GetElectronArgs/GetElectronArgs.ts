export const getElectronArgs = ({ headlessMode, args = [] }) => {
  const allArgs: string[] = [...args]
  if (headlessMode) {
    allArgs.unshift('--headless')
  }
  allArgs.unshift('--inspect-brk=0', '--remote-debugging-port=0')
  return allArgs
}
