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
  const eventPromise = waitForSubFrameContextEvent(rpc, urlRegex, timeout)
  await DevtoolsProtocolPage.enable(rpc)
  const subFrame = await eventPromise
  if (!subFrame) {
    throw new Error(`no matching frame found`)
  }
  const { frameTree } = await DevtoolsProtocolPage.getFrameTree(rpc)
  const childFrames = frameTree.childFrames.map((item) => item.frame)
  await DevtoolsProtocolPage.disable(rpc)
  // console.log({ subFrame })

  const matchingFrame = getMatchingSubFrame(childFrames, urlRegex)
  if (!matchingFrame) {
    throw new Error(`no matching frame found`)
  }
  return matchingFrame
}
