#!/usr/bin/env python3
import argparse
import re
import sys

LUA_KEYWORDS = {
    'and','break','do','else','elseif','end','false','for','function','goto','if','in',
    'local','nil','not','or','repeat','return','then','true','until','while'
}
LUA54_KEYWORDS = {'const','close'}
LUAU_KEYWORDS = {'continue','type','export','typeof'}
ROBLOX_GLOBALS = {
    'game','workspace','script','Instance','Enum','Vector2','Vector3','CFrame','Color3','BrickColor',
    'UDim','UDim2','TweenInfo','RaycastParams','OverlapParams','NumberRange','NumberSequence',
    'ColorSequence','PhysicalProperties','Region3','task','tick','wait','spawn','delay','Players',
    'RunService','UserInputService','ReplicatedStorage','ServerStorage','ServerScriptService','StarterGui',
    'CoreGui','Lighting','SoundService','TweenService','HttpService','CollectionService','VirtualInputManager'
}
ROBLOX_TYPES = {'studio','require','exploit'}

EXPLOIT_GLOBALS = {
    'getgenv','getrenv','getsenv','getgc','gethui','getconnections','getcustomasset','identifyexecutor',
    'iscclosure','islclosure','newcclosure','hookfunction','hookmetamethod','restorefunction','cloneref',
    'checkcaller','setclipboard','request','http_request','syn','fluxus','KRNL','queue_on_teleport',
    'setthreadidentity','getthreadidentity','setidentity','getidentity','fireclickdetector','fireproximityprompt',
    'firetouchinterest','Drawing','WebSocket','crypt','debug'
}


def scan(code):
    errors, tokens = [], []
    parens = braces = brackets = 0
    block_stack = []
    i, line = 0, 1
    n = len(code)

    def add(tok, ln):
        tokens.append((tok, ln))

    def long_open(pos):
        if pos >= n or code[pos] != '[':
            return None
        j = pos + 1
        eq = 0
        while j < n and code[j] == '=':
            eq += 1; j += 1
        if j < n and code[j] == '[':
            return eq, j + 1
        return None

    while i < n:
        ch = code[i]
        if ch == '\n': line += 1; i += 1; continue
        if ch.isspace(): i += 1; continue
        if ch == '-' and i + 1 < n and code[i+1] == '-':
            lo = long_open(i + 2)
            if lo:
                eq, j = lo; end = ']' + '=' * eq + ']'
                k = code.find(end, j)
                if k < 0: errors.append(f'line {line}: unterminated long comment'); break
                line += code[j:k].count('\n')
                i = k + len(end); continue
            k = code.find('\n', i + 2)
            i = n if k < 0 else k
            continue
        if ch in "'\"":
            q = ch; start = line; i += 1; closed = False
            while i < n:
                if code[i] == '\n': line += 1
                if code[i] == '\\': i += 2; continue
                if code[i] == q: i += 1; closed = True; break
                i += 1
            if not closed: errors.append(f'line {start}: unterminated string')
            add('<string>', start); continue
        lo = long_open(i)
        if lo:
            eq, j = lo; end = ']' + '=' * eq + ']'; k = code.find(end, j)
            if k < 0: errors.append(f'line {line}: unterminated long string'); break
            line += code[j:k].count('\n'); add('<longstring>', line); i = k + len(end); continue
        if ch.isalpha() or ch == '_':
            m = re.match(r'[A-Za-z_][A-Za-z0-9_]*', code[i:]); tok = m.group(0)
            add(tok, line); i += len(tok); continue
        if ch.isdigit():
            m = re.match(r'(?:0[xX][0-9A-Fa-f]+|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)', code[i:])
            tok = m.group(0) if m else ch; add('<number>', line); i += len(tok); continue
        # multi-character operators
        op = next((x for x in ('...', '::', '//=', '<<=', '>>=', '==', '~=', '<=', '>=', '..', '//', '<<', '>>', '+=', '-=', '*=', '/=', '%=', '^=', '..=') if code.startswith(x, i)), None)
        if op:
            add(op, line); i += len(op); continue
        add(ch, line); i += 1

    for tok, ln in tokens:
        if tok == '(':
            parens += 1
        elif tok == ')':
            parens -= 1
            if parens < 0: errors.append(f"line {ln}: unexpected ')'"); parens = 0
        elif tok == '{': braces += 1
        elif tok == '}':
            braces -= 1
            if braces < 0: errors.append(f"line {ln}: unexpected '}}'"); braces = 0
        elif tok == '[': brackets += 1
        elif tok == ']':
            brackets -= 1
            if brackets < 0: errors.append(f"line {ln}: unexpected ']'"); brackets = 0
        elif tok in ('function','do','if','repeat'):
            block_stack.append((tok, ln))
        elif tok in ('for','while'):
            pass
        elif tok == 'end':
            if not block_stack or block_stack[-1][0] == 'repeat':
                errors.append(f'line {ln}: unexpected end')
            else: block_stack.pop()
        elif tok == 'until':
            if not block_stack or block_stack[-1][0] != 'repeat': errors.append(f'line {ln}: unexpected until')
            else: block_stack.pop()

    if parens: errors.append(f'unbalanced parentheses (off by {parens})')
    if braces: errors.append(f'unbalanced braces (off by {braces})')
    if brackets: errors.append(f'unbalanced brackets (off by {brackets})')
    if block_stack:
        names = ', '.join(x[0] for x in block_stack[-6:])
        errors.append(f'unclosed block(s): {names}')
    return errors, tokens


