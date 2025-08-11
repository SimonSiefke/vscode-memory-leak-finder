import * as PageEventState from '../PageEventState/PageEventState.js'

export const toBeLoaded = async (page) => {
  await PageEventState.waitForEvent({ frameId: page.targetId, name: 'load' })
}
