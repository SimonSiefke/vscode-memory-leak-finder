const textEncoder = new TextEncoder()

export const Nodes = 'nodes'
export const Edges = 'edges'
export const Locations = 'locations'
export const Strings = 'strings'

// Pre-encoded tokens to avoid repeated TextEncoder calls
export const TOKENS = {
  NODES: textEncoder.encode('"nodes":'),
  EDGES: textEncoder.encode('"edges":'),
  LOCATIONS: textEncoder.encode('"locations":'),
  STRINGS: textEncoder.encode('"strings":'),
  SNAPSHOT: textEncoder.encode('"snapshot":'),
  META: textEncoder.encode('"meta":'),
  NODE_FIELDS: textEncoder.encode('"node_fields":'),
  EDGE_FIELDS: textEncoder.encode('"edge_fields":'),
  LOCATION_FIELDS: textEncoder.encode('"location_fields":'),
  NODE_TYPES: textEncoder.encode('"node_types":'),
  EDGE_TYPES: textEncoder.encode('"edge_types":'),
  NODE_COUNT: textEncoder.encode('"node_count":'),
  EDGE_COUNT: textEncoder.encode('"edge_count":'),
}
