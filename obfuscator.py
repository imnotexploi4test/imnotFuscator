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

MASTER_TPL = """local @VN@,@GSV@=(function() local @D@={@ENC@};local @O@="";local @GS@=0;for @I1@=1,#@D@ do @GS@=(@GS@*31+@D@[@I1@])%2147483647 end;@GS@=@GS@%256;for @I2@=1,#@D@ do local @BV@=@D@[@I2@];local @UR@=((@BV@*(2^(8-@ROT@)))%256)+math.floor(@BV@/(2^@ROT@));local @KX@=(@SEED@+@I2@*@MULT@)%256;local @RV@=0;local @VV@=1;local @AV@=@UR@;local @KV@=@KX@;for _=1,8 do if @AV@%2~=@KV@%2 then @RV@=@RV@+@VV@ end;@AV@=math.floor(@AV@/2);@KV@=math.floor(@KV@/2);@VV@=@VV@*2 end;@O@=@O@..string.char(@RV@) end;return @O@,@GS@ end)()"""

NORMAL_TPL = """local @VN@=(function():string local @D@={@ENC@};local @O@="";for @I2@=1,#@D@ do local @BV@=@D@[@I2@];local @UR@=((@BV@*(2^(8-@ROT@)))%256)+math.floor(@BV@/(2^@ROT@));local @KX@=(@SEED@+@GSVAR@+@I2@*@MULT@)%256;local @RV@=0;local @VV@=1;local @AV@=@UR@;local @KV@=@KX@;for _=1,8 do if @AV@%2~=@KV@%2 then @RV@=@RV@+@VV@ end;@AV@=math.floor(@AV@/2);@KV@=math.floor(@KV@/2);@VV@=@VV@*2 end;@O@=@O@..string.char(@RV@) end;return @O@ end)()"""

