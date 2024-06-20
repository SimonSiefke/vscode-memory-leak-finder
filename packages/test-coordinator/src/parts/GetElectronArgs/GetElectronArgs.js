export const getElectronArgs = ({ headlessMode, args = [] }) => {
  const allArgs = [...args]
  if (headlessMode) {
    allArgs.unshift('--headless')
  }
  allArgs.unshift('--inspect-brk=9229', '--remote-debugging-port=0')
  return allArgs
}
