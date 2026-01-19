import { getFunctionStatistics, trackFunctionCall } from '../TrackFunctionCall/TrackFunctionCall.ts'
import * as TestFrameWork from './TestFrameWork.ts'

export const Commands = {
  boundingBox: TestFrameWork.boundingBox,
  checkHidden: TestFrameWork.checkHidden,
  checkMultiElementCondition: TestFrameWork.checkMultiElementCondition,
  checkSingleElementCondition: TestFrameWork.checkSingleElementCondition,
  checkTitle: TestFrameWork.checkTitle,
  clickExponential: TestFrameWork.clickExponential,
  contentEditableInsert: TestFrameWork.contentEditableInsert,
  count: TestFrameWork.count,
  getAttribute: TestFrameWork.getAttribute,
  getTextContent: TestFrameWork.getTextContent,
  getValue: TestFrameWork.getValue,
  isVisible: TestFrameWork.isVisible,
  mouseDown: TestFrameWork.mouseDown,
  mouseMove: TestFrameWork.mouseMove,
  mouseUp: TestFrameWork.mouseUp,
  performAction: TestFrameWork.performAction,
  performKeyBoardAction: TestFrameWork.performKeyBoardAction,
  pressKey: TestFrameWork.pressKey,
  pressKeyExponential: TestFrameWork.pressKeyExponential,
  showOverlay: TestFrameWork.showOverlay,
  type: TestFrameWork.type,
  typeAndWaitFor: TestFrameWork.typeAndWaitFor,
  trackFunctionCall: trackFunctionCall,
  getFunctionStatistics: getFunctionStatistics,
}
