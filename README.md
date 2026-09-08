# imnotFuscator

A multi-language Lua/Luau obfuscator and validator suite focused on structural obfuscation, stateful string protection, anti-tamper, integrity checks, multi-version diagnostics, and Roblox/Rbx environment diagnostics.

## What changed in v9

v9 keeps the existing project structure, original headers, and existing anti-tamper messages. The normal build still uses one fixed protection pipeline. There are no user-selectable obfuscation levels.

### Obfuscator upgrades

- Stateful chained string encoding. Each encoded byte depends on the previous encoded byte and a second rolling state.
- Per-string randomized key schedules and decoder syntax variants.
- Per-string payload affine masking. The values stored in the output are not the direct chained ciphertext values.
- Per-string payload permutation. Logical byte order and physical table order are different and a protected mapping restores the logical order at runtime.
- The payload layout mode changes the equivalent inverse expression used by the generated decoder.
- Integrity tags now cover the stored payload, payload mapping, and codec parameters.
- Master-seed derivation still uses the decoded logical byte stream, so the chained string dependencies remain intact.
- Unicode-safe literal splitting in Python, JavaScript, and Lua implementations.
- Token-aware local/parameter renaming is preserved in all three obfuscator implementations, including the Lua implementation.
- Numeric literal rewriting remains enabled for suitable integer literals.
- Existing opaque predicates, garbage generation, anti-tamper checks, integrity checks, comment removal, and minification remain in the pipeline.
- The JavaScript PRNG fallback no longer attempts to pass a BigInt directly through `Math.floor`.
- `--seed` remains available for reproducible builds.

### Important limitation

No source-code obfuscator can make code mathematically impossible to recover once the protected program is executed. Runtime values can still be observed by instrumentation, API hooks, interpreter tracing, or other dynamic analysis. v9 is designed to make straightforward static pattern matching and simple decoder extraction more expensive, not to provide an absolute anti-reversing guarantee.

## Supported targets

The target selector accepts:

- `auto`
- `lua51`
- `lua52`
- `lua53`
- `lua54`
- `lua55`
- `luajit`
- `luau`

The generator intentionally keeps its generated helper syntax conservative across the supported Lua family. Selecting a target does not convert incompatible source syntax. Luau-specific source still needs a Luau-capable runtime.

## Usage

### Python

```bash
python obfuscator.py input.lua output.lua --target auto
python obfuscator.py input.lua output.lua --target lua51
python obfuscator.py input.lua output.lua --target lua52
python obfuscator.py input.lua output.lua --target lua53
python obfuscator.py input.lua output.lua --target lua54
python obfuscator.py input.lua output.lua --target lua55
python obfuscator.py input.lua output.lua --target luajit
python obfuscator.py input.lua output.lua --target luau
```

Reproducible build:

```bash
python obfuscator.py input.lua output.lua --target luau --seed 12345
```

### Lua

```bash
lua obfuscator.lua input.lua output.lua --target auto
lua obfuscator.lua input.lua output.lua --target lua51
lua obfuscator.lua input.lua output.lua --target lua52
lua obfuscator.lua input.lua output.lua --target lua53
lua obfuscator.lua input.lua output.lua --target lua54
lua obfuscator.lua input.lua output.lua --target lua55
lua obfuscator.lua input.lua output.lua --target luajit
lua obfuscator.lua input.lua output.lua --target luau
```

The Lua implementation follows the same v9 string protection design as the Python implementation: chained byte state, polymorphic inverse expressions, payload masking, payload permutation, and integrity metadata.

### JavaScript

```javascript
const { obfuscate } = require('./obfuscator.js');
const fs = require('fs');

const source = fs.readFileSync('script.lua', 'utf8');
const output = obfuscate(source, { target: 'luau', seed: 12345 });
fs.writeFileSync('script.obf.lua', output);
```

CLI:

```bash
node obfuscator.js input.lua output.lua --target luau --seed 12345
```

## What `--seed` does

A seed initializes the deterministic build-time random sequence. The same source, target, and seed reproduce the same randomized names, encoded data, payload layout, and generated structure.

```bash
python obfuscator.py input.lua output.lua --target luau --seed 12345
```

Changing the seed produces a different protected build while preserving the intended decoded data. Fixed seeds are useful for regression testing. Different seeds are useful when producing different builds.

## Validator

The validator is static. It does not execute the supplied Lua code.

It checks:

- quoted strings and long-bracket strings
- long-bracket comments
- `()`, `{}`, and `[]` balance
- basic Lua block structure
- target-specific syntax diagnostics
- Roblox environment identifiers
- Rbx/executor environment identifiers
- syntax commonly incompatible with older Lua targets

### Generic validation

```bash
python validator.py script.lua --target auto --env generic
```

### Roblox validation

```bash
python validator.py script.lua --target luau --env roblox
```

### Rbx/exploit environment diagnostics

```bash
python validator.py script.lua --target luau --env exploit
```

The environment modes are diagnostics only. They do not connect to Roblox, an executor, or a remote service.

## Existing anti-tamper messages

The following existing messages are intentionally preserved exactly:

