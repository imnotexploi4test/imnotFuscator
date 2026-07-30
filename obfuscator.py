#!/usr/bin/env python3
import sys, os, random, re, secrets, string

HEADER = r"""--!nocheck
--[[
$$ \                                    $$\     $$$$$$$$\                                      $$\
\__|                                   $$ |    $$  _____|                                     $$ |
$$\ $$$$$$\$$$$\  $$$$$$$\   $$$$$$\ $$$$$$\   $$ |   $$\   $$\  $$$$$$$\  $$$$$$$\ $$$$$$\ $$$$$$\    $$$$$$\   $$$$$$\ 
$$ |$$  _$$  _$$\ $$  __$$\ $$  __$$\\_$$  _|  $$$$$\ $$ |  $$ |$$  _____|$$  _____|\____$$\\_$$  _|  $$  __$$\ $$  __$$\
$$ |$$ / $$ / $$ |$$ |  $$ |$$ /  $$ | $$ |    $$  __|$$ |  $$ |$$$$$$\  $$ /      $$$$$$$ | $$ |    $$ /  $$ |$$ |  \__|
$$ |$$ | $$ | $$ |$$ |  $$ |$$ |  $$ | $$ |$$\ $$ |   $$ |  $$ | \____$$\ $$ |     $$  __$$ | $$ |$$\ $$ |  $$ |$$ |
$$ |$$ | $$ | $$ |$$ |  $$ |\$$$$$$  | \$$$$  |$$ |   \$$$$$$  |$$$$$$$  |\$$$$$$$\\$$$$$$$ | \$$$$  |\$$$$$$  |$$ |
\__|\__| \__| \__|\__|  \__| \______/   \____/ \__|    \______/ \_______/  \_______|\_______|  \____/  \______/ \__|

                                                                                                                          Fully made by imnotexploi4 - V3 UPGRADED
]] -- imnotFuscator V3.0"""

FNV_INIT = 2166136261
FNV_PRIME = 16777619
MOD_HASH = 2147483647

MASTER_TPL = """local @VN@,@GSV@=(function() local @D@={@ENC@};local @O@="";local @GS@=@FNV_INIT@;for @I1@=1,#@D@ do @GS@=(@GS@*@FNV_PRIME@+@D@[@I1@])%2147483647 end;@GS@=@GS@%256;for @I2@=1,#@D@ do local @BV@=@D@[@I2@];local @UR@=((@BV@*(2^(8-@ROT@)))%256)+math.floor(@BV@/(2^@ROT@));local @KX@=(@SEED@+@I2@*@MULT@+@I2@*@I2@*@PRIME@)%256;local @SB@=(@UR@-@ADD@+256)%256;local @RV@=0;local @VV@=1;local @AV@=@SB@;local @KV@=@KX@;for _=1,8 do if @AV@%2~=@KV@%2 then @RV@=@RV@+@VV@ end;@AV@=math.floor(@AV@/2);@KV@=math.floor(@KV@/2);@VV@=@VV@*2 end;@O@=@O@..string.char(@RV@) end;return @O@,@GS@ end)()"""

NORMAL_TPL = """local @VN@=(function():string local @D@={@ENC@};local @O@="";for @I2@=1,#@D@ do local @BV@=@D@[@I2@];local @UR@=((@BV@*(2^(8-@ROT@)))%256)+math.floor(@BV@/(2^@ROT@));local @KX@=(@SEED@+@GSVAR@+@I2@*@MULT@+@I2@*@I2@*@PRIME@)%256;local @SB@=(@UR@-@ADD@+256)%256;local @RV@=0;local @VV@=1;local @AV@=@SB@;local @KV@=@KX@;for _=1,8 do if @AV@%2~=@KV@%2 then @RV@=@RV@+@VV@ end;@AV@=math.floor(@AV@/2);@KV@=math.floor(@KV@/2);@VV@=@VV@*2 end;@O@=@O@..string.char(@RV@) end;return @O@ end)()"""

