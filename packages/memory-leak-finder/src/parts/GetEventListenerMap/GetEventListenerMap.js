import _ from 'lodash'
import { getEventListenersForNode } from '../ChromeDevtoolsProtocol/getEventListenersForNode.js'

// get all dom nodes, even those inside open shadow roots. kind of like `querySelectorAll('*')`
export function getAllDomNodes() {
  const result = []
  // @ts-ignore
  const stack = [...document.querySelectorAll('*')]

  let current
  while ((current = stack.shift())) {
    if (current.shadowRoot) {
      stack.unshift(...current.shadowRoot.querySelectorAll('*'))
    }
    result.push(current)
  }

  return result
}

/**
 *
 * @param {import('@playwright/test').CDPSession} cdpSession
 * @param {string} objectId
 * @returns
 */
const getDescriptors = async (cdpSession, objectId) => {
  // via https://stackoverflow.com/a/67030384
  const { result } = await cdpsession.invoke('Runtime.getProperties', {
    objectId,
  })

  const arrayProps = Object.fromEntries(result.map((_) => [_.name, _.value]))
  const length = arrayProps.length.value
  const descriptors = []

  for (let i = 0; i < length; i++) {
    descriptors.push(arrayProps[i])
  }
  return descriptors
}

// scrub the objects for external consumption, remove unnecessary stuff like objectId
const cleanNode = (node) => {
  return _.pick(node, ['className', 'description'])
}

const cleanListener = (listener) => ({
  // originalHandler seems to contain the same information as handler
  ..._.omit(listener, ['backendNodeId', 'originalHandler']),
  handler: _.omit(listener.handler, ['objectId']),
})

/**
 * @param {import('@playwright/test').CDPSession} session
 */
export const getEventListenerMap = async (session) => {
  const {
    result: { objectId },
  } = await session.invoke('Runtime.evaluate', {
    expression: `(function () {
      ${getAllDomNodes}
      return [...getAllDomNodes(), window, document]
    })()`,
  })

  const nodes = await getDescriptors(session, objectId)
  const nodesWithListeners = await Promise.all(
    nodes.map(async (node) => {
      const listeners = await getEventListenersForNode(session, node)
      return {
        node,
        listeners,
      }
    }),
  )

  // TODO measure leak dom nodes descriptions and leaked event listeners
  return nodesWithListeners
}
