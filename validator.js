const fs = require('fs');

/**
 * imnotFuscator V3 Validator - upgraded
 * Handles: long strings [=[...]=], long comments --[=[...]=], escaped strings, bracket tracking
 */
function validateLua(code) {
    const errors = [];
    let parens = 0, braces = 0, brackets = 0;
    let inString = false, strChar = '';
    let inLongString = null; // {close: string, lineStart}
    let inLongComment = null;
    const lines = code.split('\n');
    let lineNo = 0;

    for (let li = 0; li < lines.length; li++) {
        lineNo = li + 1;
        const line = lines[li];
        let i = 0;
        while (i < line.length) {
            const ch = line[i];

            if (inLongComment) {
                const closeIdx = line.indexOf(inLongComment.close, i);
                if (closeIdx !== -1) {
                    i = closeIdx + inLongComment.close.length;
                    inLongComment = null;
                    continue;
                } else {
                    break; // rest of line inside comment
                }
            }
            if (inLongString) {
                const closeIdx = line.indexOf(inLongString.close, i);
                if (closeIdx !== -1) {
                    i = closeIdx + inLongString.close.length;
                    inLongString = null;
                    continue;
                } else {
                    break;
                }
            }
            if (inString) {
                if (ch === '\\') { i += 2; continue; }
                if (ch === strChar) inString = false;
                i++; continue;
            }

            // detect long comment start --[=*[ 
            if (ch === '-' && i + 1 < line.length && line[i + 1] === '-') {
                let j = i + 2;
                let eq = 0;
                while (j < line.length && line[j] === '=') { eq++; j++; }
                if (j < line.length && line[j] === '[') {
                    // Could be --[=[ or --[[ -> long comment
                    // Need to ensure after -- there is [ =* [ ; we have -- + =* + [ already. Check if next char after [ is [? Actually for comment it's --[=*[   which is exactly -- + [ + =* + [ . Our parsing: -- (2) + =* (eq) + [ => we have consumed --, eq, and one [. Need second [ ?
                    // For valid long comment: --[=*[  => pattern is -- [ =* [ . So after -- we saw =* then [ . But we need to check if after that there is another [? Wait spec: long bracket is [ =* [ . So --[=*[ is -- + [ =* [ . Our j points after =* , and line[j] == '[' is the second [. But we have only seen one '[' after =*? Actually we counted = after --, then line[j]=='[' which is the second [? Let's handle generically: look for -- followed by [ =* [
                    // We already have -- seen. Re-scan: after --, we should have [ =* [ .
                    // So parse separately.
                    let k = i + 2;
                    if (k < line.length && line[k] === '[') {
                        let eq2 = 0; k++;
                        while (k < line.length && line[k] === '=') { eq2++; k++; }
                        if (k < line.length && line[k] === '[') {
                            const close = ']' + '='.repeat(eq2) + ']';
                            inLongComment = { close, lineStart: lineNo };
                            i = k + 1;
                            continue;
                        }
                    }
                    // if not long comment, it's a line comment -> break
                    break;
                }
                if (j < line.length && line[j] === '[') {
                    // Actually our earlier eq is after --, but need --[ ... pattern handled above. This is fallback for --[[ 
                    // Already handled, so treat as line comment start
                    break;
                }
                // line comment
                break;
            }

            // long string start [ =* [
            if (ch === '[') {
                let j = i + 1;
                let eq = 0;
                while (j < line.length && line[j] === '=') { eq++; j++; }
                if (j < line.length && line[j] === '[') {
                    const close = ']' + '='.repeat(eq) + ']';
                    inLongString = { close, lineStart: lineNo };
                    i = j + 1;
                    continue;
                }
            }

            if (ch === '"' || ch === "'") {
                inString = true;
                strChar = ch;
                i++; continue;
            }

            if (ch === '(') parens++;
            else if (ch === ')') {
                parens--;
                if (parens < 0) errors.push(`line ${lineNo}: unexpected ')' at col ${i+1}`);
            } else if (ch === '{') braces++;
            else if (ch === '}') {
                braces--;
                if (braces < 0) errors.push(`line ${lineNo}: unexpected '}' at col ${i+1}`);
            } else if (ch === '[') {
                // only count if not part of long string start (already handled)
                brackets++;
            } else if (ch === ']') {
                brackets--;
                if (brackets < 0) {
                    // Could be part of long close but we already handled those; still report but be lenient
                    brackets = 0;
                }
            }
            i++;
        }
    }

    if (inString) errors.push(`unclosed string starting with ${strChar}`);
    if (inLongString) errors.push(`unclosed long string [[...]] starting at line ${inLongString.lineStart}`);
    if (inLongComment) errors.push(`unclosed long comment --[[...]] starting at line ${inLongComment.lineStart}`);
    if (parens !== 0) errors.push(`unbalanced parentheses (off by ${Math.abs(parens)})`);
    if (braces !== 0) errors.push(`unbalanced braces (off by ${Math.abs(braces)})`);
    // brackets are often used for indexing; don't strictly error if unbalanced but warn
    if (brackets !== 0) errors.push(`unbalanced brackets (off by ${Math.abs(brackets)})`);

    return errors;
}

function validate(code) {
    const errs = validateLua(code);
    if (errs.length) return "ERROR: " + errs.join("; ");
    return "VALID";
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
        console.log("ERROR: " + errors.join("; "));
        process.exit(1);
    } else {
        console.log("VALID");
    }
}

if (typeof window !== 'undefined') {
    window.validate = validate;
    window.validateLua = validateLua;
}
if (require.main === module) {
    main();
}

module.exports = { validateLua, validate };
