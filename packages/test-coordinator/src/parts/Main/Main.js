import * as ParentIpc from '../ParentIpc/ParentIpc.js'

export const main = async () => {
  await ParentIpc.listen()
}
