#!/usr/bin/env python3
import sys, os, random, re

HEADER = r"""--[[
$$\                                    $$\     $$$$$$$$\                                      $$\
\__|                                   $$ |    $$  _____|                                     $$ |
$$\ $$$$$$\$$$$\  $$$$$$$\   $$$$$$\ $$$$$$\   $$ |   $$\   $$\  $$$$$$$\  $$$$$$$\ $$$$$$\ $$$$$$\    $$$$$$\   $$$$$$\
$$ |$$  _$$  _$$\ $$  __$$\ $$  __$$\\_$$  _|  $$$$$\ $$ |  $$ |$$  _____|$$  _____|\____$$\\_$$  _|  $$  __$$\ $$  __$$\
$$ |$$ / $$ / $$ |$$ |  $$ |$$ /  $$ | $$ |    $$  __|$$ |  $$ |\$$$$$$\  $$ /      $$$$$$$ | $$ |    $$ /  $$ |$$ |  \__|
$$ |$$ | $$ | $$ |$$ |  $$ |$$ |  $$ | $$ |$$\ $$ |   $$ |  $$ | \____$$\ $$ |     $$  __$$ | $$ |$$\ $$ |  $$ |$$ |
$$ |$$ | $$ | $$ |$$ |  $$ |\$$$$$$  | \$$$$  |$$ |   \$$$$$$  |$$$$$$$  |\$$$$$$$\\$$$$$$$ | \$$$$  |\$$$$$$  |$$ |
\__|\__| \__| \__|\__|  \__| \______/   \____/ \__|    \______/ \_______/  \_______|\_______|  \____/  \______/ \__|


                                                                                                                          Fully made by imnotexploi4 (A.K.A the_baconthecheat)
]]"""


