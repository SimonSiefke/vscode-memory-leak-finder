import * as Ide from '../Ide/Ide.js'
import * as KillExistingVscodeInstances from '../KillExistingVscodeInstances/KillExistingVscodeInstances.js'

export const killExisingIdeInstances = async (ide) => {
  if (ide === Ide.VsCode) {
    await KillExistingVscodeInstances.killExistingVsCodeInstances()
  } else {
    // TODO
  }
}
