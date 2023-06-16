const RE_REACT_INTERNAL_FUNCTION_1 =
  /^function \S+\(\S+,\S+,\S+,\S+\){var \S+=\S+,\S+=\S+.transition;\S+.transition=null;try{\S+=1,\S+\(\S+,\S+,\S+,\S+\)}finally{\S+=\S+,\S+.transition=\S+}}$/

const RE_REACT_INTERNAL_FUNCTION_2 =
  /^function \S+\(\S+,\S+,\S+,\S+\)\{\S+\|\|\S+\(\);var \S+=\S+,\S+=\S+;\S+=!0;try\{\S+\(\S+,\S+,\S+,\S+,\S+\)\}finally\{\(\S+=\S+\)\|\|\S+\(\)\}\}$/

const RE_REACT_INTERNAL_FUNCTION_3 =
  /^function \S+\(\S+,\S+,\S+,\S+\){var \S+;if\(\S+\)if\(\(\S+=0==\(4&\S+\)\)&&0<\S+.length&&-1<\S+.indexOf\(\S+\)\)\S+=\S+\(null,\S+,\S+,\S+,\S+\),\S+.push\(\S+\);else{var \S+=\S+\(\S+,\S+,\S+,\S+\);if\(null===\S+\)\S+&&\S+\(\S+,\S+\);else{if\(\S+\){if\(-1<\S+.indexOf\(\S+\)\)return \S+=\S+\(\S+,\S+,\S+,\S+,\S+\),void \S+.push\(\S+\);if\(function\(\S+,\S+,\S+,\S+,\S+\){switch\(\S+\){case\"focusin\":return \S+=\S+\(\S+,\S+,\S+,\S+,\S+,\S+\),!0;case\"dragenter\":return \S+=\S+\(\S+,\S+,\S+,\S+,\S+,\S+\),!0;case\"mouseover\":return \S+=\S+\(\S+,\S+,\S+,\S+,\S+,\S+\),!0;case\"pointerover\":var \S+=\S+.pointerId;return \S+.set\(\S+,\S+\(\S+.get\(\S+\)\|\|null,\S+,\S+,\S+,\S+,\S+\)\),!0;case\"gotpointercapture\":return \S+=\S+.pointerId,\S+.set\(\S+,\S+\(\S+.get\(\S+\)\|\|null,\S+,\S+,\S+,\S+,\S+\)\),!0}return!1}\(\S+,\S+,\S+,\S+,\S+\)\)return;\S+\(\S+,\S+\)}\S+\(\S+,\S+,/

const RE_REACT_INTERNAL_FUNCTION_4 =
  /^function \S+\(\S+,\S+,\S+\){if\(\S+\)if\(0<\S+.length&&-1<\S+.indexOf\(\S+\)\)\S+=\S+\(null,\S+,\S+,\S+\),\S+.push\(\S+\);else{var \S+=\S+\(\S+,\S+,\S+\);null===\S+\?\S+\(\S+,\S+\):-1<\S+.indexOf\(\S+\)\?\(\S+=\S+\(\S+,\S+,\S+,\S+\),\S+.push\(\S+\)\):function\(\S+,\S+,\S+,\S+\){switch\(\S+\){case\"focus\":return \S+=\S+\(\S+,\S+,\S+,\S+,\S+\),!0;case\"dragenter\":return \S+=\S+\(\S+,\S+,\S+,\S+,\S+\),!0;case\"mouseover\":return \S+=\S+\(\S+,\S+,\S+,\S+,\S+\),!0;case\"pointerover\":var \S+=\S+.pointerId;return \S+.set\(\S+,\S+\(\S+.get\(\S+\)\|\|null,\S+,\S+,\S+,\S+\)\),!0;case\"gotpointercapture\":return \S+=\S+.pointerId,\S+.set\(\S+,\S+\(\S+.get\(\S+\)\|\|null,\S+,\S+,\S+,\S+\)\),!0}return!1}\(\S+,\S+,\S+,\S+\)\|\|\(\S+\(\S+,\S+\),\S+\(\S+,\S+,\S+,null\)\)}}/

const RE_REACT_INTERNAL_FUNCTION_5 =
  /^function \S+\(\S+,\S+,\S+,\S+\){if\(\S+\)if\(0<\S+.length&&-1<\S+.indexOf\(\S+\)\)\S+=\S+\(null,\S+,\S+,\S+,\S+\),\S+.push\(\S+\);else{var \S+=\S+\(\S+,\S+,\S+,\S+\);if\(null===\S+\)\S+\(\S+,\S+\);else if\(-1<\S+.indexOf\(\S+\)\)\S+=\S+\(\S+,\S+,\S+,\S+,\S+\),\S+.push\(\S+\);else if\(!function\(\S+,\S+,\S+,\S+,\S+\){switch\(\S+\){case\"focus\":return \S+=\S+\(\S+,\S+,\S+,\S+,\S+,\S+\),!0;case\"dragenter\":return \S+=\S+\(\S+,\S+,\S+,\S+,\S+,\S+\),!0;case\"mouseover\":return \S+=\S+\(\S+,\S+,\S+,\S+,\S+,\S+\),!0;case\"pointerover\":var \S+=\S+.pointerId;return \S+.set\(\S+,\S+\(\S+.get\(\S+\)\|\|null,\S+,\S+,\S+,\S+,\S+\)\),!0;case\"gotpointercapture\":return \S+=\S+.pointerId,\S+.set\(\S+,\S+\(\S+.get\(\S+\)\|\|null,\S+,\S+,\S+,\S+,\S+\)\),!0}return!1}\(\S+,\S+,\S+,\S+,\S+\)\){\S+\(\S+,\S+\),\S+=\S+\(\S+,\S+,null,\S+\);try{\S+\(\S+,\S+\)}finally{\S+\(\S+\)}}}}/

export const isReactInternalFunction = (description) => {
  return (
    RE_REACT_INTERNAL_FUNCTION_1.test(description) ||
    RE_REACT_INTERNAL_FUNCTION_2.test(description) ||
    RE_REACT_INTERNAL_FUNCTION_3.test(description) ||
    RE_REACT_INTERNAL_FUNCTION_4.test(description) ||
    RE_REACT_INTERNAL_FUNCTION_5.test(description)
  )
}
