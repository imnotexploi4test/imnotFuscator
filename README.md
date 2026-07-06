# imnotFuscator
A multi-language Lua obfuscator and validator suite with advanced cryptography, anti-tamper, and integrity checking capabilities.
## Overview
imnotFuscator is a comprehensive obfuscation toolkit for Lua code, featuring implementations in JavaScript, Python, and Lua. It provides advanced string encoding using positional keystreams, variable renaming, proactive anti-debugging protections, and dynamic integrity verification.
## Features
### Core Obfuscation
 * **Variable Renaming**: Renames local variables, for-loops, and function parameters to meaningless identifiers (e.g., imnot1).
 * **Advanced String Encoding**: Encodes all strings using a positional keystream paired with an 8-bit bitwise rotate-left layer. All strings are interconnected via a dynamic "Master Seed" (gseed).
 * **Comment Removal**: Strips all single-line and multi-line comments from the code.
 * **Garbage Code & Opaque Predicates**: Adds random non-functional code blocks and mathematically guaranteed conditionals (e.g., squared numbers) to confuse reverse engineers.
 * **Code Minification**: Removes unnecessary whitespace and compresses the output into a single line.
### Security Protections
 * **Anti-Tamper & Master Seed Integrity**: Uses a fragile, interconnected web of keys. Modifying a single byte of the master string silently corrupts the decryption keys for every other string in the script.
 * **Timing Checks**: Measures execution time to detect if a reverse engineer is single-stepping through the code with a debugger.
 * **Environment & Hook Protection**: Guards against function replacement (e.g., verifying pcall, error) and checks raw table primitives (rawequal, rawget) to detect analysis frameworks.
 * **Randomized Probe Execution**: Shuffles the order of anti-analysis checks during the build process to destroy fixed file signatures and prevent automated stripping.
 * **Checksum Validation**: Validates the code hasn't been altered post-obfuscation via mathematical hashes.
## Project Structure
### Files
| File | Purpose | Language |
|---|---|---|
| obfuscator.js | Main obfuscation engine | JavaScript |
| obfuscator.py | Python implementation of obfuscator | Python |
| obfuscator.lua | Lua implementation of obfuscator | Lua |
| validator.js | JavaScript Lua syntax validator | JavaScript |
| validator.py | Python Lua syntax validator | Python |
| validator.lua | Lua syntax validator | Lua |
## Usage
### JavaScript
#### Obfuscation
```javascript
const { obfuscate } = require('./obfuscator.js');
const fs = require('fs');

const luaCode = fs.readFileSync('script.lua', 'utf-8');
const obfuscated = obfuscate(luaCode);
console.log(obfuscated);

```
#### Validation
```bash
node validator.js script.lua

```
Output: VALID or ERROR: [list of errors]
### Python
#### Obfuscation
```bash
python obfuscator.py input.lua output.lua

```
#### Validation
```bash
python validator.py script.lua

```
### Lua
#### Obfuscation
```bash
lua obfuscator.lua input.lua output.lua

```
#### Validation
```bash
lua validator.lua script.lua

```
## Obfuscation Process
 1. **Comment Removal**: Strips single-line (--) and multi-line (--[[...]]) comments.
 2. **String Extraction**: Extracts all strings and multi-line strings, replacing them with placeholders.
 3. **Variable Renaming**: Maps user-defined variables to obfuscated names (e.g., myVar → imnot1).
 4. **String Encoding**: Encodes the first extracted string to generate a Master Seed. Every subsequent string is encoded using a positional keystream, a bit-rotation layer, and the Master Seed offset.
 5. **Garbage Injection**: Inserts opaque predicates and random non-functional math operations.
 6. **Protection Wrapping**: Injects randomized anti-tamper, timing checks, hook detection, and anti-debug guards.
 7. **Safe Execution Wrapper**: Wraps the final execution inside a pcall to catch traps and hide real crash traces.
 8. **Final Output**: Returns fully minified and obfuscated Lua code with the imnotFuscator ASCII header.
## Validator
The validator checks Lua syntax correctness by tracking:
 * **Parentheses balance**: ( and )
 * **Brace balance**: { and }
 * **String state tracking**: Handles escape sequences and string delimiters
 * **Comment handling**: Skips multi-line comments and single-line comments
 * **Multi-line strings**: Handles [[...]] syntax
### Usage
```bash
# JavaScript
node validator.js file.lua

# Python
python validator.py file.lua

# Lua
lua validate.lua file.lua

```
## Protected Code Example
Obfuscated code includes:
 * Cryptographically encoded strings (XOR + Rotate-Left)
 * Renamed variables and parameters
 * Randomized anti-analysis probes
 * Timing and environment checks
 * Opaque predicates and garbage code
Example error messages triggered by tampering or debugging:
 * "LOOL imagine you use the 25ms and Threaded to skid this thing lel"
 * "holy skid"
 * "nice try skid, but this aint gonna work for you lmaooo"
 * "integrity check failed successfully. this script has been modified."
 * "execute script error" (Generic fallback to hide stack traces)
## Reserved Keywords
The obfuscator safely preserves Lua and Roblox keywords, ensuring script functionality remains intact:
 * Lua: and, break, do, else, end, false, for, function, if, in, local, nil, not, or, repeat, return, then, true, until, while, continue
 * Roblox APIs: game, workspace, Instance, Vector3, Vector2, CFrame, Color3, TweenService, Players, RunService, Enum, etc.
 * Standard libraries: table, string, math, os, io, debug, coroutine, task, bit32, utf8
## Multi-Language Implementation
All three implementations (JavaScript, Python, Lua) follow the exact same V2 algorithm and produce equivalently secure results. The JavaScript version acts as the primary implementation with seamless fallbacks:
 1. Try native Lua execution (obfuscator.lua) via child process.
 2. Fallback to Python execution (obfuscator.py).
 3. Final fallback to native JavaScript execution.
## Author
Created by **imnotexploi4** (A.K.A the_baconthecheat)
## License
All rights reserved by imnotexploi4.
## Notes
 * Obfuscated code is significantly larger due to the interconnected anti-tamper protections and string decoding logic.
 * String encoding adds a slight computational overhead at runtime, though highly optimized.
 * Designed specifically for Roblox Luau environments but maintains standard Lua 5.1+ compatibility.
 * Multiple fallback implementations ensure compatibility across any build environment.

```text
AI Generated README.md
```