- `LOOL imagine you use the 25ms and Threaded to skid this thing lel`
- `holy skid`
- `nice try skid, but this aint gonna work for you lmaooo`
- `integrity check failed successfully. this script has been modified.`
- `execute script error`

They were not renamed or removed.

## Multi-language implementation

| File | Purpose |
|---|---|
| `obfuscator.py` | Python obfuscator |
| `obfuscator.js` | JavaScript obfuscator/wrapper |
| `obfuscator.lua` | Lua implementation |
| `validator.py` | Python validator |
| `validator.js` | JavaScript validator |
| `validator.lua` | Lua validator |
| `logger.js` | Existing project logger |

## Quick CLI examples

### Luau + Roblox Exploit

```bash
lua obfuscator.lua test.lua tested.lua.txt --target luau --type exploit
```

A successful run prints `OK`. The output can then be checked with the validator using the same target/type pair:

```bash
lua validator.lua tested.lua.txt --target luau --type exploit
```

### Roblox Studio

```bash
lua obfuscator.lua test.lua tested.lua --target luau --type studio
```

### Roblox Require

```bash
lua obfuscator.lua test.lua tested.lua --target luau --type require
```

In `require` mode, numeric module IDs in direct `require(...)` expressions are transformed automatically. For example:

```lua
require(12345678)
require(12345678):Fire("playerexample")
require(12345678).lescript("playerexample", arg1, arg2, arg3)
```

The module ID is protected as part of the `require(...)` expression while the surrounding call chain is preserved. This is static-extraction resistance, not a guarantee against runtime hooks that can observe the evaluated ID.

## Benchmark example

The following Prometheus benchmark is an example run, not a universal performance guarantee. Runtime depends on the device, Lua runtime, and workload.

| Benchmark | Iterations | Time (s) |
|---|---:|---:|
| arithmetic loop | 500000 | 0.015889 |
| function calls | 400000 | 0.044435 |
| table create/insert | 600000 | 0.244628 |
| table iteration | 6000 | 0.703367 |
| string concat | 40000 | 0.628106 |
| closure creation | 300000 | 0.129501 |
| metatable index | 200000 | 0.015493 |
| **total** | | **1.781419** |

Run your own benchmark before comparing builds.

## Testing

The repository includes a small regression test suite under `tests/`.

The current build has been syntax-checked for Python and JavaScript. Generated Python, JavaScript, and Lua obfuscated samples were exercised with the available `luatex --luaonly` runtime smoke test, and the generated files passed the Python validator for the documented targets. The repository also includes a benchmark example for the Lua runtime.

A native Lua 5.1, 5.2, 5.3, 5.4, 5.5, LuaJIT, or Luau runtime was not available in the build environment, so those target runtimes are not claimed to have been directly executed here.

## Design direction

v9 follows public research trends around stateful constant protection, control-flow and dispatcher polymorphism, compiler-aware transformations, and VM-style analysis resistance. It does not copy proprietary implementation code from another commercial obfuscator.

## Author

Created by **imnotexploi4** (A.K.A the_baconthecheat)

## License

All rights reserved by imnotexploi4.

## Roblox `--type`

All three obfuscator implementations accept the same Roblox type selector:

- `studio` for normal Roblox Studio scripts
- `require` for ModuleScript/asset-require style code
- `exploit` for executor-oriented Luau environments

When `--target luau` is selected, `--type` is required. This prevents an ambiguous Roblox runtime profile from being silently selected.

Python:

```bash
python obfuscator.py input.lua output.lua --target luau --type studio
python obfuscator.py input.lua output.lua --target luau --type require
python obfuscator.py input.lua output.lua --target luau --type exploit
```

JavaScript:

```bash
node obfuscator.js input.lua output.lua --target luau --type studio
node obfuscator.js input.lua output.lua --target luau --type require
node obfuscator.js input.lua output.lua --target luau --type exploit
```

Lua:

```bash
lua obfuscator.lua input.lua output.lua --target luau --type studio
lua obfuscator.lua input.lua output.lua --target luau --type require
lua obfuscator.lua input.lua output.lua --target luau --type exploit
```

For `--type require`, direct numeric calls such as `require(12345678)` are rewritten into a runtime arithmetic reconstruction before the call. Chained calls such as `require(12345678):Fire(...)` and `require(12345678).lescript(...)` are covered because the module ID is transformed inside the original call expression. This is intended to make static extraction harder, not to make the runtime value unobservable. A hook around `require` can still see the final evaluated ID because the runtime must receive that ID to perform the load. A runtime hook that intercepts `require` can still observe the final evaluated numeric argument.

The validator accepts the same `--target` and `--type` pair:

```bash
python validator.py script.lua --target luau --type studio
python validator.py script.lua --target luau --type require
python validator.py script.lua --target luau --type exploit
```

In `require` mode, the validator reports direct numeric `require(...)` calls so they can be protected before distribution.

### Backward-compatible `--env`

`--env generic|roblox|exploit` remains accepted for compatibility. New code should prefer the shared `--target ... --type studio|require|exploit` form so the validator and obfuscators use the same interface.
