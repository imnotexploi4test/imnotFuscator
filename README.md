# imnotFuscator V3 — UPGRADED

A multi-language Lua obfuscator and validator suite with **V3-grade cryptography**, advanced anti-tamper mesh, and a modern playground UI.

## Overview
imnotFuscator V3 is a comprehensive obfuscation toolkit for Lua/Luau code, featuring implementations in JavaScript, Python, and Lua. It provides FNV-1a hashed master-seed chaining, positional keystream with ADD + ROTL + XOR layers, number/boolean obfuscation, control-flow opaque predicates, and 11 randomized anti-analysis probes.

**What’s new in V3:**
- **Encryption V3**: `enc = ROTL( XOR(byte, key) + ADD, ROT )` where `key = seed + gseed + i*mult + i²*prime`; master seed derived via FNV-1a hash (`2166136261`) of master payload.
- **Stronger RNG**: `crypto.getRandomValues` in JS, `secrets` in Python, high-entropy seeding in Lua.
- **Number & Boolean Obfuscation**: integers become `(a+b-c)`, `math.floor`, `#string` tricks, and custom 8-bit XOR closures; `true/false` become `(1==1)` / `(not false)` etc.
- **Control-Flow**: Opaque true predicates (`math.sqrt(4)==2`, `#{1,2,3}==3`, etc.) wrap statements; false predicates inject dead junk.
- **Realistic Garbage**: `game:GetService`, `Instance.new`, `Vector3.new`, `CFrame.new` behind `pcall`-safe wrappers, plus math garbage.
- **Anti-Tamper V3**: 11 probes shuffled per build: error type check, env function type check, debug.getinfo `what=="C"` trap, metatable protection, coroutine.running, clock drift (0.35s threshold), rawequal/rawset/rawget integrity, `_G` metatable pollution check, `string.dump` probe, `task.wait` hook check, `loadstring` existence check.
- **Smart Scoping**: Local declarations are never wrapped in opaque `if` to preserve scope.
- **Long Bracket Aware**: Fully handles `--[=[...]=]`, `[=[...]=]`, etc. in comment/string extraction and validation.
- **Playground V3**: Dark glassmorphism UI, CodeMirror editors, drag & drop, live validation, stats (size ratio, time), options panel (8 toggles + garbage slider), examples, copy/download, theme toggle, `Ctrl+Enter` shortcut.

## Features

### Core Obfuscation
- **Variable Renaming V3**: `imnot1Il_`-style confusing suffixes, avoids reserved globals, handles `local function`, `for ... in`, multi-var locals.
- **Advanced String Encoding V3**: FNV-1a hash chain + positional keystream + 8-bit ADD + ROTL; master table byte corruption cascades to all strings.
- **Number Obfuscation**: Arithmetic obfuscation, `#` length tricks, XOR closures.
- **Boolean Obfuscation**: Opaque boolean expressions.
- **Comment Removal**: Strips `--`, `--[[...]]`, `--[=[...]=]` correctly.
- **Control-Flow & Opaque Predicates**: True predicates guard real code; false predicates inject dead garbage.
- **Garbage Injection V3**: Safe `pcall` wrapped service lookups and instance creation.
- **Code Minification**: Optional whitespace compression.
- **Long String Support**: `[ [`, `[=[`, `[==[` etc.

### Security Protections
- **Master Seed Integrity Mesh**: FNV-1a hash of master encoded table; tampering corrupts all downstream decryptions.
- **Timing Checks**: `os.clock()` delta with busy loop (detects debugger stepping).
- **Environment & Hook Protection**: Verifies `error, pcall, tostring, type, warn, print, task.wait, loadstring` types; checks `rawequal`, `rawget`, `rawset`.
- **Debug Library Trap**: Checks `debug.getinfo(1).what == "C"` to detect stepping.
- **Metatable Pollution Check**: `getmetatable(_G) ~= nil` → tamper.
- **String Dump Probe**: If `string.dump` works, we silently note (no hard fail, but can trigger).
- **Randomized Probe Order**: Shuffles 11 checks each build to kill signatures.
- **FNV Checksum**: Body checksum via `hash = hash * 16777619 + byte`.
- **Safe Execution Wrapper**: `pcall` + generic `execute script error` fallback.

