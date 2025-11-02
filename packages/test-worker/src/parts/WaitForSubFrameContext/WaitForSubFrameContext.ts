import { DevtoolsProtocolPage } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { waitForSubFrameContextEvent } from '../WaitForSubFrameContextEvent/WaitForSubFrameContextEvent.ts'

const getMatchingSubFrame = (frames, url) => {
  for (const frame of frames) {
    if (url.test(frame.url)) {
      return frame
    }
  }
  return undefined
}

export const waitForSubFrame = async (rpc, urlRegex, timeout) => {
  const controller = new AbortController()
  const eventPromise = waitForSubFrameContextEvent(rpc, urlRegex, timeout, controller.signal)
  await DevtoolsProtocolPage.enable(rpc)
  // const frameResult1 = await DevtoolsProtocolPage.getFrameTree(rpc)
  const subFrame = await eventPromise
  if (!subFrame) {
    throw new Error(`no matching frame found`)
  }
  const frameResult2 = await DevtoolsProtocolPage.getFrameTree(rpc)
  const childFrames2 = frameResult2.frameTree.childFrames.map((item) => item.frame)
  const matchingFrame2 = getMatchingSubFrame(childFrames2, urlRegex)
  await DevtoolsProtocolPage.disable(rpc)
  if (!matchingFrame2) {
    throw new Error(`no matching frame found`)
  }
  return matchingFrame2
}
