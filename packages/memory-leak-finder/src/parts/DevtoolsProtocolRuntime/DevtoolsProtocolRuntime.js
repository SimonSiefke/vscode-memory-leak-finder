import * as DevtoolsCommandType from "../DevtoolsCommandType/DevtoolsCommandType.js";
import * as UnwrapDevtoolsEvaluateResult from "../UnwrapDevtoolsEvaluateResult/UnwrapDevtoolsEvaluateResult.js";

/**
 *
 * @param {{expression:string, contextId?:string, generatePreview?:boolean, returnByValue?:boolean, uniqueContextId?:string, allowUnsafeEvalBlockedByCSP?:boolean, arguments?:any[], awaitPromise?:boolean, replMode?:boolean, includeCommandLineAPI?:boolean, objectGroup?:any}} options
 * @returns
 */
export const evaluate = async (session, options) => {
  const rawResult = await session.send(
    DevtoolsCommandType.RuntimeEvaluate,
    options
  );
  const result = UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult);
  return result;
};

/**
 *
 * @param {{functionDeclaration:string, objectId?:string, arguments?:any[], uniqueContextId?:string, executionContextId?:number, awaitPromise?:boolean, returnByValue?:boolean, objectGroup?:string}} options
 * @returns
 */
export const callFunctionOn = async (session, options) => {
  const rawResult = await session.send(
    DevtoolsCommandType.RuntimeCallFunctionOn,
    options
  );
  const result = UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult);
  return result;
};

/**
 *
 * @param {{objectId: string, ownProperties?:boolean, generatePreview?:boolean}} options
 * @returns
 */
export const getProperties = async (session, options) => {
  const rawResult = await session.send(
    DevtoolsCommandType.RuntimeGetProperties,
    options
  );
  const result = UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult);
  return result;
};

/**
 */
export const enable = async (session) => {
  const rawResult = await session.send(DevtoolsCommandType.RuntimeEnable);
  UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult);
};

export const runIfWaitingForDebugger = async (session) => {
  const rawResult = await session.send(
    DevtoolsCommandType.RuntimeRunIfWaitingForDebugger
  );
  UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult);
};

/**
 *
 * @param {{prototypeObjectId:string, objectGroup?:string}} options
 * @returns
 */
export const queryObjects = async (session, options) => {
  const rawResult = await session.send(
    DevtoolsCommandType.RuntimeQueryObjects,
    options
  );
  const result = UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult);
  return result;
};

/**
 *
 * @param {{objectGroup:string}} options
 * @returns
 */
export const releaseObjectGroup = async (session, options) => {
  const rawResult = await session.send(
    DevtoolsCommandType.RuntimeReleaseObjectGroup,
    options
  );
  const result = UnwrapDevtoolsEvaluateResult.unwrapResult(rawResult);
  return result;
};
