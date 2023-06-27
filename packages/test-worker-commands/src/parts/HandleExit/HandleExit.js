import * as LaunchElectron from '../LaunchElectron/LaunchElectron.js'

export const handleExit = () => {
  console.log('exiting')
  LaunchElectron.cleanup()
}
