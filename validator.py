#!/usr/bin/env python3
import sys, re

def validate_lua(code):
    errors = []
    parens = 0
    braces = 0
    brackets = 0
    in_string = False
    str_char = ''
    in_long_string = None  # dict with close, lineStart
    in_long_comment = None
    lines = code.split('\n')

    for li, line in enumerate(lines):
        line_no = li + 1
        i = 0
        while i < len(line):
            ch = line[i]

            if in_long_comment:
                close = in_long_comment['close']
                idx = line.find(close, i)
                if idx != -1:
                    i = idx + len(close)
                    in_long_comment = None
                    continue
                else:
                    break

            if in_long_string:
                close = in_long_string['close']
                idx = line.find(close, i)
                if idx != -1:
                    i = idx + len(close)
                    in_long_string = None
                    continue
                else:
                    break

            if in_string:
                if ch == '\\':
                    i += 2
                    continue
                if ch == str_char:
                    in_string = False
                i += 1
                continue

            # long comment --[=*[ 
            if ch == '-' and i + 1 < len(line) and line[i+1] == '-':
                # check --[ =* [
                k = i + 2
                if k < len(line) and line[k] == '[':
                    eq = 0
                    k += 1
                    while k < len(line) and line[k] == '=':
                        eq += 1
                        k += 1
                    if k < len(line) and line[k] == '[':
                        close = ']' + '='*eq + ']'
                        in_long_comment = {'close': close, 'lineStart': line_no}
                        i = k + 1
                        continue
                # otherwise line comment
                break

            # long string [=*[
            if ch == '[':
                j = i + 1
                eq = 0
                while j < len(line) and line[j] == '=':
                    eq += 1
                    j += 1
                if j < len(line) and line[j] == '[':
                    close = ']' + '='*eq + ']'
                    in_long_string = {'close': close, 'lineStart': line_no}
                    i = j + 1
                    continue

            if ch in ('"', "'"):
                in_string = True
                str_char = ch
                i += 1
                continue

            if ch == '(':
                parens += 1
            elif ch == ')':
                parens -= 1
                if parens < 0:
                    errors.append(f"line {line_no}: unexpected ')' at col {i+1}")
            elif ch == '{':
                braces += 1
            elif ch == '}':
                braces -= 1
                if braces < 0:
                    errors.append(f"line {line_no}: unexpected '}}' at col {i+1}")
            elif ch == '[':
                brackets += 1
            elif ch == ']':
                brackets -= 1
                if brackets < 0:
                    brackets = 0
            i += 1

    if in_string:
        errors.append(f"unclosed string starting with {str_char}")
    if in_long_string:
        errors.append(f"unclosed long string [[...]] starting at line {in_long_string['lineStart']}")
    if in_long_comment:
        errors.append(f"unclosed long comment --[[...]] starting at line {in_long_comment['lineStart']}")
    if parens != 0:
        errors.append(f"unbalanced parentheses (off by {abs(parens)})")
    if braces != 0:
        errors.append(f"unbalanced braces (off by {abs(braces)})")
    if brackets != 0:
        errors.append(f"unbalanced brackets (off by {abs(brackets)})")
    return errors


def validate(code):
    errs = validate_lua(code)
    if errs:
        return "ERROR: " + "; ".join(errs)
    return "VALID"


def main():
    if len(sys.argv) < 2:
        print("ERROR: no file specified")
        sys.exit(1)
    try:
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            code = f.read()
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
    errors = validate_lua(code)
    if errors:
        print("ERROR: " + "; ".join(errors))
        sys.exit(1)
    else:
        print("VALID")

if __name__ == '__main__':
    main()
