import * as PageEventState from '../PageEventState/PageEventState.ts'

export const toBeLoaded = async (page: any) => {
  await PageEventState.waitForEvent({ frameId: page.targetId, name: 'load' })
}
