import * as Invoke from '../Invoke/Invoke.js'

export const dispatchKeyEvent = (session, options) => Invoke.invoke(session, 'Input.dispatchKeyEvent', options)

export const insertText = (session, options) => Invoke.invoke(session, 'Input.insertText', options)
