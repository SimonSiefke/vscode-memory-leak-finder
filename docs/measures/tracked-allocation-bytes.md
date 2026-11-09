# Tracked allocation bytes

`trackedAllocationBytes` (alias `tracked-allocation-bytes`) reports **estimated allocation churn in bytes**, grouped by allocation site/type and resolved back to original sources where source maps are available:

```sh
node packages/cli/bin/test.js --cwd packages/e2e --only '^editor-open.ts' --runs 17 --check-leaks --measure trackedAllocationBytes
```

This automatically prepares an instrumented VS Code copy, using a separate `allocation-bytes` mode/cache. Existing `trackedAllocations` behavior and overhead are unchanged. The browser/renderer is measured; extension hosts and native allocations are outside its scope. This is informational (`isLeak` is always false): allocating bytes does not itself demonstrate a leak.

Each result row has `estimatedBytes`, `createdCount`, `unknownCount`, `type`, `location`, and original source/type/location fields. The terminal summary totals estimated bytes and unknown-size values and shows the ten largest sites. A zero-allocation interval is valid; missing instrumentation fails explicitly. Counters reset after script/source-map setup and cover the measured interval, independently of garbage collection. The tracker stores only counters and location/type strings, without WeakRefs or references to measured values.

## Instrumented expressions

- Object/array/regexp literals, `new`, `Array()`, `Array.from/of`, and `Object.create`.
- Computed string/number/bigint results from arithmetic/bitwise binary expressions, arithmetic compound assignments, numeric unary expressions, untagged interpolated templates, and unshadowed `String/Number/BigInt` calls.
- Nested allocations are visited individually. Parent sizes are shallow: reference slots count, child contents do not. Evaluation order/results, receivers, template tag semantics and ordinary getters are preserved.

Static string/number literals are excluded because evaluating a constant does not imply a fresh heap allocation. Tagged templates remain tagged. This does not instrument arbitrary library calls such as `map`, `slice`, `JSON.parse`, `join`, `toString`, or user factories; allocations inside instrumented JavaScript remain visible. Function literals, increments/decrements and native/internal allocation sites are not tracked. The counts describe evaluated sites, not distinct identities or proof that the engine actually allocated every returned value. A factory/constructor may reuse an existing value.

## Size model

All bytes are estimates, including objects/arrays/strings/numbers. The fixed comparison model assumes four-byte compressed reference slots and four-byte alignment. V8 documents compressed pointers and tagged small integers in its [pointer-compression article](https://v8.dev/blog/pointer-compression); the constants below are explicit heuristics, not a detected engine layout or an ABI guarantee.

| Value                                  | Estimate at the tracked expression                                                           |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| Object/class instance                  | 12-byte header + 4 bytes per own string/symbol key                                           |
| Array                                  | 16-byte header; nonempty arrays add an 8-byte backing-store header + 4 bytes per length slot |
| Primitive string                       | 12-byte header + 2 bytes per UTF-16 code unit, rounded up to 4 bytes                         |
| Primitive number                       | 0 for signed 31-bit integers except negative zero; 12 bytes for other heap-number candidates |
| Bigint                                 | 16 bytes + 8 bytes per 64-bit magnitude limb                                                 |
| Map / Set                              | 32 + 24 bytes per entry / 24 + 16 bytes per entry                                            |
| WeakMap / WeakSet / WeakRef            | Header-only guesses: 32 / 32 / 16 bytes; contents/referents are not inspected                |
| ArrayBuffer                            | 32-byte header + byteLength                                                                  |
| Typed array / DataView                 | 64-byte view header; shared backing storage is excluded                                      |
| Boxed String / Number                  | 16-byte wrapper plus primitive estimate                                                      |
| RegExp / Date                          | Header-only guesses: 24 / 16 bytes                                                           |
| Unsupported values / failed inspection | Counted in `unknownCount`, contributing no bytes                                             |

Map/Set size is read with captured intrinsic getters, without traversing entries or invoking user size getters/iterators. Ordinary objects use own-key counts without reading property values/getters. Reflection can invoke Proxy traps; revoked/throwing proxies are returned unchanged and recorded as unknown-size values. Instrumentation is intended for trusted diagnostic runs and adds substantial execution overhead.

Sizes are sampled at creation, so later property additions, `push`, map/set growth, or buffer resizing are not captured. ArrayBuffer payload is counted at explicit ArrayBuffer construction sites; buffers implicitly created by typed-array constructors are not counted. Double-element arrays, sparse/dictionary storage, capacity slack, property dictionaries, object shapes, native payloads, regexp compilation, shared/copy-on-write storage, string interning/ropes/slices/Latin-1 storage, JIT unboxing and allocation elision can differ substantially from this model. String/number operations can reuse values or allocate nothing. Referenced strings/numbers already present in an object are not recursively charged. Use consistent engine/builds for comparisons; these estimates are neither exact V8 allocated bytes nor retained bytes, RSS, or an upper/lower bound.