## Project Structure

| File | Purpose | Language | Version |
|---|---|---|---|
| obfuscator.js | Main engine + browser global + Node fallback pipeline | JavaScript | V3 |
| obfuscator.py | Python implementation with `secrets` RNG | Python | V3 |
| obfuscator.lua | Lua implementation | Lua | V3 |
| validator.js | Upgraded validator with long-bracket support | JavaScript | V3 |
| validator.py | Python validator | Python | V3 |
| validator.lua | Lua validator | Lua | V3 |
| index.html | **UPGRADED** playground: CodeMirror, dark UI, options, drag-drop, stats | HTML/CSS/JS | V3 |
| logger.js | Simple logger | JS | - |

## Usage

### JavaScript (V3 API)

#### Obfuscation with options
```javascript
const { obfuscate, LuaObfuscator } = require('./obfuscator.js');
const fs = require('fs');

const luaCode = fs.readFileSync('script.lua', 'utf-8');
const obfuscated = obfuscate(luaCode, {
  renameVars: true,
  encodeStrings: true,
  encodeNumbers: true,
  encodeBooleans: true,
  addGarbage: true,
  garbageAmount: 7,
  addAntiTamper: true,
  controlFlow: true,
  minify: true
});
console.log(obfuscated);

// Or direct class usage
const ob = new LuaObfuscator({ garbageAmount: 10 });
console.log(ob.obfuscate(luaCode));
```

- `obfuscate(src, opts?)` — primary export, tries JS native first then Lua/Python child processes.

#### In Browser (via index.html)
`window.obfuscate(code, opts)` and `window.LuaObfuscator` are exposed. The playground uses them with CodeMirror and options UI.

#### Validation
```bash
node validator.js script.lua
# Output: VALID or ERROR: [details] (now handles [=[ ]=] properly)
```
JS API:
```js
const { validate } = require('./validator.js');
console.log(validate(code)); // "VALID" or "ERROR: ..."
```

### Python

#### Obfuscation
```bash
python obfuscator.py input.lua output.lua
# V3 uses secrets module + safe garbage + control flow
```

#### Validation
```bash
python validator.py script.lua
```

### Lua

#### Obfuscation
```bash
lua obfuscator.lua input.lua output.lua
# V3 Lua with FNV + safe wrappers
```

#### Validation
```bash
lua validator.lua script.lua
```

## Obfuscation Process V3

1. **Comment Removal**: Strips `--`, `--[[...]]`, `--[=[...]=]` without touching strings.
2. **String Extraction V3**: Handles long brackets `[=*[ ... ]=*]` and escapes; placeholders `__STR_n__`.
3. **Variable Renaming V3**: Captures `local`, `local function`, `for x in`, `for x=`, function params; generates `imnot{counter}{confusingSuffix}`; preserves `_G`, Roblox globals, etc.
4. **String Encoding V3**: Random `seed, mult(odd), rot(1-7), add(0-255), prime` per string; master string generates FNV-1a hash → `gseed_value = hash % 256`; subsequent strings use `key = seed+gseed+i*mult+i*i*prime`.
   - Encode: `enc[i] = ROTL( (XOR(byte, key) + ADD) %256, ROT)`
   - Decode: `byte = XOR( ROTR(enc, ROT) - ADD, key)`
5. **Number & Boolean Obfuscation**: Integers → `(a+b-c)`, `math.floor(b/a)`, XOR closures; booleans → opaque expressions.
6. **Control-Flow**: Non-local statements wrapped in `if OPAQUE_TRUE then ... end`; dead branches with `OPAQUE_FALSE`.
7. **Garbage Injection V3**: 12 template types, safe `pcall` wrappers for `game:GetService`, `Instance.new`, `workspace:FindFirstChild`, etc.
8. **Protection Wrapping V3**: 11 anti-tamper probes shuffled, plus FNV checksum + metatable protection.
9. **Safe Execution Wrapper**: Pcalls main payload, hides trace with generic warning.
10. **Final Output**: Minified single-line with `imnotFuscator V3` header.

## Validator V3

