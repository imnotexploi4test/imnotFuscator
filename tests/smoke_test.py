#!/usr/bin/env python3
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
FIXTURE = ROOT / 'tests' / 'fixtures' / 'sample.lua'
ANTI = [
    'LOOL imagine you use the 25ms and Threaded to skid this thing lel',
    'holy skid',
    'nice try skid, but this aint gonna work for you lmaooo',
    'integrity check failed successfully. this script has been modified.',
    'execute script error',
]
TARGETS = ['auto','lua51','lua52','lua53','lua54','lua55','luajit','luau']

def run(*args, check=True, cwd=ROOT):
    return subprocess.run(args, cwd=cwd, text=True, capture_output=True, check=check)

def main():
    run(sys.executable, '-m', 'py_compile', 'obfuscator.py', 'validator.py')
    if shutil.which('node'):
        run('node', '--check', 'obfuscator.js')

    py = ROOT / 'obfuscator.py'
    orig = ROOT / 'obfuscator.py.orig'
    def header(t):
        m = re.search(r'HEADER = r?"""(.*?)"""', t, re.S)
        if not m:
            raise AssertionError('header not found')
        return m.group(1)
    assert header(py.read_text()) == header(orig.read_text())
    for name in ('obfuscator.py','obfuscator.js','obfuscator.lua'):
        text = (ROOT / name).read_text()
        assert all(msg in text for msg in ANTI), name

    with tempfile.TemporaryDirectory() as td:
        td = pathlib.Path(td)
        a,b,c = td/'a.lua', td/'b.lua', td/'c.lua'
        run(sys.executable, 'obfuscator.py', str(FIXTURE), str(a), '--target', 'luau', '--seed', '424242')
        run(sys.executable, 'obfuscator.py', str(FIXTURE), str(b), '--target', 'luau', '--seed', '424242')
        run(sys.executable, 'obfuscator.py', str(FIXTURE), str(c), '--target', 'luau', '--seed', '424243')
        assert a.read_bytes() == b.read_bytes()
        assert a.read_bytes() != c.read_bytes()

        for target in TARGETS:
            out = run(sys.executable, 'validator.py', str(a), '--target', target, '--env', 'generic')
            assert out.stdout.startswith('VALID'), target

        lua_run = shutil.which('luatex')
        if lua_run:
            run(lua_run, '--luaonly', str(a))
            lua_out = td/'lua_impl.lua'
            run(lua_run, '--luaonly', 'obfuscator.lua', str(FIXTURE), str(lua_out), '--target', 'luau', '--seed', '424242')
            run(lua_run, '--luaonly', str(lua_out))

        if shutil.which('node'):
            js_out = td/'js.lua'
            script = "const fs=require('fs');const {obfuscate}=require('./obfuscator.js');const s=fs.readFileSync(process.argv[1],'utf8');fs.writeFileSync(process.argv[2],obfuscate(s,{target:'luau',seed:424242}));"
            run('node', '-e', script, str(FIXTURE), str(js_out))
            if lua_run:
                run(lua_run, '--luaonly', str(js_out))

        tampered = td/'tampered.lua'
        text = a.read_text()
        m = re.search(r'(local imnot\d+=\{)(\d+)', text)
        assert m, 'encoded payload table not found'
        replacement = str((int(m.group(2)) + 1) % 256)
        tampered.write_text(text[:m.start(2)] + replacement + text[m.end(2):])
        if lua_run:
            res = run(lua_run, '--luaonly', str(tampered), check=False)
            assert res.returncode != 0, 'tamper test did not fail'

    print('v8 smoke tests: PASS')

if __name__ == '__main__':
    main()