def validate_target(tokens, target):
    if target == 'auto': return []
    toks = {t for t,_ in tokens}
    errors = []
    if target in ('lua51','luajit') and 'goto' in toks:
        # LuaJIT 2.1 supports goto; LuaJIT 2.0 does not. Keep LuaJIT permissive.
        if target == 'lua51': errors.append('target lua51 does not support goto/labels')
    if target in ('lua51','lua52','lua53','luajit') and ('continue' in toks or 'export' in toks):
        errors.append(f'target {target} does not support Luau-only keywords')
    return errors


def environment_report(tokens, env):
    names = {t for t,_ in tokens if re.match(r'^[A-Za-z_][A-Za-z0-9_]*$', t)}
    found = []
    if env in ('roblox','exploit'):
        found = sorted(names & ROBLOX_GLOBALS)
    if env == 'exploit':
        found += sorted(names & EXPLOIT_GLOBALS)
    return sorted(set(found))


def type_report(tokens, roblox_type):
    if roblox_type == 'require':
        return sum(1 for i, (tok, _) in enumerate(tokens) if tok == '<number>' and i > 0 and tokens[i-1][0] == '<ws>' if False)
    return 0


def main():
    ap = argparse.ArgumentParser(description='imnotFuscator validator')
    ap.add_argument('file')
    ap.add_argument('--target', choices=['auto','lua51','lua52','lua53','lua54','lua55','luajit','luau'], default='auto')
    ap.add_argument('--env', choices=['generic','roblox','exploit'], default=None)
    ap.add_argument('--type', dest='roblox_type', choices=sorted(ROBLOX_TYPES), default=None)
    args = ap.parse_args()
    if args.target == 'luau' and args.roblox_type is None:
        ap.error('target luau requires --type studio, --type require, or --type exploit')
    env = args.roblox_type or args.env or 'generic'
    if env not in ('generic','studio','require','exploit'):
        ap.error('invalid environment/type')
    try:
        code = open(args.file, encoding='utf-8').read()
    except Exception as e:
        print(f'ERROR: {e}'); return 1
    errors, tokens = scan(code)
    errors += validate_target(tokens, args.target)
    if errors:
        print('ERROR: ' + '; '.join(dict.fromkeys(errors))); return 1
    found = environment_report(tokens, 'roblox' if env in ('studio','require') else env)
    print('VALID')
    if found:
        print('ENV: ' + ', '.join(found))
    else:
        print('ENV: no known environment identifiers detected')
    if env == 'require':
        raw_require_ids = re.findall(r'\brequire\s*\(\s*(\d{1,18})\s*\)', code)
        if raw_require_ids:
            print('REQUIRE: unprotected numeric module IDs detected: ' + str(len(raw_require_ids)))
            print('REQUIRE: obfuscate with --type require to rewrite direct numeric require IDs')
        else:
            print('REQUIRE: no direct numeric module IDs detected')
    return 0

if __name__ == '__main__': sys.exit(main())
