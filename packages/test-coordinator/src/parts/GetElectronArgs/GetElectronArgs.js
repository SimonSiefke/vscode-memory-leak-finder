export const getElectronArgs = ({ headlessMode, args = [] }) => {
  const allArgs = [...args]
  if (headlessMode) {
    allArgs.unshift('--headless')
  }
  allArgs.unshift('--inspect-brk=0', '--remote-debugging-port=8220')
  return allArgs
}
