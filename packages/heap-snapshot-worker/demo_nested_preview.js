import { getObjectsWithPropertiesInternal } from './src/parts/GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.ts'

// Create a realistic example similar to what the user described
const realisticSnapshot = {
  node_count: 6,
  edge_count: 8,
  extra_native_bytes: 0,
  meta: {
    node_fields: ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'],
    node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'regexp', 'number', 'native', 'synthetic', 'concatenated string', 'sliced string', 'symbol', 'bigint']],
    edge_fields: ['type', 'name_or_index', 'to_node'],
    edge_types: [['context', 'element', 'property', 'internal', 'hidden', 'shortcut', 'weak']],
    location_fields: ['object_index', 'script_id', 'line', 'column']
  },
  nodes: new Uint32Array([
    // type, name, id, self_size, edge_count, trace_node_id, detachedness
    3, 1, 37129, 20, 2, 0, 0,   // Main object with oldState and newState
    3, 2, 41727, 50, 3, 0, 0,   // oldState object 
    3, 3, 41728, 45, 2, 0, 0,   // newState object
    1, 4, 37449, 32, 0, 0, 0,   // tabs array
    2, 5, 77, 10, 0, 0, 0,      // searchValue string
    3, 6, 37735, 25, 0, 0, 0,   // preferences object
  ]),
  edges: new Uint32Array([
    // type, name_or_index, to_node
    2, 7, 7,   // property edge "oldState" to oldState object
    2, 8, 14,  // property edge "newState" to newState object  
    2, 9, 21,  // property edge "tabs" from oldState to tabs array
    2, 10, 28, // property edge "searchValue" from oldState to string
    2, 11, 35, // property edge "filteredItems" from oldState to preferences object
    2, 12, 35, // property edge "preferences" from newState to preferences object
    2, 13, 28, // property edge "inputSource" from newState to string
  ]),
  strings: ['', 'Object', 'OldStateObject', 'NewStateObject', 'TabsArray', 'search text', 'PreferencesObject', 'oldState', 'newState', 'tabs', 'searchValue', 'filteredItems', 'preferences', 'inputSource'],
  locations: new Uint32Array([])
}

console.log('🚀 Enhanced ObjectsWithProperties with Nested Previews\n')

console.log('📊 DEPTH 1 (references only):')
const depth1 = getObjectsWithPropertiesInternal(realisticSnapshot, 'oldState', 1)
console.log(JSON.stringify(depth1, null, 2))

console.log('\n📊 DEPTH 2 (nested object properties):')
const depth2 = getObjectsWithPropertiesInternal(realisticSnapshot, 'oldState', 2)
console.log(JSON.stringify(depth2, null, 2))

console.log('\n✨ Key Improvements:')
console.log('1. 🎯 NESTED OBJECTS: Properties now show as actual nested objects, not strings')
console.log('2. 🔍 DEPTH CONTROL: depth=1 shows references, depth=2 shows nested properties')
console.log('3. 🎨 CLEAN STRUCTURE: Easy to navigate and understand object relationships')
console.log('4. 💪 REALISTIC: Now you can see oldState.tabs, oldState.searchValue, etc.')

console.log('\n📝 Example Output Structure:')
console.log('preview: {')
console.log('  oldState: {')
console.log('    tabs: "[Array 37449]",')
console.log('    searchValue: "search text",')
console.log('    filteredItems: "[Object 37735]"')
console.log('  },')
console.log('  newState: {')
console.log('    preferences: "[Object 37735]",')
console.log('    inputSource: "search text"')
console.log('  }')
console.log('}')
console.log('\nMuch better than: "oldState": "{tabs: [Array 37449], searchValue: search text, ...}"')
