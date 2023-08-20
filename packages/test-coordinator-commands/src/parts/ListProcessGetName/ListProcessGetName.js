import * as Assert from '../Assert/Assert.js'

export const getName = (pid, cmd, rootPid) => {
  Assert.object(process)
  Assert.number(rootPid)
  if (pid === rootPid) {
    return 'main'
  }
  if (cmd.includes('--type=zygote')) {
    return 'zygote'
  }
  if (cmd.includes('--type=gpu-process')) {
    return 'gpu-process'
  }
  if (cmd.includes('--type=utility')) {
    return 'utility'
  }
  if (cmd.includes('extensionHostMain.js')) {
    return 'extension-host'
  }
  if (cmd.includes('ptyHostMain.js')) {
    return 'pty-host'
  }
  if (cmd.includes('--lvce-window-kind=process-explorer')) {
    return 'process-explorer'
  }
  if (cmd.includes('--type=renderer')) {
    return `renderer`
  }
  if (cmd.includes('typescript/lib/tsserver.js')) {
    return 'tsserver.js'
  }
  return `<unknown> ${cmd}`
}
