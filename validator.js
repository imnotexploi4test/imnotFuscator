const fs = require('fs');

function validateLua(code) {
    const errors = [];
    let parens = 0;
    let braces = 0;
    let inString = false;
    let strChar = '';
    let inMlComment = false;
    let inMlString = false;
    const lines = code.split('\n');

    for (let ln = 1; ln <= lines.length; ln++) {
        const line = lines[ln - 1];
        let i = 0;
        while (i < line.length) {
            const ch = line[i];
            
            if (inMlComment) {
                if (ch === ']' && i + 1 < line.length && line[i + 1] === ']') {
                    inMlComment = false;
                    i += 2;
                    continue;
                }
                i++;
                continue;
            }
            
            if (inMlString) {
                if (ch === ']' && i + 1 < line.length && line[i + 1] === ']') {
                    inMlString = false;
                    i += 2;
                    continue;
                }
                i++;
                continue;
            }
            
            if (inString) {
                if (ch === '\\') {
                    i += 2;
                    continue;
                }
                if (ch === strChar) {
                    inString = false;
                }
                i++;
                continue;
            }
            
            if (ch === '-' && i + 1 < line.length && line[i + 1] === '-') {
                if (i + 3 < line.length && line[i + 2] === '[' && line[i + 3] === '[') {
                    inMlComment = true;
                    i += 4;
                    continue;
                }
                break;
            }
            
            if (ch === '[' && i + 1 < line.length && line[i + 1] === '[') {
                inMlString = true;
                i += 2;
                continue;
            }
            
            if (ch === '"' || ch === "'") {
                inString = true;
                strChar = ch;
                i++;
                continue;
            }
            
            if (ch === '(') {
                parens++;
            } else if (ch === ')') {
                parens--;
                if (parens < 0) {
                    errors.push(`line ${ln}: unexpected ')'`);
                }
            } else if (ch === '{') {
                braces++;
            } else if (ch === '}') {
                braces--;
                if (braces < 0) {
                    errors.push(`line ${ln}: unexpected '}'`);
                }
            }
            i++;
        }
    }

    if (parens !== 0) {
        errors.push(`unbalanced parentheses (off by ${Math.abs(parens)})`);
    }
    if (braces !== 0) {
        errors.push(`unbalanced braces (off by ${Math.abs(braces)})`);
    }
    return errors;
}

function main() {
    if (process.argv.length < 3) {
        console.error("ERROR: no file specified");
        process.exit(1);
    }
    const file = process.argv[2];
    let code;
    try {
        code = fs.readFileSync(file, 'utf-8');
    } catch (e) {
        console.error(`ERROR: ${e.message}`);
        process.exit(1);
    }

    const errors = validateLua(code);
    if (errors.length > 0) {
        console.error("ERROR: " + errors.join("; "));
    } else {
        console.log("VALID");
    }
}

if (require.main === module) {
    main();
}
