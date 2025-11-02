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

const getChildFrames = (frameResult) => {
  return frameResult.frameTree.childFrames.map((item) => item.frame)
}

export const waitForSubFrame = async (rpc, urlRegex, timeout) => {
  const controller = new AbortController()
  const eventPromise = waitForSubFrameContextEvent(rpc, urlRegex, timeout, controller.signal)
  await DevtoolsProtocolPage.enable(rpc)
  const frameResult1 = await DevtoolsProtocolPage.getFrameTree(rpc)
  const childFrames1 = getChildFrames(frameResult1)
  const matchingFrame1 = getMatchingSubFrame(childFrames1, urlRegex)
  if (matchingFrame1) {
    controller.abort()
  }
  const subFrame = await eventPromise
  if (!subFrame && !matchingFrame1) {
    throw new Error(`no matching frame found`)
  }
  const frameResult2 = await DevtoolsProtocolPage.getFrameTree(rpc)
  const childFrames2 = getChildFrames(frameResult2)
  const matchingFrame2 = getMatchingSubFrame(childFrames2, urlRegex)
  await DevtoolsProtocolPage.disable(rpc)
  if (!matchingFrame2) {
    throw new Error(`no matching frame found`)
  }
  return matchingFrame2
}
