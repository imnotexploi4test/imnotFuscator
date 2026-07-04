# imnotFuscator

A multi-language Lua obfuscator and validator suite with anti-tamper and integrity checking capabilities.

## Overview

imnotFuscator is a comprehensive obfuscation toolkit for Lua code, featuring implementations in JavaScript, Python, and Lua. It provides string encoding, variable renaming, anti-debugging protections, and integrity verification.

---

## Features

### Core Obfuscation
- **Variable Renaming**: Renames local variables and function parameters to meaningless identifiers
- **String Encoding**: Encodes all strings using XOR encryption with dynamic keys
- **Comment Removal**: Strips all comments from code
- **Garbage Code Injection**: Adds random non-functional code to increase obfuscation
- **Code Minification**: Removes unnecessary whitespace

### Security Protections
- **Anti-Tamper Detection**: Monitors for modifications and triggers alerts
- **Integrity Checking**: Validates code hasn't been altered via checksums
- **Anti-Debug Measures**: Detects and blocks debugging attempts
- **Environment Protection**: Guards against function replacement and global environment manipulation
- **Coroutine Monitoring**: Detects execution environment changes

---

## Project Structure

### Files

| File | Purpose | Language |
|------|---------|----------|
| `obfuscator.js` | Main obfuscation engine | JavaScript |
| `obfuscator.py` | Python implementation of obfuscator | Python |
| `obfuscator.lua` | Lua implementation of obfuscator | Lua |
| `validator.js` | JavaScript Lua syntax validator | JavaScript |
| `validator.py` | Python Lua syntax validator | Python |
| `validate.lua` | Lua syntax validator | Lua |
| `logger.js` | Logging utility for operations | JavaScript |

---

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

Output: `VALID` or `ERROR: [list of errors]`

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
lua validate.lua script.lua
```

---

## Obfuscation Process

1. **Comment Removal**: Strips single-line (`--`) and multi-line (`--[[...]]`) comments
2. **String Extraction**: Extracts all strings and multi-line strings, replacing with placeholders
3. **Variable Renaming**: Maps user-defined variables to obfuscated names (e.g., `myVar` → `imnot1`)
4. **String Encoding**: Encodes each string using XOR encryption with a random key (20-220)
5. **Garbage Injection**: Inserts random non-functional code blocks
6. **Protection Wrapping**: Adds anti-tamper, integrity checks, and anti-debug guards
7. **Final Output**: Returns fully obfuscated Lua code with header

---

## Validator

The validator checks Lua syntax correctness by tracking:
- **Parentheses balance**: `(` and `)`
- **Brace balance**: `{` and `}`
- **String state tracking**: Handles escape sequences and string delimiters
- **Comment handling**: Skips multi-line comments and single-line comments
- **Multi-line strings**: Handles `[[...]]` syntax

### Usage
```bash
# JavaScript
node validator.js file.lua

# Python
python validator.py file.lua

# Lua
lua validate.lua file.lua
```

---

## Logger

The `logger.js` module provides logging capabilities:

```javascript
const { log, getLogs, clearLogs } = require('./logger.js');

log('Operation started');  // Logs to console and bot_logs.txt
const allLogs = getLogs(); // Retrieves all logs
clearLogs();               // Clears the log file
```

---

## Protected Code Example

Obfuscated code includes:
- XOR-encoded strings
- Renamed variables
- Integrity verification
- Anti-debug checks
- Anti-tamper guards
- Garbage code

Example error messages triggered by tampering:
- "LOOL imagine you use the 25ms and 333ms to skid this thing lel"
- "Anti-tamper triggered. This script is protected."
- "Nice try skid, but this aint gonna work for you lmaooo"
- "Integrity check failed. Script has been modified."

---

## Reserved Keywords

The obfuscator preserves Lua and Roblox keywords:
- Lua: `and`, `break`, `do`, `else`, `end`, `false`, `for`, `function`, `if`, `in`, `local`, `nil`, `not`, `or`, `repeat`, `return`, `then`, `true`, `until`, `while`
- Roblox APIs: `game`, `workspace`, `Instance`, `Vector3`, `Color3`, `TweenService`, `Players`, `RunService`, etc.
- Standard libraries: `table`, `string`, `math`, `os`, `io`, `debug`, `coroutine`

---

## Multi-Language Implementation

All three implementations (`JavaScript`, `Python`, `Lua`) follow the same algorithm and produce equivalent results. The JavaScript version acts as the primary implementation with fallbacks:

1. Try Lua implementation
2. Fallback to Python implementation
3. Final fallback to native JavaScript implementation

---

## Author

Created by **imnotexploi4** (A.K.A the_baconthecheat)

---

## License

All rights reserved by imnotexploi4.

---

## Notes

- Obfuscated code is significantly larger due to anti-tamper protections
- String encoding adds computational overhead at runtime
- Designed specifically for Roblox Lua environments
- Multiple fallback implementations ensure compatibility across environments