class Obfuscator:
    def __init__(self):
        self.ic = 0
        self.vm = {}
        self.bd = []
        self.gseed_name = None
        self.gseed_value = 0
        self.rw = {
            'and','break','do','else','elseif','end','false','for','function',
            'goto','if','in','local','nil','not','or','repeat','return','then',
            'true','until','while','continue','type','export','typeof','print',
            'pairs','ipairs','next','select','unpack','rawget','rawset','rawequal','rawlen',
            'tonumber','tostring','pcall','xpcall','error','warn','assert','setmetatable',
            'getmetatable','require','table','string','math','coroutine','os','io','debug','bit32',
            'utf8','task','wait','spawn','delay','tick','time','game','workspace',
            'script','Instance','Vector3','Vector2','CFrame','Color3','BrickColor',
            'UDim','UDim2','Enum','Ray','Region3','TweenInfo','NumberRange',
            'NumberSequence','ColorSequence','Rect','_G','_VERSION','shared',
            'self','new','Clone','Destroy','FindFirstChild','WaitForChild','GetChildren',
            'GetDescendants','IsA','GetService','Connect','Fire','Invoke','insert',
            'remove','sort','concat','find','sub','len','rep','reverse','upper',
            'lower','byte','char','format','match','gmatch','gsub','abs','ceil',
            'floor','max','min','sqrt','random','randomseed','sin','cos','tan',
            'huge','pi','clamp','lerp','getfenv','setfenv','loadstring','load','dofile',
            'collectgarbage'
        }

    def ni(self):
        self.ic += 1
        return f"imnot{self.ic}"

    def mx(self, a, b):
        r, bv = 0, 1
        for _ in range(8):
            if a % 2 != b % 2: r += bv
            a //= 2
            b //= 2
            bv *= 2
        return r

    def rl(self, v, r):
        if r == 0: return v
        res = ((v * (2 ** r)) % 256) + (v // (2 ** (8 - r)))
        return int(res)
        
    def fill(self, template, subs):
        s = template
        for k, v in subs.items():
            s = s.replace(f"@{k}@", str(v))
        return s

    def bs(self, s):
        is_master = (self.gseed_name is None)
        vn = self.ni()
        bts = [ord(c) for c in s]
        seed = random.randint(0, 255)
        mult = random.randint(1, 255)
        rot = random.randint(1, 7)
        offset = 0 if is_master else self.gseed_value
        
        xored = []
        for i, b in enumerate(bts):
            key = (seed + offset + (i + 1) * mult) % 256
            xored.append(self.rl(self.mx(b, key), rot))

        if is_master:
            gsv = self.ni()
            subs = {
                "VN": vn, "GSV": gsv, "D": self.ni(), "ENC": ",".join(str(e) for e in xored),
                "O": self.ni(), "GS": gsv, "I1": self.ni(), "I2": self.ni(), "BV": self.ni(),
                "UR": self.ni(), "KX": self.ni(), "RV": self.ni(), "VV": self.ni(),
                "AV": self.ni(), "KV": self.ni(), "ROT": rot, "SEED": seed, "MULT": mult
            }
            self.bd.append(self.fill(MASTER_TPL, subs))
            self.gseed_name = gsv
            self.gseed_value = 0
            for val in xored:
                self.gseed_value = (self.gseed_value * 31 + val) % 2147483647
            self.gseed_value %= 256
        else:
            subs = {
                "VN": vn, "D": self.ni(), "ENC": ",".join(str(e) for e in xored),
                "O": self.ni(), "I2": self.ni(), "BV": self.ni(), "UR": self.ni(),
                "KX": self.ni(), "RV": self.ni(), "VV": self.ni(), "AV": self.ni(),
                "KV": self.ni(), "ROT": rot, "SEED": seed, "MULT": mult, "GSVAR": self.gseed_name
            }
            self.bd.append(self.fill(NORMAL_TPL, subs))
        return vn

    def remove_comments(self, code):
        code = re.sub(r'--\[\[.*?\]\]', '', code, flags=re.DOTALL)
        lines = code.split('\n')
        result = []
        for line in lines:
            ins, sc, cl = False, '', ''
            i = 0
            while i < len(line):
                ch = line[i]
                if ins:
                    cl += ch
                    if ch == '\\':
                        i += 1
                        if i < len(line): cl += line[i]
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
        strings, result, i = [], '', 0
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
                if i < len(code): i += 1
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
            if v not in self.rw and v not in self.vm: self.vm[v] = self.ni()
        for m in re.finditer(r'\bfor\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[=,]', code):
            v = m.group(1)
            if v not in self.rw and v not in self.vm: self.vm[v] = self.ni()
        for m in re.finditer(r'\bfunction\s*[a-zA-Z0-9_.]*\s*\(([^)]*)\)', code):
            for p in m.group(1).split(','):
                p = re.sub(r'\s*:.*$', '', p.strip()).strip()
                if p and p not in self.rw and p not in self.vm: self.vm[p] = self.ni()
        sorted_vars = sorted(self.vm.items(), key=lambda x: -len(x[0]))
        result = code
        for original, renamed in sorted_vars:
            def make_replacer(new_name):
                def repl(match):
                    s = match.start()
                    if s > 0 and result[s - 1] in ('.', ':'): return match.group(0)
                    if '__STR_' in result[max(0, s - 6):s]: return match.group(0)
                    return new_name
                return repl
            pat = r'(?<![a-zA-Z0-9_.])' + re.escape(original) + r'(?![a-zA-Z0-9_])'
            result = re.sub(pat, make_replacer(renamed), result)
        return result

    def garbage(self, count):
        parts = []
        for _ in range(count):
            v = self.ni()
            r = random.randint(1, 8)
            if r == 1:
                parts.append(f"local {v}={random.randint(0, 999999)}")
            elif r == 2:
                parts.append(f"local {v}=(function()return {random.randint(0, 99999)} end)()")
            elif r == 3:
                nums = ','.join(str(random.randint(0, 999)) for _ in range(random.randint(2, 4)))
                parts.append(f"local {v}={{{nums}}}")
            elif r == 4:
                parts.append(f"local {v}={random.randint(0, 255)}+{random.randint(0, 255)}")
            elif r == 5:
                parts.append(f"local {v}=({random.randint(1, 500)}*{random.randint(1, 500)})-{random.randint(0, 9999)}")
            elif r == 6:
                sq = random.randint(2, 50)
                parts.append(f"if(({sq}*{sq})>=0)then local {v}={random.randint(0, 999)} end")
            elif r == 7:
                parts.append(f"local {v}=#(\"x\"):rep({random.randint(1, 20)})")
            else:
                parts.append(f"local {v}=(function() if math.random()>=0 then return {random.randint(1, 100)} else return {random.randint(1, 100)} end end)()")
        return ';'.join(parts)

    def minify(self, code):
        return ' '.join(l.strip() for l in code.split('\n') if l.strip())

    def obfuscate(self, source):
        self.ic = 0
        self.vm = {}
        self.bd = []
        self.gseed_name = None
        self.gseed_value = 0
        
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
        tm = self.bs("LOOL imagine you use the 25ms and Threaded to skid this thing lel")
        tm2 = self.bs("holy skid")
        tm3 = self.bs("nice try skid, but this aint gonna work for you lmaooo")
        im = self.bs("integrity check failed successfully. this script has been modified.")
        eem = self.bs("execute script error")

        ev, fv, sv, erv, pv, cvv, sp, sw, se, spc, sty = (self.ni() for _ in range(11))
        a1, a2, a3, a4, a5, a6, a7 = (self.ni() for _ in range(7))
        idd, ifn, sc = self.ni(), self.ni(), self.ni()

        ga = self.garbage(6)
        gb = self.garbage(8)
        gc = self.garbage(5)
        bm = self.minify(ws)
        ad = ';'.join(self.bd)
        
        checks = [
            f'local {a1}=(function():boolean local imnot_ok:boolean,imnot_t:any={spc}(function()return {sty}({se})=="function"end);if not imnot_ok or not imnot_t then {se}({tm})end;return true end)()',
            f'local {a2}=(function():boolean local imnot_checks={{{bce},{bcp},{bcts},{bcty}}};for imnot_ci=1,#imnot_checks do local imnot_fn:any={ev}[imnot_checks[imnot_ci]];if {sty}(imnot_fn)~="function"then {se}({tm2})end end;return true end)()',
            f'local {a3}=(function():boolean local imnot_dok:boolean,imnot_dlib:any={spc}(function()return {ev}[{bcdb}]end);if imnot_dok and imnot_dlib then local imnot_ghok:boolean,imnot_gh:any={spc}(function()return imnot_dlib[{bcgi}]end);if imnot_ghok and imnot_gh then local imnot_info:any=(imnot_gh::any)(1);if imnot_info and imnot_info.what=={bcc} then {se}({tm3})end end end;return true end)()',
            f'local {a4}=setmetatable({pv},{{[{bcni}]=function(){se}({tm})end,[{bcix}]=function(_imnot_self:any,imnot_key:any):any if imnot_key=={cvv} then return true end;return nil end}})',
            f'local {a5}=(function():boolean local imnot_cok:boolean,imnot_clib:any={spc}(function()return {ev}[{bcco}]end);if imnot_cok and imnot_clib then local imnot_running:any=imnot_clib.running;if imnot_running then(imnot_running::any)()end end;return true end)()',
            f'local {a6}=(function():boolean local imnot_c1ok:boolean,imnot_c1:any={spc}(function()return os.clock()end);if not imnot_c1ok or type(imnot_c1)~="number"then return true end;local imnot_acc=0;for imnot_ti=1,200000 do imnot_acc=imnot_acc+imnot_ti end;local imnot_c2ok:boolean,imnot_c2:any={spc}(function()return os.clock()end);if imnot_c2ok and type(imnot_c2)=="number"then if(imnot_c2-imnot_c1)>0.35 then {se}({tm3})end end;return true end)()',
            f'local {a7}=(function():boolean local imnot_rwok:boolean,imnot_rwr:any={spc}(function()return rawequal(1,1)end);if not imnot_rwok or imnot_rwr~=true then {se}({tm2})end;local imnot_rgok:boolean,imnot_rgr:any={spc}(function()local imnot_rt={{}};rawset(imnot_rt,1,1);return rawget(imnot_rt,1)end);if not imnot_rgok or imnot_rgr~=1 then {se}({tm2})end;return true end)()'
        ]
        random.shuffle(checks)
        checks_block = ';'.join(checks)
        
        check_names = [a1, a2, a3, a5, a6, a7]
        random.shuffle(check_names)
        sc_cond = "not " + " or not ".join(check_names)

        raw = [
            ad, f"local {ev}:any=_G", f"local {sp}=print", f"local {sw}=warn", f"local {se}=error",
            f"local {spc}=pcall", f"local {sty}=typeof or type", ga,
            f"local {pv}={{}}", f"local {cvv}={checksum}",
            checks_block, gb, f"local {idd}={checksum}",
            f"local {ifn}=function()if {idd}~={cvv} then {se}({im})end end", f"{ifn}()",
            f"local {fv}=function(){ifn}();{bm} end", gc,
            f"local {sc}=(function():boolean if {sc_cond} then {se}({tm})end;return true end)()",
            f"local {sv}:boolean,{erv}:any={spc}({fv})",
            f"if not {sv} then local imnot_handler:any={sw} or {sp} or function(...)end;(imnot_handler::any)({eem})end"
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