SERVICE_LIST = [
    "Players","ReplicatedStorage","Workspace","Lighting","StarterGui","StarterPack",
    "StarterPlayer","Teams","SoundService","Chat","ReplicatedFirst","HttpService",
    "RunService","UserInputService","TweenService","MarketplaceService","DataStoreService"
]
INSTANCE_LIST = ["Part","Script","LocalScript","RemoteEvent","RemoteFunction","Folder","Model","ScreenGui","Frame","TextLabel"]
OPAQUE_TRUE = [
    '((10*10)==100)','((math.sqrt(16)==4))','(#{1,2,3}==3)','(string.len("imnot")==5)','((5%2)==1)',
    '(math.floor(7.9)==7)','(math.ceil(2.1)==3)','(not false)','((true or false)==true)','((false==false))',
    '((math.abs(-5)==5))','((2^3)==8)','(string.sub("abc",1,1)=="a")','(type({})=="table")'
]
OPAQUE_FALSE = [
    '((10*10)==99)','((math.sqrt(16)==5))','(#{1,2,3}==4)','(string.len("imnot")==6)','((5%2)==0)',
    '(false and true)','((true==false))','((1+1)==3)','(nil~=nil)'
]

class Obfuscator:
    def __init__(self, options=None):
        self.ic = 0
        self.vm = {}
        self.bd = []
        self.gseed_name = None
        self.gseed_value = 0
        self.opts = {
            'renameVars': True,
            'encodeStrings': True,
            'encodeNumbers': True,
            'encodeBooleans': True,
            'addGarbage': True,
            'garbageAmount': 6,
            'addAntiTamper': True,
            'controlFlow': True,
            'minify': True,
        }
        if options:
            self.opts.update(options)
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

    def sr(self, a, b):
        try:
            return secrets.randbelow(b - a + 1) + a
        except:
            return random.randint(a,b)

    def ni(self):
        self.ic += 1
        conf = ['l','I','i','_','L']
        letters = string.ascii_letters
        suffix = ''
        l = self.sr(1,3)
        for _ in range(l):
            if random.random() < 0.6:
                suffix += random.choice(conf)
            else:
                suffix += random.choice(letters)
        return f"imnot{self.ic}{suffix}"

    def mx(self, a, b):
        r, bv = 0, 1
        for _ in range(8):
            if a % 2 != b % 2: r += bv
            a //= 2
            b //= 2
            bv *= 2
        return r & 255

    def rl(self, v, r):
        if r == 0: return v & 255
        res = ((v * (2 ** r)) % 256) + (v // (2 ** (8 - r)))
        return int(res) & 255
        
    def fill(self, template, subs):
        s = template
        for k, v in subs.items():
            s = s.replace(f"@{k}@", str(v))
        return s

    def bs(self, s):
        if not self.opts.get('encodeStrings', True):
            vn = self.ni()
            esc = s.replace('\\','\\\\').replace('"','\\"').replace('\n','\\n')
            self.bd.append(f'local {vn}="{esc}"')
            return vn
        is_master = (self.gseed_name is None)
        vn = self.ni()
        bts = [ord(c) & 255 for c in s]
        seed = self.sr(0, 255)
        mult = self.sr(1, 255) | 1
        rot = self.sr(1, 7)
        add = self.sr(0, 255)
        primes = [3,5,7,11,13,17,19,31,53,97]
        prime = random.choice(primes)
        offset = 0 if is_master else self.gseed_value
        
        xored = []
        for i, b in enumerate(bts):
            ii = i+1
            key = (seed + offset + ii*mult + ii*ii*prime) % 256
            x = self.mx(b, key)
            tmp = (x + add) % 256
            xored.append(self.rl(tmp, rot))

        if is_master:
            gsv = self.ni()
            h = FNV_INIT
            for val in xored:
                h = (h * FNV_PRIME + val) % MOD_HASH
            gval = h % 256
            subs = {
                "VN": vn, "GSV": gsv, "D": self.ni(), "ENC": ",".join(str(e) for e in xored),
                "O": self.ni(), "GS": gsv, "I1": self.ni(), "I2": self.ni(), "BV": self.ni(),
                "UR": self.ni(), "KX": self.ni(), "SB": self.ni(), "RV": self.ni(), "VV": self.ni(),
                "AV": self.ni(), "KV": self.ni(), "ROT": rot, "SEED": seed, "MULT": mult,
                "ADD": add, "PRIME": prime, "FNV_INIT": FNV_INIT, "FNV_PRIME": FNV_PRIME
            }
            self.bd.append(self.fill(MASTER_TPL, subs))
            self.gseed_name = gsv
            self.gseed_value = gval
        else:
            subs = {
                "VN": vn, "D": self.ni(), "ENC": ",".join(str(e) for e in xored),
                "O": self.ni(), "I2": self.ni(), "BV": self.ni(), "UR": self.ni(),
                "KX": self.ni(), "SB": self.ni(), "RV": self.ni(), "VV": self.ni(),
                "AV": self.ni(), "KV": self.ni(), "ROT": rot, "SEED": seed, "MULT": mult,
                "ADD": add, "PRIME": prime, "GSVAR": self.gseed_name
            }
            self.bd.append(self.fill(NORMAL_TPL, subs))
        return vn

    def remove_comments(self, code):
        code = re.sub(r'--\[=+\[.*?\]={0,}\]', '', code, flags=re.DOTALL)
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
            if code[i] == '[':
                # check long bracket
                j = i+1
                eq = 0
                while j < len(code) and code[j] == '=':
                    eq+=1; j+=1
                if j < len(code) and code[j] == '[':
                    close = ']' + '='*eq + ']'
                    ei = code.find(close, j+1)
                    if ei != -1:
                        content = code[j+1:ei]
                        strings.append(content)
                        result += f"__STR_{len(strings)-1}__"
                        i = ei + len(close)
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
                result += f"__STR_{len(strings)-1}__"
                continue
            result += code[i]
            i += 1
        return result, strings

    def process_escapes(self, s):
        return (s.replace('\\n', '\n').replace('\\t', '\t')
                 .replace('\\r', '\r').replace('\\\\', '\\')
                 .replace('\\"', '"').replace("\\'", "'"))

    def rename_vars(self, code):
        if not self.opts.get('renameVars', True):
            return code
        for m in re.finditer(r'\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)', code):
            v = m.group(1)
            if v not in self.rw and v not in self.vm: self.vm[v] = self.ni()
        for m in re.finditer(r'\blocal\s+function\s+([a-zA-Z_][a-zA-Z0-9_]*)', code):
            v = m.group(1)
            if v not in self.rw and v not in self.vm: self.vm[v] = self.ni()
        for m in re.finditer(r'\bfor\s+([a-zA-Z_][a-zA-Z0-9_,\s]*?)\s+in\b', code):
            for v in m.group(1).split(','):
                v = v.strip()
                if v and v not in self.rw and v not in self.vm and re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', v):
                    self.vm[v] = self.ni()
        for m in re.finditer(r'\bfor\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=', code):
            v = m.group(1)
            if v not in self.rw and v not in self.vm: self.vm[v] = self.ni()
        for m in re.finditer(r'\bfunction\s*[a-zA-Z0-9_.:]*\s*\(([^)]*)\)', code):
            for p in m.group(1).split(','):
                p = re.sub(r'\s*:.*$', '', p.strip()).strip().split('=')[0].strip()
                if p and re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', p) and p not in self.rw and p not in self.vm:
                    self.vm[p] = self.ni()
        sorted_vars = sorted(self.vm.items(), key=lambda x: -len(x[0]))
        result = code
        for orig, renamed in sorted_vars:
            # avoid placeholder
            def repl(match, new_name=renamed):
                s = match.group(1)
                e = match.group(2)
                return s + new_name + e
            # use boundaries
            pat = r'([^a-zA-Z0-9_.])' + re.escape(orig) + r'([^a-zA-Z0-9_])'
            # iterative
            for _ in range(3):
                result = re.sub(pat, lambda m, nn=renamed: m.group(1)+nn+m.group(2), result)
            result = re.sub(r'^' + re.escape(orig) + r'([^a-zA-Z0-9_])', lambda m, nn=renamed: nn+m.group(1), result)
            result = re.sub(r'([^a-zA-Z0-9_.])' + re.escape(orig) + r'$', lambda m, nn=renamed: m.group(1)+nn, result)
        return result

    def encode_number(self, n):
        r = self.sr(1,5)
        if r == 1:
            a = self.sr(10,500)
            b = self.sr(10,500)
            c = a + b - n
            return f"({a}+{b}-{c})"
        elif r == 2:
            a = self.sr(10,200)
            b = n + a
            return f"({b}-{a})"
        elif r == 3:
            a = self.sr(2,20)
            b = n * a
            return f"(math.floor({b}/{a}))"
        elif r == 4:
            if n < 256:
                x = self.sr(0,255)
                y = self.mx(n & 255, x)
                return f"((function(a,b)local r=0;local v=1;for _=1,8 do if a%2~=b%2 then r=r+v end;a=math.floor(a/2);b=math.floor(b/2);v=v*2 end;return r end)({x},{y}))"
            a = self.sr(100,1000)
            b = n - a
            return f"({a}+{b})"
        else:
            a = self.sr(1,100)
            b = self.sr(1,100)
            c = self.sr(1,50)
            target = a + b*c
            diff = target - n
            return f"({a}+{b}*{c}-{diff})"

    def obfuscate_numbers(self, code):
        if not self.opts.get('encodeNumbers', True):
            return code
        # protect placeholders already removed
        def repl(m):
            txt = m.group(0)
            # ensure not part of larger number with dot
            num_str = m.group(1)
            try:
                n = int(num_str)
            except:
                return txt
            if n > 1000000: return txt
            if random.random() < 0.12: return txt
            return m.group(0)[0] + self.encode_number(n) + m.group(0)[-1] if len(m.group(0))>len(num_str) else self.encode_number(n)
        # pattern includes boundaries to keep them
        # simpler: use lambda that returns encoded with same surrounding chars
        pattern = r'(?<![a-zA-Z0-9_])(\d+)(?![a-zA-Z0-9_\.])'
        return re.sub(pattern, lambda mo: self.encode_number(int(mo.group(1))), code)

    def obfuscate_booleans(self, code):
        if not self.opts.get('encodeBooleans', True):
            return code
        true_pool = ['(1==1)','(not false)','(true or false)','(#{1}==1)','(not nil)']
        false_pool = ['(1~=1)','(not true)','(false and true)','(nil==true)']
        code = re.sub(r'\btrue\b', lambda m: random.choice(true_pool), code)
        code = re.sub(r'\bfalse\b', lambda m: random.choice(false_pool), code)
        return code

    def apply_control_flow(self, code):
        if not self.opts.get('controlFlow', True):
            return code
        stmts = code.split(';')
        res = []
        for s in stmts:
            st = s.strip()
            if not st: continue
            is_local = st.lstrip().startswith('local')
            if not is_local and random.random() < 0.35:
                cond = random.choice(OPAQUE_TRUE)
                st = f"if {cond} then {st} end"
            res.append(st)
            if random.random() < 0.18:
                condF = random.choice(OPAQUE_FALSE)
                g = self.garbage(1, simple=True)
                res.append(f"if {condF} then {g} end")
        return ';'.join(res)

    def garbage(self, count, simple=False):
        parts = []
        for _ in range(count):
            v = self.ni()
            r = self.sr(1, 12 if not simple else 5)
            if r == 1:
                parts.append(f"local {v}={self.sr(0, 999999)}")
            elif r == 2:
                parts.append(f"local {v}=(function()return {self.sr(0, 99999)} end)()")
            elif r == 3:
                nums = ','.join(str(self.sr(0, 999)) for _ in range(self.sr(2, 4)))
                parts.append(f"local {v}={{{nums}}}")
            elif r == 4:
                parts.append(f"local {v}={self.sr(0, 255)}+{self.sr(0, 255)}*{self.sr(1,5)}")
            elif r == 5:
                parts.append(f"local {v}=(function() if math.random()>=0 then return {self.sr(1, 100)} else return {self.sr(1, 100)} end end)()")
            elif r == 6:
                svc = random.choice(SERVICE_LIST)
                parts.append(f'local {v}=(game and game.GetService and (function() local ok,res=pcall(function() return game:GetService("{svc}") end) return ok and res or nil end)() or nil)')
            elif r == 7:
                inst = random.choice(INSTANCE_LIST)
                parts.append(f'local {v}=(Instance and Instance.new and (function() local ok,res=pcall(function() return Instance.new("{inst}") end) return ok and res or nil end)() or nil)')
            elif r == 8:
                parts.append(f"local {v}=(Vector3 and Vector3.new and Vector3.new({self.sr(0,100)},{self.sr(0,100)},{self.sr(0,100)}) or nil)")
            elif r == 9:
                sq = self.sr(2, 50)
                parts.append(f"if(({sq}*{sq})>=0)then local {v}={self.sr(0, 999)} end")
            elif r == 10:
                parts.append(f"local {v}={random.choice(OPAQUE_TRUE)} and {self.sr(0,500)} or {self.sr(0,500)}")
            elif r == 11:
                parts.append(f"local {v}=(CFrame and CFrame.new and CFrame.new({self.sr(0,50)},{self.sr(0,50)},{self.sr(0,50)}) or nil)")
            else:
                parts.append(f"local {v}=(workspace and workspace.FindFirstChild and (function() local ok,res=pcall(function() return workspace:FindFirstChild(\"{self.ni()}\") end) return ok and res or nil end)() or nil)")
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
        renamed = self.rename_vars(cns) if self.opts.get('renameVars', True) else cns
        ws = renamed
        for i in range(len(strings)):
            ph = f"__STR_{i}__"
            processed = self.process_escapes(strings[i])
            vr = self.bs(processed)
            ws = ws.replace(ph, vr, 1)

        if self.opts.get('encodeNumbers', True):
            ws = self.obfuscate_numbers(ws)
        if self.opts.get('encodeBooleans', True):
            ws = self.obfuscate_booleans(ws)
        if self.opts.get('controlFlow', True):
            ws = self.apply_control_flow(ws)

        checksum = 0
        for c in ws:
            checksum = (checksum * FNV_PRIME + ord(c)) % MOD_HASH

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
        bcc = self.bs("C")
        bcstr = self.bs("string")
        bcdump = self.bs("dump")
        bcg = self.bs("_G")
        bcls = self.bs("loadstring")
        bctask = self.bs("task")
        bcwait = self.bs("wait")
        tm = self.bs("LOOL imagine you use the 25ms and Threaded to skid this thing lel")
        tm2 = self.bs("holy skid")
        tm3 = self.bs("nice try skid, but this aint gonna work for you lmaooo")
        im = self.bs("integrity check failed successfully. this script has been modified.")
        eem = self.bs("execute script error")
        envPol = self.bs("environment polluted")

        ev, fv, sv, erv, pv, cvv, sp, sw, se, spc, sty, sgmeta = (self.ni() for _ in range(12))
        at_vars = [self.ni() for _ in range(11)]
        a1,a2,a3,a4,a5,a6,a7,a8,a9,a10,a11 = at_vars
        idd, ifn, sc, jv = self.ni(), self.ni(), self.ni(), self.ni()

        ga = self.garbage(self.opts.get('garbageAmount',6)) if self.opts.get('addGarbage',True) else ""
        gb = self.garbage(self.opts.get('garbageAmount',6)+2) if self.opts.get('addGarbage',True) else ""
        gc = self.garbage(5) if self.opts.get('addGarbage',True) else ""
        bm = self.minify(ws) if self.opts.get('minify',True) else ws
        ad = ';'.join(self.bd)
        
        checks = []
        if self.opts.get('addAntiTamper', True):
            checks = [
                f'local {a1}=(function():boolean local imnot_ok:boolean,imnot_t:any={spc}(function()return {sty}({se})=="function"end);if not imnot_ok or not imnot_t then {se}({tm})end;return true end)()',
                f'local {a2}=(function():boolean local imnot_checks={{{bce},{bcp},{bcts},{bcty}}};for imnot_ci=1,#imnot_checks do local imnot_fn:any={ev}[imnot_checks[imnot_ci]];if {sty}(imnot_fn)~="function"then {se}({tm2})end end;return true end)()',
                f'local {a3}=(function():boolean local imnot_dok:boolean,imnot_dlib:any={spc}(function()return {ev}[{bcdb}]end);if imnot_dok and imnot_dlib then local imnot_ghok:boolean,imnot_gh:any={spc}(function()return imnot_dlib[{bcgi}]end);if imnot_ghok and imnot_gh then local imnot_info:any=(imnot_gh::any)(1);if imnot_info and imnot_info.what=={bcc} then {se}({tm3})end end end;return true end)()',
                f'local {a4}=setmetatable({pv},{{[{bcni}]=function(){se}({tm})end,[{bcix}]=function(_imnot_self:any,imnot_key:any):any if imnot_key=={cvv} then return true end;return nil end}})',
                f'local {a5}=(function():boolean local imnot_cok:boolean,imnot_clib:any={spc}(function()return {ev}[{bcco}]end);if imnot_cok and imnot_clib then local imnot_running:any=imnot_clib.running;if imnot_running then(imnot_running::any)()end end;return true end)()',
                f'local {a6}=(function():boolean local imnot_c1ok:boolean,imnot_c1:any={spc}(function()return os.clock()end);if not imnot_c1ok or type(imnot_c1)~="number"then return true end;local imnot_acc=0;for imnot_ti=1,200000 do imnot_acc=imnot_acc+imnot_ti end;local imnot_c2ok:boolean,imnot_c2:any={spc}(function()return os.clock()end);if imnot_c2ok and type(imnot_c2)=="number"then if(imnot_c2-imnot_c1)>0.35 then {se}({tm3})end end;return true end)()',
                f'local {a7}=(function():boolean local imnot_rwok:boolean,imnot_rwr:any={spc}(function()return rawequal(1,1)end);if not imnot_rwok or imnot_rwr~=true then {se}({tm2})end;local imnot_rgok:boolean,imnot_rgr:any={spc}(function()local imnot_rt={{}};rawset(imnot_rt,1,1);return rawget(imnot_rt,1)end);if not imnot_rgok or imnot_rgr~=1 then {se}({tm2})end;return true end)()',
                f'local {a8}=(function():boolean local imnot_mt_ok,imnot_mt_val={spc}(function()return getmetatable(_G)end);if imnot_mt_ok and imnot_mt_val~=nil then {se}({envPol}) end;return true end)()',
                f'local {a9}=(function():boolean local imnot_sok:boolean,imnot_slib:any={spc}(function()return {ev}[{bcstr}]end);if imnot_sok and imnot_slib then local imnot_dok:boolean,imnot_dump:any={spc}(function()return imnot_slib[{bcdump}]end);if imnot_dok and imnot_dump then local imnot_dtest:any={spc}(function()return imnot_dump(function()end)end) end end;return true end)()',
                f'local {a10}=(function():boolean local imnot_tok:boolean,imnot_tlib:any={spc}(function()return {ev}[{bctask}]end);if imnot_tok and imnot_tlib then if {sty}(imnot_tlib[{bcwait}])~="function" then {se}({tm2}) end end;return true end)()',
                f'local {a11}=(function():boolean local imnot_lsok:boolean,imnot_ls:any={spc}(function()return {ev}[{bcls}] or {ev}.load end);if imnot_lsok and imnot_ls then if {sty}(imnot_ls)~="function" then {se}({tm}) end end;return true end)()'
            ]
        random.shuffle(checks)
        checks_block = ';'.join(checks)
        
        check_names = [a1,a2,a3,a5,a6,a7,a8,a9,a10,a11]
        random.shuffle(check_names)
        sc_cond = "not " + " or not ".join(check_names) if check_names else "false"

        raw_parts = [
            ad, f"local {ev}:any=_G", f"local {sp}=print", f"local {sw}=warn", f"local {se}=error",
            f"local {spc}=pcall", f"local {sty}=typeof or type", f"local {sgmeta}=getmetatable", ga,
            f"local {pv}={{}}", f"local {cvv}={checksum}", f"local {jv}=math.random(1,999999)",
            checks_block, gb, f"local {idd}={checksum}",
            f"local {ifn}=function()if {idd}~={cvv} then {se}({im})end end", f"{ifn}()",
            f"local {fv}=function(){ifn}();{bm} end", gc,
        ]
        if self.opts.get('addAntiTamper', True):
            raw_parts.append(f"local {sc}=(function():boolean if {sc_cond} then {se}({tm})end;return true end)()")
        raw_parts.extend([
            f"local {sv}:boolean,{erv}:any={spc}({fv})",
            f"if not {sv} then local imnot_handler:any={sw} or {sp} or function(...)end;(imnot_handler::any)({eem})end"
        ])

        return HEADER + "\n" + ';'.join([p for p in raw_parts if p])

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
