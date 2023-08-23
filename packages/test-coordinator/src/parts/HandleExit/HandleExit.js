import * as LaunchElectron from '../LaunchElectron/LaunchElectron.js'
import * as Logger from '../Logger/Logger.js'

export const handleExit = () => {
  Logger.log('[test-worker] exiting')
  LaunchElectron.cleanup()
}
