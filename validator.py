#!/usr/bin/env python3
import sys, re


def validate_lua(code):
    errors = []
    parens = 0
    braces = 0
    in_string = False
    str_char = ''
    in_ml_comment = False
    in_ml_string = False
    lines = code.split('\n')

    for ln, line in enumerate(lines, 1):
        i = 0
        while i < len(line):
            ch = line[i]
            if in_ml_comment:
                if ch == ']' and i + 1 < len(line) and line[i + 1] == ']':
                    in_ml_comment = False
                    i += 2
                    continue
                i += 1
                continue
            if in_ml_string:
                if ch == ']' and i + 1 < len(line) and line[i + 1] == ']':
                    in_ml_string = False
                    i += 2
                    continue
                i += 1
                continue
            if in_string:
                if ch == '\\':
                    i += 2
                    continue
                if ch == str_char:
                    in_string = False
                i += 1
                continue
            if ch == '-' and i + 1 < len(line) and line[i + 1] == '-':
                if (i + 3 < len(line)
                        and line[i + 2] == '['
                        and line[i + 3] == '['):
                    in_ml_comment = True
                    i += 4
                    continue
                break
            if ch == '[' and i + 1 < len(line) and line[i + 1] == '[':
                in_ml_string = True
                i += 2
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
                    errors.append(f"line {ln}: unexpected ')'")
            elif ch == '{':
                braces += 1
            elif ch == '}':
                braces -= 1
                if braces < 0:
                    errors.append(f"line {ln}: unexpected '}}'")
            i += 1

    if parens != 0:
        errors.append(
            f"unbalanced parentheses (off by {abs(parens)})"
        )
    if braces != 0:
        errors.append(
            f"unbalanced braces (off by {abs(braces)})"
        )
    return errors


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
    else:
        print("VALID")


if __name__ == '__main__':
    main()