class Obfuscator:
    def __init__(self):
        self.ic = 0
        self.vm = {}
        self.bd = []
        self.rw = {
            'and','break','do','else','elseif','end','false','for',
            'function','goto','if','in','local','nil','not','or',
            'repeat','return','then','true','until','while','continue',
            'type','export','typeof','print','pairs','ipairs','next',
            'select','unpack','rawget','rawset','rawequal','rawlen',
            'tonumber','tostring','pcall','xpcall','error','warn',
            'assert','setmetatable','getmetatable','require','table',
            'string','math','coroutine','os','io','debug','bit32',
            'utf8','task','wait','spawn','delay','tick','time','game',
            'workspace','script','Instance','Vector3','Vector2',
            'CFrame','Color3','BrickColor','UDim','UDim2','Enum',
            'Ray','Region3','TweenInfo','NumberRange',
            'NumberSequence','ColorSequence','Rect','_G','_VERSION',
            'shared','self','new','Clone','Destroy','FindFirstChild',
            'WaitForChild','GetChildren','GetDescendants','IsA',
            'GetService','Connect','Fire','Invoke','insert','remove',
            'sort','concat','find','sub','len','rep','reverse',
            'upper','lower','byte','char','format','match','gmatch',
            'gsub','abs','ceil','floor','max','min','sqrt','random',
            'randomseed','sin','cos','tan','huge','pi','clamp',
            'lerp','getfenv','setfenv','loadstring','load','dofile',
            'collectgarbage'
        }

    def ni(self):
        self.ic += 1
        return f"imnot{self.ic}"

    def bs(self, s):
        vn = self.ni()
        bts = [ord(c) for c in s]
        key = random.randint(20, 220)
        xored = [b ^ key for b in bts]
        d = self.ni()
        o = self.ni()
        x = self.ni()
        bv = self.ni()
        rv = self.ni()
        vv = self.ni()
        av = self.ni()
        kv = self.ni()
        enc = ','.join(str(e) for e in xored)
        self.bd.append(
            f'local {vn}=(function():string local {d}={{{enc}}};'
            f'local {o}="";for {x}=1,#{d} do local {bv}={d}[{x}];'
            f'local {rv}=0;local {vv}=1;local {av}={bv};local {kv}={key};'
            f'for _=1,8 do if {av}%2~={kv}%2 then {rv}={rv}+{vv} end;'
            f'{av}=math.floor({av}/2);{kv}=math.floor({kv}/2);'
            f'{vv}={vv}*2 end;{o}={o}..string.char({rv})end;'
            f'return {o} end)()'
        )
        return vn

    def remove_comments(self, code):
        code = re.sub(r'--\[\[.*?\]\]', '', code, flags=re.DOTALL)
        lines = code.split('\n')
        result = []
        for line in lines:
            ins = False
            sc = ''
            cl = ''
            i = 0
            while i < len(line):
                ch = line[i]
                if ins:
                    cl += ch
                    if ch == '\\':
                        i += 1
                        if i < len(line):
                            cl += line[i]
                    elif ch == sc:
                        ins = False
                else:
                    if ch in ('"', "'"):
                        ins = True
                        sc = ch
                        cl += ch
                    elif ch == '-' and i + 1 < len(line) and line[i + 1] == '-':
                        break
                    else:
                        cl += ch
                i += 1
            result.append(cl)
        return '\n'.join(result)

    def extract_strings(self, code):
        strings = []
        result = ''
        i = 0
        while i < len(code):
            if code[i] == '[' and i + 1 < len(code) and code[i + 1] == '[':
                ei = code.find(']]', i + 2)
                if ei != -1:
                    strings.append(code[i + 2:ei])
                    result += f"__STR_{len(strings) - 1}__"
                    i = ei + 2
                    continue
            if code[i] in ('"', "'"):
                q = code[i]
                s = ''
                i += 1
                while i < len(code) and code[i] != q:
                    if code[i] == '\\':
                        s += code[i]
                        i += 1
                        if i < len(code):
                            s += code[i]
                            i += 1
                        continue
                    s += code[i]
                    i += 1
                if i < len(code):
                    i += 1
                strings.append(s)
                result += f"__STR_{len(strings) - 1}__"
                continue
            result += code[i]
            i += 1
        return result, strings

    def process_escapes(self, s):
        return (s.replace('\\n', '\n').replace('\\t', '\t')
                 .replace('\\r', '\r').replace('\\\\', '\\')
                 .replace('\\"', '"').replace("\\'", "'"))

    def rename_vars(self, code):
        for m in re.finditer(r'\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)', code):
            v = m.group(1)
            if v not in self.rw and v not in self.vm:
                self.vm[v] = self.ni()
        for m in re.finditer(r'\bfor\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[=,]', code):
            v = m.group(1)
            if v not in self.rw and v not in self.vm:
                self.vm[v] = self.ni()
        for m in re.finditer(r'\bfunction\s*[a-zA-Z0-9_.]*\s*\(([^)]*)\)', code):
            for p in m.group(1).split(','):
                p = re.sub(r'\s*:.*$', '', p.strip()).strip()
                if p and p not in self.rw and p not in self.vm:
                    self.vm[p] = self.ni()
        sorted_vars = sorted(self.vm.items(), key=lambda x: -len(x[0]))
        result = code
        for original, renamed in sorted_vars:
            def make_replacer(new_name):
                def repl(match):
                    s = match.start()
                    if s > 0 and result[s - 1] in ('.', ':'):
                        return match.group(0)
                    if '__STR_' in result[max(0, s - 6):s]:
                        return match.group(0)
                    return new_name
                return repl
            pat = (r'(?<![a-zA-Z0-9_.])'
                   + re.escape(original)
                   + r'(?![a-zA-Z0-9_])')
            result = re.sub(pat, make_replacer(renamed), result)
        return result

    def garbage(self, count):
        parts = []
        for _ in range(count):
            v = self.ni()
            r = random.randint(1, 5)
            if r == 1:
                parts.append(f"local {v}={random.randint(0, 999999)}")
            elif r == 2:
                parts.append(
                    f"local {v}=(function()return "
                    f"{random.randint(0, 99999)} end)()"
                )
            elif r == 3:
                nums = ','.join(
                    str(random.randint(0, 999))
                    for _ in range(random.randint(2, 4))
                )
                parts.append(f"local {v}={{{nums}}}")
            elif r == 4:
                parts.append(
                    f"local {v}={random.randint(0, 255)}"
                    f"+{random.randint(0, 255)}"
                )
            else:
                parts.append(
                    f"local {v}=({random.randint(1, 500)}"
                    f"*{random.randint(1, 500)})"
                    f"-{random.randint(0, 9999)}"
                )
        return ';'.join(parts)

    def minify(self, code):
        return ' '.join(
            l.strip() for l in code.split('\n') if l.strip()
        )

    def obfuscate(self, source):
        self.ic = 0
        self.vm = {}
        self.bd = []
        code = self.remove_comments(source)
        cns, strings = self.extract_strings(code)
        renamed = self.rename_vars(cns)
        ws = renamed
        for i in range(len(strings)):
            ph = f"__STR_{i}__"
            processed = self.process_escapes(strings[i])
            vr = self.bs(processed)
            ws = ws.replace(ph, vr, 1)

        checksum = 0
        for c in ws:
            checksum = ((checksum * 31) + ord(c)) % 2147483647

        bce = self.bs("error")
        bcp = self.bs("pcall")
        bcts = self.bs("tostring")
        bcty = self.bs("type")
        bcw = self.bs("warn")
        bcpr = self.bs("print")
        bcni = self.bs("__newindex")
        bcix = self.bs("__index")
        bcdb = self.bs("debug")
        bcgi = self.bs("getinfo")
        bcco = self.bs("coroutine")
        bcfn = self.bs("function")
        bcc = self.bs("C")
        tm = self.bs(
            "LOOL imagine you use the 25ms and 333ms "
            "to skid this thing lel"
        )
        tm2 = self.bs(
            "Anti-tamper triggered. This script is protected."
        )
        tm3 = self.bs(
            "Nice try skid, but this aint gonna "
            "work for you lmaooo"
        )
        im = self.bs(
            "Integrity check failed. Script has been modified."
        )
        eem = self.bs("Script execution error")

        ev = self.ni()
        fv = self.ni()
        sv = self.ni()
        erv = self.ni()
        pv = self.ni()
        cvv = self.ni()
        sp = self.ni()
        sw = self.ni()
        se = self.ni()
        spc = self.ni()
        sty = self.ni()
        a1 = self.ni()
        a2 = self.ni()
        a3 = self.ni()
        a4 = self.ni()
        a5 = self.ni()
        idd = self.ni()
        ifn = self.ni()
        sc = self.ni()

        ga = self.garbage(6)
        gb = self.garbage(8)
        gc = self.garbage(5)
        bm = self.minify(ws)
        ad = ';'.join(self.bd)

        raw = [
            ad,
            f"local {ev}:any=_G",
            f"local {sp}=print",
            f"local {sw}=warn",
            f"local {se}=error",
            f"local {spc}=pcall",
            f"local {sty}=typeof or type",
            ga,
            f"local {pv}={{}}",
            f"local {cvv}={checksum}",
            (
                f'local {a1}=(function():boolean '
                f'local imnot_ok:boolean,imnot_t:any='
                f'{spc}(function()return {sty}({se})=='
                f'"function"end);if not imnot_ok or not '
                f'imnot_t then {se}({tm})end;return true end)()'
            ),
            (
                f'local {a2}=(function():boolean '
                f'local imnot_checks={{{bce},{bcp},{bcts},{bcty}}};'
                f'for imnot_ci=1,#imnot_checks do '
                f'local imnot_fn:any={ev}[imnot_checks[imnot_ci]];'
                f'if {sty}(imnot_fn)~="function"then '
                f'{se}({tm2})end end;return true end)()'
            ),
            (
                f'local {a3}=(function():boolean '
                f'local imnot_dok:boolean,imnot_dlib:any='
                f'{spc}(function()return {ev}[{bcdb}]end);'
                f'if imnot_dok and imnot_dlib then '
                f'local imnot_ghok:boolean,imnot_gh:any='
                f'{spc}(function()return imnot_dlib[{bcgi}]end);'
                f'if imnot_ghok and imnot_gh then '
                f'local imnot_info:any=(imnot_gh::any)(1);'
                f'if imnot_info and imnot_info.what=={bcc} then '
                f'{se}({tm3})end end end;return true end)()'
            ),
            (
                f'local {a4}=setmetatable({pv},'
                f'{{[{bcni}]=function(){se}({tm})end,'
                f'[{bcix}]=function(_imnot_self:any,'
                f'imnot_key:any):any '
                f'if imnot_key=={cvv} then return true end;'
                f'return nil end}})'
            ),
            (
                f'local {a5}=(function():boolean '
                f'local imnot_cok:boolean,imnot_clib:any='
                f'{spc}(function()return {ev}[{bcco}]end);'
                f'if imnot_cok and imnot_clib then '
                f'local imnot_running:any=imnot_clib.running;'
                f'if imnot_running then '
                f'(imnot_running::any)()end end;'
                f'return true end)()'
            ),
            gb,
            f"local {idd}={checksum}",
            (
                f"local {ifn}=function()if {idd}~={cvv} "
                f"then {se}({im})end end"
            ),
            f"{ifn}()",
            f"local {fv}=function(){ifn}();{bm} end",
            gc,
            (
                f"local {sc}=(function():boolean "
                f"if not {a1} or not {a2} or not {a3} "
                f"or not {a5} then {se}({tm})end;"
                f"return true end)()"
            ),
            f"local {sv}:boolean,{erv}:any={spc}({fv})",
            (
                f"if not {sv} then local imnot_handler:any="
                f"{sw} or {sp} or function(...)end;"
                f"(imnot_handler::any)({eem})end"
            )
        ]

        return HEADER + "\n" + ';'.join(raw)


def main():
    if len(sys.argv) < 3:
        print("Usage: python obfuscator.py <input> <output>")
        sys.exit(1)
    try:
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            source = f.read()
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)

    result = Obfuscator().obfuscate(source)

    try:
        with open(sys.argv[2], 'w', encoding='utf-8') as f:
            f.write(result)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
    print("OK")


if __name__ == '__main__':
    main()
