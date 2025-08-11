import * as Ide from '../Ide/Ide.ts'
import * as KillExistingVscodeInstances from '../KillExistingVscodeInstances/KillExistingVscodeInstances.ts'

export const killExisingIdeInstances = async (ide) => {
  if (ide === Ide.VsCode) {
    await KillExistingVscodeInstances.killExistingVsCodeInstances()
  } else {
    // TODO
  }
}