Now correctly tracks:
- **Long strings**: `[[`, `[=[`, `[==[` ...
- **Long comments**: `--[[`, `--[=[` ...
- **Escaped strings**: `\"`, `\\`, etc.
- **Balances**: `()`, `{}`, `[]` with line/col reporting.
- **Unclosed detection**: For strings/comments.

### Usage
```bash
# JS
node validator.js file.lua
# Python
python validator.py file.lua
# Lua
lua validator.lua file.lua
```

## Playground V3 (index.html)

Fully rewritten with:

- **Editor**: CodeMirror 5 (Dracula theme), line numbers, bracket matching, active line, placeholder, localStorage persistence.
- **UI**: Dark glassmorphism, animated logo, gradient header, badges, icon buttons, toast notifications.
- **Toolbar**: Obfuscate (primary), Clear, Copy Output, Download, Example loader, Upload .lua.
- **Options Panel**: 8 toggles (Rename Vars, Encrypt Strings V3, Obf Numbers, Obf Booleans, Garbage, Anti-Tamper V3, Control Flow, Minify) + garbage amount slider (0-20).
- **Panels**: Input/Output with file drop overlay, byte counters.
- **Stats Footer**: Validation pill (PASS/FAIL), size ratio, time ms, engine + garbage amount, security descriptor.
- **Features**: Drag & drop, `Ctrl+Enter` to obfuscate, theme toggle (Dracula ↔ Material-Darker), example scripts (Hello World, Calculator, Stress Test, Roblox, Loops), file upload, copy/download, auto-validation debounce.
- **Engine**: Calls `LuaObfuscator` directly with options; falls back via `loadScript` if needed.

### Run Playground
Just open `index.html` in browser. No build step needed. Uses CDN for CodeMirror + Google Fonts + local obfuscator.js/validator.js.

## Protected Code Example V3

Obfuscated code now includes:
- FNV-1a hashed master seed with ADD/ROL/XOR payloads
- Renamed vars like `imnot12Ili`
- Number obfuscation: `(math.floor(600/5))`, `((function(a,b)...end)(x,y))`
- Boolean obfuscation: `(1==1)`, `(not false)`
- Safe garbage: `(game and game.GetService and (function() local ok,res=pcall(function() return game:GetService("Players") end) return ok and res or nil end)() or nil)`
- 11 shuffled anti-tamper probes
- Control-flow opaque predicates

Error messages on tamper/debug:
- "LOOL imagine you use the 25ms and Threaded to skid this thing lel"
- "holy skid"
- "nice try skid, but this aint gonna work for you lmaooo"
- "integrity check failed successfully. this script has been modified."
- "environment polluted"
- "execute script error" (generic fallback)

## Reserved Keywords

Safely preserved: Lua keywords (`and, break, do, else, ...`), Roblox APIs (`game, workspace, Instance, Vector3, Players, TweenService, ...`), std libs (`table, string, math, os, io, debug, bit32, utf8, task, ...`).

## Multi-Language Implementation V3

All three implementations share V3 algorithm: FNV-1a, positional keystream with `i²*prime`, ADD layer, safe garbage, 11 probes, control-flow.

JS version priority:
1. Native JS V3 (`LuaObfuscator`)
2. Try `lua obfuscator.lua` child process
3. Try `python obfuscator.py`
4. Fallback to JS

## Author
Created by **imnotexploi4** (A.K.A the_baconthecheat) — V3 upgraded 2026.

## License
All rights reserved by imnotexploi4.

## Notes V3
- Output size larger than V2 due to 11 probes + ADD layer + safe wrappers + FNV — tradeoff for stronger integrity mesh.
- Runtime overhead minimal: string decode is per-string once at load, number XOR closures only if enabled (low frequency).
- Designed for Roblox Luau (`:any` type hints, `typeof` fallback) but remains compatible with Lua 5.1+ by ignoring type annotations in Roblox environment; for vanilla Lua, strip `:any` if needed.
- Playground requires internet for CodeMirror CDN on first load, after that cached; local JS files load instantly.
- For max obfuscation, set garbageAmount 12-15, enable all toggles. For smallest output, set garbage 0, disable control flow, disable number/boolean obfuscation.
